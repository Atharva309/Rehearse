/**
 * SimulationRunner.tsx
 * Client stage router — pipeline always visible; contained call area below.
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CallContainer } from "@/components/call/CallContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PipelineProgress } from "@/components/PipelineProgress";
import { CloseStage } from "@/components/stages/CloseStage";
import { DiscoveryStage } from "@/components/stages/DiscoveryStage";
import { LeadGenStage } from "@/components/stages/LeadGenStage";
import { ObjectionsStage } from "@/components/stages/ObjectionsStage";
import { PresentationStage } from "@/components/stages/PresentationStage";
import { ProspectingStage } from "@/components/stages/ProspectingStage";
import { buildStageProgress } from "@/lib/stages";
import type { Attempt, Simulation, SimulationStage, StageScore } from "@/types";

type SimulationRunnerProps = {
  simulation: Simulation;
  attempt: Attempt;
  stageScores: StageScore[];
};

const CALL_STAGES: SimulationStage[] = ["prospecting", "discovery", "objections", "close"];

/**
 * Renders pipeline header and active stage content below.
 */
export function SimulationRunner({
  simulation,
  attempt: initialAttempt,
  stageScores: initialScores,
}: SimulationRunnerProps): React.ReactElement {
  const router = useRouter();
  const [attempt, setAttempt] = useState(initialAttempt);
  const [stageScores, setStageScores] = useState(initialScores);

  useEffect(() => {
    setAttempt(initialAttempt);
    setStageScores(initialScores);
  }, [initialAttempt, initialScores]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (attempt.status === "in_progress") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attempt.status]);

  const progress = useMemo(
    () => buildStageProgress(attempt.current_stage, stageScores),
    [attempt.current_stage, stageScores]
  );

  const runningTotal = stageScores.reduce((s, row) => s + row.score, 0);
  const discoveryTranscript =
    stageScores.find((s) => s.stage === "discovery")?.transcript ?? "";
  const pitchText = stageScores.find((s) => s.stage === "presentation")?.transcript ?? "";

  const handleStageComplete = useCallback(
    (next: SimulationStage): void => {
      setAttempt((a) => ({ ...a, current_stage: next }));
      router.refresh();
    },
    [router]
  );

  const handleSimulationComplete = (): void => {
    router.push(`/student/simulation/${simulation.id}/complete?attempt=${attempt.id}`);
  };

  const stage = attempt.current_stage;
  const isCallStage = CALL_STAGES.includes(stage);

  const stageContent = (
    <ErrorBoundary stageName={stage}>
      <div key={stage} className="stage-content-fade flex h-full min-h-0 flex-1 flex-col">
        {stage === "lead_gen" && (
          <LeadGenStage
            simulation={simulation}
            attemptId={attempt.id}
            onComplete={handleStageComplete}
          />
        )}
        {stage === "prospecting" && (
          <ProspectingStage
            simulation={simulation}
            attemptId={attempt.id}
            onComplete={handleStageComplete}
          />
        )}
        {stage === "discovery" && (
          <DiscoveryStage
            simulation={simulation}
            attemptId={attempt.id}
            runningTotalScore={runningTotal}
            onComplete={handleStageComplete}
          />
        )}
        {stage === "presentation" && (
          <PresentationStage
            simulation={simulation}
            attemptId={attempt.id}
            discoveryNotes={discoveryTranscript}
            runningTotalScore={runningTotal}
            onComplete={handleStageComplete}
          />
        )}
        {stage === "objections" && (
          <ObjectionsStage
            simulation={simulation}
            attemptId={attempt.id}
            pitchText={pitchText}
            runningTotalScore={runningTotal}
            onComplete={handleStageComplete}
          />
        )}
        {stage === "close" && (
          <CloseStage
            simulation={simulation}
            attemptId={attempt.id}
            stageScores={stageScores}
            runningTotalScore={runningTotal}
            onComplete={handleSimulationComplete}
          />
        )}
        {stage === "results" && (
          <p className="text-text-secondary">Redirecting to results...</p>
        )}
      </div>
    </ErrorBoundary>
  );

  return (
    <div
      className={`w-full px-6 ${isCallStage ? "flex flex-col min-h-[calc(100vh-4rem)]" : ""}`}
    >
      <BackButton label="Back to Dashboard" href="/student/dashboard" />

      <div className="mt-6 simulation-pipeline-bar rounded-t-lg overflow-hidden shrink-0">
        <PipelineProgress items={progress} />
      </div>

      {!isCallStage && (
        <header className="px-8 pt-6 pb-2 max-w-4xl">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {simulation.title}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Persona: {simulation.persona_name} · {simulation.persona_role}
          </p>
        </header>
      )}

      {isCallStage ? (
        <CallContainer>{stageContent}</CallContainer>
      ) : (
        <div className="px-8 py-8 max-w-4xl">{stageContent}</div>
      )}
    </div>
  );
}
