/**
 * NegotiationTopBar.tsx
 * Top app bar for Tempo Stage 5 Negotiation — shared TempoStageTopBar shell.
 */

import { TempoStageTopBar } from "@/components/tempo/TempoStageTopBar";

type NegotiationTopBarProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  onOpenHandoff: () => void;
  onBackToDashboard: () => void;
};

/**
 * Fixed header overlaying the default student header during Stage 5.
 */
export function NegotiationTopBar({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  onOpenHandoff,
  onBackToDashboard,
}: NegotiationTopBarProps): React.ReactElement {
  return (
    <TempoStageTopBar
      attemptId={attemptId}
      simulationId={simulationId}
      classId={classId}
      simulationTitle={simulationTitle}
      flowIndex={4}
      onOpenHandoff={onOpenHandoff}
      onBackToDashboard={onBackToDashboard}
    />
  );
}
