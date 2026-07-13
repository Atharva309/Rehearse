/**
 * TempoWizardTopBar.tsx
 * Top navigation for the Tempo prospecting wizard — wraps shared TempoStageTopBar.
 */

import { TempoStageTopBar } from "@/components/tempo/TempoStageTopBar";
import { PROSPECTING_STEPS } from "@/lib/tempo-prospecting";

type TempoWizardTopBarProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  currentStep: number;
  onOpenHandoff: () => void;
  onBackToDashboard: () => void;
  onPreviousStep: () => void;
};

/**
 * Fixed header for Stage 1 Prospecting.
 */
export function TempoWizardTopBar({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  currentStep,
  onOpenHandoff,
  onBackToDashboard,
  onPreviousStep,
}: TempoWizardTopBarProps): React.ReactElement {
  const previousStepLabel =
    currentStep > 0 ? PROSPECTING_STEPS[currentStep - 1]?.label ?? null : null;

  return (
    <TempoStageTopBar
      attemptId={attemptId}
      simulationId={simulationId}
      classId={classId}
      simulationTitle={simulationTitle}
      flowIndex={0}
      onOpenHandoff={onOpenHandoff}
      onBackToDashboard={onBackToDashboard}
      previousStepLabel={previousStepLabel}
      onPreviousStep={previousStepLabel ? onPreviousStep : undefined}
    />
  );
}
