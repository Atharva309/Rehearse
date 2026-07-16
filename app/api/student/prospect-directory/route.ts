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
  PROSPECT_DIRECTORY_SEED,
  pickProspectDirectorySubset,
  toPublicProspectCompany,
  type ProspectDirectoryCompanyRow,
} from "@/lib/tempo-prospect-directory";

type StageDataBag = {
  directoryCompanyIds?: unknown;
  [key: string]: unknown;
};

/**
 * Maps a DB row (or seed row) into the internal directory shape.
 */
function mapDirectoryRow(row: Record<string, unknown>): ProspectDirectoryCompanyRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    industry: String(row.industry ?? ""),
    sizeLabel: String(row.size_label ?? row.sizeLabel ?? ""),
    signalHint: String(row.signal_hint ?? row.signalHint ?? ""),
    isTarget: Boolean(row.is_target ?? row.isTarget),
  };
}

/**
 * Loads directory rows from Supabase, falling back to the in-repo seed.
 */
async function loadDirectoryRows(): Promise<ProspectDirectoryCompanyRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_prospect_directory")
    .select("id, name, industry, size_label, signal_hint, is_target");

  if (error || !data || data.length === 0) {
    if (error) {
      console.warn(
        "[prospect-directory] table unavailable — using seed. Run supabase/crm-prospect-directory-migration.sql:",
        error.message
      );
    }
    return [...PROSPECT_DIRECTORY_SEED];
  }

  return data.map((row) => mapDirectoryRow(row as Record<string, unknown>));
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
      .select("id, student_id, stage_data")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const allRows = await loadDirectoryRows();
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
