/**
 * prospect-directory/route.ts
 * GET — returns 1 real target + randomized decoys for Prospecting research.
 * Selection order is cached per attempt in stage_data.directoryCompanyIds so
 * revisiting the step does not reshuffle mid-session.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  pickProspectDirectorySubset,
  toPublicProspectCompany,
  type ProspectDirectoryCompanyRow,
} from "@/lib/tempo-prospect-directory";

type StageDataBag = {
  directoryCompanyIds?: unknown;
  [key: string]: unknown;
};

/**
 * Maps a database row into the internal directory shape.
 */
function mapDirectoryRow(row: Record<string, unknown>): ProspectDirectoryCompanyRow {
  return {
    id: String(row.id),
    name: String(row.company_name ?? ""),
    industry: String(row.industry ?? ""),
    sizeLabel: String(row.size_locations ?? ""),
    signalHint: String(row.signal_hint ?? ""),
    isTarget: row.entry_type === "target",
  };
}

/**
 * Loads active directory rows for the attempt's simulation from Supabase.
 */
async function loadDirectoryRows(simulationId: string): Promise<ProspectDirectoryCompanyRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_prospect_directory")
    .select("id, company_name, industry, size_locations, signal_hint, entry_type")
    .eq("simulation_id", simulationId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Could not load prospect directory: ${error.message}`);
  }

  return (data ?? []).map((row) => mapDirectoryRow(row as Record<string, unknown>));
}

/**
 * Orders rows to match a cached id list; drops unknown ids.
 */
function orderByCachedIds(
  rows: ProspectDirectoryCompanyRow[],
  ids: string[]
): ProspectDirectoryCompanyRow[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is ProspectDirectoryCompanyRow => Boolean(row));
}

/**
 * GET /api/student/prospect-directory?attemptId=…
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const attemptId = new URL(request.url).searchParams.get("attemptId")?.trim();
    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .select("id, student_id, simulation_id, stage_data")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const allRows = await loadDirectoryRows(String(attempt.simulation_id));
    if (allRows.length === 0) {
      return NextResponse.json(
        { error: "No active prospect directory is configured for this simulation." },
        { status: 404 }
      );
    }
    const stageData = (attempt.stage_data ?? {}) as StageDataBag;
    const cachedIds = Array.isArray(stageData.directoryCompanyIds)
      ? stageData.directoryCompanyIds.filter((id): id is string => typeof id === "string")
      : [];

    let selected = cachedIds.length > 0 ? orderByCachedIds(allRows, cachedIds) : [];

    if (selected.length === 0) {
      selected = pickProspectDirectorySubset(allRows);
      const nextStageData: StageDataBag = {
        ...stageData,
        directoryCompanyIds: selected.map((row) => row.id),
      };
      const { error: cacheError } = await supabase
        .from("attempts")
        .update({ stage_data: nextStageData })
        .eq("id", attemptId);
      if (cacheError) {
        console.error("[prospect-directory] could not cache selection:", cacheError);
      }
    }

    return NextResponse.json({
      companies: selected.map(toPublicProspectCompany),
      cached: cachedIds.length > 0,
    });
  } catch (err) {
    console.error("[prospect-directory] unexpected", err);
    return NextResponse.json({ error: "Could not load company directory." }, { status: 500 });
  }
}
