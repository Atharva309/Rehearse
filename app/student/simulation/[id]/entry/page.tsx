/**
 * entry/page.tsx
 * Simulation entry page for the Tempo simulation.
 * Shown when a student clicks Start or Continue on the
 * Rehearse Essentials class card. Explains the simulation,
 * the 5 stages, scoring, and ground rules before the
 * student begins Stage 1.
 * Only rendered for the Tempo simulation in the default class.
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TempoSimulationEntryView } from "@/components/student/TempoSimulationEntryView";
import { DEFAULT_CLASS_ID } from "@/lib/constants";
import {
  buildTempoEntryCtaHref,
  getCurrentTempoStage,
  isTempoDefaultSimulation,
  normalizeToTempoStageKey,
} from "@/lib/tempo-simulation";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { SimulationStage } from "@/types";

type PageProps = {
  params: { id: string };
  searchParams: { classId?: string };
};

/**
 * Loads Tempo entry data and renders the briefing page for default-class students.
 */
export default async function TempoSimulationEntryPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const classId = searchParams.classId?.trim() ?? "";
  if (!classId || classId !== DEFAULT_CLASS_ID) {
    redirect("/student/dashboard");
  }

  const supabase = createServiceClient();

  const { data: simulation, error: simError } = await supabase
    .from("simulations")
    .select("id, title, persona_name, persona_role, product_context, is_published")
    .eq("id", params.id)
    .single();

  if (simError || !simulation || !simulation.is_published) {
    notFound();
  }

  if (!isTempoDefaultSimulation(simulation.id, simulation.title)) {
    redirect(`/student/simulation/${params.id}?classId=${classId}`);
  }

  const { data: enrollment } = await supabase
    .from("student_classes")
    .select("id")
    .eq("student_id", session.studentId)
    .eq("class_id", classId)
    .single();

  if (!enrollment) {
    redirect("/student/dashboard");
  }

  const { data: existingAttempt } = await supabase
    .from("attempts")
    .select("id, status, current_stage, total_score")
    .eq("student_id", session.studentId)
    .eq("simulation_id", params.id)
    .eq("class_id", classId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasCompletedAttempt = existingAttempt?.status === "completed";
  const hasInProgressAttempt = existingAttempt?.status === "in_progress";
  const attemptId = existingAttempt?.id ?? null;
  const currentStage = (existingAttempt?.current_stage as SimulationStage | undefined) ?? null;

  let completedStageKeys = new Set<string>();
  let lastStageScore: number | null = null;

  if (attemptId && hasInProgressAttempt) {
    const { data: stageScores } = await supabase
      .from("stage_scores")
      .select("stage, score, completed_at")
      .eq("attempt_id", attemptId)
      .order("completed_at", { ascending: false });

    completedStageKeys = new Set((stageScores ?? []).map((row) => row.stage as string));

    const latest = stageScores?.[0];
    if (latest && typeof latest.score === "number") {
      lastStageScore = latest.score;
    }
  }

  const currentTempoStage = hasInProgressAttempt ? getCurrentTempoStage(currentStage) : null;
  const ctaHref = buildTempoEntryCtaHref(
    params.id,
    classId,
    attemptId,
    hasCompletedAttempt,
    hasInProgressAttempt
  );

  const ctaLabel = hasCompletedAttempt
    ? "View Results →"
    : hasInProgressAttempt && currentTempoStage
      ? `Continue — Stage ${currentTempoStage.number}: ${currentTempoStage.title} →`
      : "Begin Simulation →";

  return (
    <div>
      <Link
        href={`/student/classes/${classId}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:underline mb-4 transition-colors"
      >
        <span aria-hidden>←</span>
        Back to Rehearse Essentials
      </Link>

      <TempoSimulationEntryView
        classId={classId}
        simulationId={params.id}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
        hasInProgressAttempt={hasInProgressAttempt}
        completedStageKeys={completedStageKeys}
        currentStage={currentStage ? normalizeToTempoStageKey(currentStage) : null}
        lastStageScore={lastStageScore}
      />
    </div>
  );
}
