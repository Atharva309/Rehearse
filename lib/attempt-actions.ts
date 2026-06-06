/**
 * attempt-actions.ts
 * Client-side helpers for attempts and stage scores.
 */

import type { SimulationStage } from "@/types";

/**
 * Saves a stage score and advances the attempt to the next stage.
 */
export async function completeStage(
  attemptId: string,
  stage: SimulationStage,
  score: number,
  feedback: string,
  transcript: string
): Promise<{ nextStage: SimulationStage | null; totalScore: number }> {
  const res = await fetch("/api/student/complete-stage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attemptId, stage, score, feedback, transcript }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not save stage progress.");
  }

  return res.json() as Promise<{ nextStage: SimulationStage | null; totalScore: number }>;
}

/**
 * Fetches score for a stage via /api/score.
 */
export async function fetchStageScore(payload: {
  stage: SimulationStage;
  transcript?: string;
  pitchText?: string;
  studentAnswers?: { fit: string; painPoints: string; openingApproach: string };
  priorStagesSummary?: string;
  simulationContext: {
    personaName: string;
    personaRole: string;
    personaSystemPrompt: string;
    productContext: string;
    productName?: string;
  };
  runningTotalScore?: number;
}): Promise<{ score: number; feedback: string }> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Scoring failed");
  }
  return res.json() as Promise<{ score: number; feedback: string }>;
}
