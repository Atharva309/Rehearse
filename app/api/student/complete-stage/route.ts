/**
 * complete-stage/route.ts
 * POST /api/student/complete-stage — saves stage score and advances attempt.
 * Uses service role because students do not have Supabase auth sessions.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { getNextStage } from "@/lib/stages";
import { createServiceClient } from "@/lib/supabase/server";
import type { SimulationStage } from "@/types";

type CompleteStageBody = {
  attemptId?: string;
  stage?: SimulationStage;
  score?: number;
  feedback?: string;
  transcript?: string;
};

/**
 * Upserts a stage score and updates attempt progress for the logged-in student.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as CompleteStageBody;
    const { attemptId, stage, score, feedback, transcript } = body;

    if (!attemptId || !stage || score === undefined || !feedback || transcript === undefined) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: attempt } = await supabase
      .from("attempts")
      .select("id, student_id")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    await supabase.from("stage_scores").upsert(
      {
        attempt_id: attemptId,
        stage,
        score,
        feedback,
        transcript,
      },
      { onConflict: "attempt_id,stage" }
    );

    const { data: scores } = await supabase
      .from("stage_scores")
      .select("score")
      .eq("attempt_id", attemptId);

    const totalScore = (scores ?? []).reduce((sum, row) => sum + row.score, 0);
    const next = getNextStage(stage);

    if (next === "results" || next === null) {
      await supabase
        .from("attempts")
        .update({
          current_stage: "results",
          status: "completed",
          total_score: totalScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", attemptId);

      return NextResponse.json({ nextStage: "results", totalScore });
    }

    await supabase
      .from("attempts")
      .update({ current_stage: next, total_score: totalScore })
      .eq("id", attemptId);

    return NextResponse.json({ nextStage: next, totalScore });
  } catch {
    return NextResponse.json({ error: "Could not save stage progress." }, { status: 500 });
  }
}
