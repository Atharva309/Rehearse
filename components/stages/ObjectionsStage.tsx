/**
 * ObjectionsStage.tsx
 * Simli video-call stage for handling objections after the written pitch.
 */

"use client";

import { SimliCallStage } from "@/components/call/SimliCallStage";
import { OBJECTIONS_COUNT } from "@/lib/constants";
import type { Simulation, SimulationStage } from "@/types";

type ObjectionsStageProps = {
  simulation: Simulation;
  attemptId: string;
  pitchText: string;
  runningTotalScore: number;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Objections — video call; persona raises objections from the pitch.
 */
export function ObjectionsStage({
  simulation,
  attemptId,
  pitchText,
  runningTotalScore,
  onComplete,
}: ObjectionsStageProps): React.ReactElement {
  return (
    <SimliCallStage
      simulation={simulation}
      attemptId={attemptId}
      stage="objections"
      stageHint={`OBJECTIONS STAGE: The student pitched: """${pitchText}""" Raise ${OBJECTIONS_COUNT} specific objections (price, timing, fit). Push back realistically.`}
      openingGreeting={`I read your pitch. I've got a few concerns — let's hear how you handle them.`}
      scoreStage="objections"
      runningTotalScore={runningTotalScore}
      scoreTranscriptExtra={`Pitch:\n${pitchText}`}
      advanceLabel="Next Stage"
      onAdvance={() => onComplete("close")}
      topBanner={
        <p className="shrink-0 text-sm text-white/70 px-4 py-2 border-b border-white/10 bg-black/30">
          Handle {OBJECTIONS_COUNT} objections from {simulation.persona_name} in the video call.
        </p>
      }
    />
  );
}
