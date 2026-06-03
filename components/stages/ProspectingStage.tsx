/**
 * ProspectingStage.tsx
 * Phone-call UI (voice only, no Simli) via PhoneCallStage orchestrator.
 */

"use client";

import { CALL_STAGE_MIN_HEIGHT_CLASS } from "@/components/call/CallLayout";
import { PhoneCallStage } from "@/components/call/PhoneCallStage";
import type { Simulation, SimulationStage } from "@/types";

type ProspectingStageProps = {
  simulation: Simulation;
  attemptId: string;
  onComplete: (nextStage: SimulationStage) => void;
};

/**
 * Prospecting — cold call with waveform UI; no video avatar.
 */
export function ProspectingStage({
  simulation,
  attemptId,
  onComplete,
}: ProspectingStageProps): React.ReactElement {
  return (
    <div className={`${CALL_STAGE_MIN_HEIGHT_CLASS} flex flex-col flex-1 min-h-0 h-full`}>
      <PhoneCallStage
        simulation={simulation}
        attemptId={attemptId}
        stageHint="PROSPECTING STAGE: You are on a short cold call. Be busy but fair."
        onAdvance={() => onComplete("discovery")}
      />
    </div>
  );
}
