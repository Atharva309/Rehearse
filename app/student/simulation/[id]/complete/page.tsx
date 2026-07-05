/**
 * complete/page.tsx
 * Student simulation results — Tempo (default class) or legacy pipeline view.
 */

import { BackButton } from "@/components/BackButton";
import { PipelineProgress } from "@/components/PipelineProgress";
import { StudentLeaderboard } from "@/components/StudentLeaderboard";
import { TempoSimulationResultsView } from "@/components/tempo/TempoSimulationResultsView";
import { DEFAULT_CLASS_ID, LEADERBOARD_QUERY_LIMIT, SCORED_STAGES, STAGE_LABELS } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
import { buildLeaderboard } from "@/lib/leaderboard";
import { buildStageProgress } from "@/lib/stages";
import {
  stageScoreTone,
  toneBgClass,
  toneTextClass,
  totalScoreTone,
} from "@/lib/score-display";
import {
  TEMPO_RESULTS_MAX_SCORE,
  tempoResultsDealWon,
  tempoResultsGradeFromPercent,
  tempoResultsTotalScore,
} from "@/lib/tempo-results";
import { isTempoDefaultSimulation } from "@/lib/tempo-simulation";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { StageScore } from "@/types";

export const metadata: Metadata = {
  title: "Results — Tempo Simulation | Rehearse",
};

type PageProps = {
  params: { id: string };
  searchParams: { attempt?: string; classId?: string };
};

/**
 * Results summary after all stages complete.
 */
export default async function SimulationCompletePage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const supabase = createServiceClient();
  const attemptId = searchParams.attempt;
  if (!attemptId) {
    redirect("/student/dashboard");
  }

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*, simulations(id, title)")
    .eq("id", attemptId)
    .eq("student_id", session.studentId)
    .single();

  if (!attempt) {
    redirect("/student/dashboard");
  }

  const simRaw = attempt.simulations;
  const simulation = (Array.isArray(simRaw) ? simRaw[0] : simRaw) as
    | { id: string; title: string }
    | null;
  const classId = (attempt.class_id as string | undefined) ?? searchParams.classId?.trim() ?? "";
  const isTempoDefault =
    classId === DEFAULT_CLASS_ID &&
    simulation &&
    isTempoDefaultSimulation(simulation.id, simulation.title);

  if (isTempoDefault && attempt.status !== "completed") {
    redirect(
      `/student/simulation/${params.id}/entry?classId=${DEFAULT_CLASS_ID}`
    );
  }

  if (isTempoDefault) {
    const { data: enrollment } = await supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", session.studentId)
      .eq("class_id", DEFAULT_CLASS_ID)
      .single();

    if (!enrollment) {
      redirect("/student/dashboard");
    }
  }

  const { data: stageScores } = await supabase
    .from("stage_scores")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("completed_at");

  const scores = (stageScores ?? []) as StageScore[];

  const { data: leaderboardRows } = await supabase
    .from("attempts")
    .select(
      `
      id,
      student_id,
      total_score,
      completed_at,
      students (
        display_name
      )
    `
    )
    .eq("simulation_id", params.id)
    .eq("status", "completed")
    .order("total_score", { ascending: false })
    .limit(LEADERBOARD_QUERY_LIMIT);

  const leaderboard = buildLeaderboard(
    (leaderboardRows ?? []) as Parameters<typeof buildLeaderboard>[0]
  );

  if (isTempoDefault) {
    const closeScore = scores.find((s) => s.stage === "close");
    const dealWon = tempoResultsDealWon(closeScore);
    const totalScore = tempoResultsTotalScore(scores);
    const grade = tempoResultsGradeFromPercent(
      Math.round((totalScore / TEMPO_RESULTS_MAX_SCORE) * 100)
    );

    return (
      <TempoSimulationResultsView
        simulationId={params.id}
        classId={DEFAULT_CLASS_ID}
        displayName={session.displayName}
        totalScore={totalScore}
        grade={grade}
        dealWon={dealWon}
        stageScores={scores}
        leaderboard={leaderboard}
        studentId={session.studentId}
        completedAt={attempt.completed_at as string | null}
        startedAt={attempt.started_at as string | null}
      />
    );
  }

  const total = attempt.total_score as number;
  const grade = scoreToGrade(total);
  const totalTone = totalScoreTone(total);
  const pipelineItems = buildStageProgress("results", scores);

  return (
    <div className="w-full px-4 sm:px-6">
      <BackButton label="Back to Dashboard" href="/student/dashboard" />

      <div className="mb-6">
        <PipelineProgress items={pipelineItems} allComplete />
      </div>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-text-primary">Results</h1>
        <p className="text-sm text-text-secondary mt-1">
          {simulation?.title ?? "Simulation"}
        </p>

        <div className={`mt-8 rounded-lg border p-6 ${toneBgClass(totalTone)}`}>
          <p className={`text-5xl font-bold ${toneTextClass(totalTone)}`}>{total}</p>
          <p className="text-text-secondary text-sm">out of 600</p>
          <p className="text-xl font-semibold mt-2 text-text-primary">
            Grade: <span className={toneTextClass(totalTone)}>{grade}</span>
          </p>
        </div>

        <div className="mt-8 card-surface overflow-hidden">
          <table className="w-full text-sm stitch-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Score</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {SCORED_STAGES.map((stage) => {
                const row = scores.find((s) => s.stage === stage);
                const tone = row ? stageScoreTone(row.score) : null;
                return (
                  <tr key={stage} className="border-t border-border">
                    <td className="font-medium text-text-primary">{STAGE_LABELS[stage]}</td>
                    <td>
                      {row ? (
                        <span className={`font-semibold ${toneTextClass(tone!)}`}>
                          {row.score}/100
                        </span>
                      ) : stage === "close" ? (
                        <span className="font-semibold text-error">Not scored</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-text-secondary">{row?.feedback ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-semibold text-text-primary mt-12 mb-4">Leaderboard</h2>
        <StudentLeaderboard entries={leaderboard} highlightStudentId={session.studentId} />
      </div>
    </div>
  );
}
