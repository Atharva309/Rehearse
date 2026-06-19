/**
 * restart/route.ts
 * Abandons the current in-progress attempt and creates a new one.
 * Called when a student clicks "Restart Simulation".
 * Requires a valid student session cookie.
 *
 * POST body: { attemptId, simulationId, classId }
 * Returns: { success: true, newAttemptId: string }
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { ATTEMPT_STATUS } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";
import type { RestartSimulationResponse } from "@/types";

type RestartBody = {
  attemptId?: string;
  simulationId?: string;
  classId?: string;
};

/**
 * Marks the current attempt abandoned and inserts a fresh in-progress attempt.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as RestartBody;
    const attemptId = body.attemptId?.trim() ?? "";
    const simulationId = body.simulationId?.trim() ?? "";
    const classId = body.classId?.trim() ?? "";

    if (!attemptId || !simulationId || !classId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .select("id, student_id, simulation_id, class_id, status")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .eq("simulation_id", simulationId)
      .eq("class_id", classId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      return NextResponse.json({ error: "Only in-progress attempts can be restarted." }, { status: 400 });
    }

    const { data: enrollment } = await supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", auth.session.studentId)
      .eq("class_id", classId)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this class." }, { status: 403 });
    }

    const { error: abandonError } = await supabase
      .from("attempts")
      .update({ status: ATTEMPT_STATUS.ABANDONED })
      .eq("id", attemptId);

    if (abandonError) {
      console.error("[simulation/restart] abandon", abandonError);
      return NextResponse.json({ error: "Could not restart simulation." }, { status: 500 });
    }

    const { data: newAttempt, error: insertError } = await supabase
      .from("attempts")
      .insert({
        student_id: auth.session.studentId,
        simulation_id: simulationId,
        class_id: classId,
        student_class_id: enrollment.id,
        status: ATTEMPT_STATUS.IN_PROGRESS,
        current_stage: "lead_gen",
      })
      .select("id")
      .single();

    if (insertError || !newAttempt) {
      console.error("[simulation/restart] insert", insertError);
      return NextResponse.json({ error: "Could not create a new attempt." }, { status: 500 });
    }

    const payload: RestartSimulationResponse = {
      success: true,
      newAttemptId: newAttempt.id as string,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[simulation/restart] unexpected", err);
    return NextResponse.json({ error: "Could not restart simulation." }, { status: 500 });
  }
}
