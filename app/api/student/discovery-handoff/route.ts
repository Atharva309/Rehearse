/**
 * discovery-handoff/route.ts
 * POST — records that the student clicked "Begin Stage 2" on the Discovery
 * handoff note. Until this flag is set, re-entering the simulation at the
 * Discovery stage re-shows the gated manager handoff modal.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

type AckBody = {
  attemptId?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as AckBody;
    const attemptId = body.attemptId?.trim() ?? "";
    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: attempt } = await supabase
      .from("attempts")
      .select("id, student_id, stage_data")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const existing = (attempt.stage_data ?? {}) as Record<string, unknown>;
    const { error: updateError } = await supabase
      .from("attempts")
      .update({ stage_data: { ...existing, discoveryHandoffSeen: true } })
      .eq("id", attemptId);

    if (updateError) {
      console.error("[discovery-handoff] save", updateError);
      return NextResponse.json({ error: "Could not save handoff state." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[discovery-handoff] unexpected", err);
    return NextResponse.json({ error: "Could not save handoff state." }, { status: 500 });
  }
}
