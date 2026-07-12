/**
 * crm-account/route.ts
 * GET/POST /api/student/crm-account — load and upsert account strategy notes.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

type AccountNotesBody = {
  attemptId?: string;
  notes?: string;
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
 * GET /api/student/crm-account?attemptId=…
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
      .from("crm_account_notes")
      .select("notes, updated_at")
      .eq("attempt_id", attemptId)
      .maybeSingle();

    if (error) {
      console.error("[crm-account] GET failed:", error);
      return NextResponse.json({ error: "Could not load account notes." }, { status: 500 });
    }

    return NextResponse.json({
      notes: (data?.notes as string | undefined) ?? "",
      updated_at: (data?.updated_at as string | null | undefined) ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Could not load account notes." }, { status: 500 });
  }
}

/**
 * POST /api/student/crm-account — upsert account notes for the owned attempt.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as AccountNotesBody;
    const attemptId = body.attemptId?.trim();
    if (!attemptId || typeof body.notes !== "string") {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_account_notes")
      .upsert(
        {
          attempt_id: attemptId,
          notes: body.notes,
          updated_at: updatedAt,
        },
        { onConflict: "attempt_id" }
      )
      .select("notes, updated_at")
      .single();

    if (error || !data) {
      console.error("[crm-account] POST failed:", error);
      return NextResponse.json({ error: "Could not save account notes." }, { status: 500 });
    }

    return NextResponse.json({
      notes: data.notes as string,
      updated_at: data.updated_at as string,
    });
  } catch {
    return NextResponse.json({ error: "Could not save account notes." }, { status: 500 });
  }
}
