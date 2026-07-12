/**
 * crm-log/route.ts
 * GET/POST /api/student/crm-log — load and upsert CRM opportunity log entries.
 * Uses service role because students do not have Supabase auth sessions.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { CrmLogEntry, SimulationStage } from "@/types";

const CRM_LOG_STAGES = new Set<SimulationStage>([
  "prospecting",
  "discovery",
  "presentation",
  "objections",
  "close",
]);

type CrmLogPostBody = {
  attemptId?: string;
  stage?: SimulationStage;
  fields?: Record<string, string>;
};

/**
 * Ensures the attempt exists and belongs to the authenticated student.
 */
async function loadOwnedAttempt(
  attemptId: string,
  studentId: string
): Promise<{ id: string } | null> {
  const supabase = createServiceClient();
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .single();
  return attempt;
}

/**
 * GET /api/student/crm-log?attemptId=… — all log entries for the attempt.
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

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_log_entries")
      .select("stage, fields, submitted_at")
      .eq("attempt_id", attemptId)
      .order("submitted_at", { ascending: true });

    if (error) {
      console.error("[crm-log] GET failed:", error);
      return NextResponse.json({ error: "Could not load CRM logs." }, { status: 500 });
    }

    const entries: CrmLogEntry[] = (data ?? []).map((row) => ({
      stage: row.stage as SimulationStage,
      fields: (row.fields ?? {}) as Record<string, string>,
      submitted_at: row.submitted_at as string,
    }));

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Could not load CRM logs." }, { status: 500 });
  }
}

/**
 * POST /api/student/crm-log — upsert one stage log for the owned attempt.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as CrmLogPostBody;
    const { attemptId, stage, fields } = body;

    if (!attemptId || !stage || !fields || typeof fields !== "object") {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!CRM_LOG_STAGES.has(stage)) {
      return NextResponse.json({ error: "Invalid CRM stage." }, { status: 400 });
    }

    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === "string") {
        sanitized[key] = value.trim();
      }
    }

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const submittedAt = new Date().toISOString();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_log_entries")
      .upsert(
        {
          attempt_id: attemptId,
          stage,
          fields: sanitized,
          submitted_at: submittedAt,
        },
        { onConflict: "attempt_id,stage" }
      )
      .select("stage, fields, submitted_at")
      .single();

    if (error || !data) {
      console.error("[crm-log] POST failed:", error);
      return NextResponse.json({ error: "Could not save CRM log." }, { status: 500 });
    }

    const entry: CrmLogEntry = {
      stage: data.stage as SimulationStage,
      fields: (data.fields ?? {}) as Record<string, string>,
      submitted_at: data.submitted_at as string,
    };

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Could not save CRM log." }, { status: 500 });
  }
}
