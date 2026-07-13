/**
 * TempoStageTopBar.tsx
 * Shared fixed header for all Tempo stages — Rehearse logo, optional step back,
 * chevron project flow, handoff note, and restart. Dashboard exit lives on the
 * left column (with a mobile-only fallback here).
 */

import Link from "next/link";
import { RestartSimulationButton } from "@/components/simulation/RestartSimulationButton";
import { TempoProjectFlow } from "@/components/tempo/TempoProjectFlow";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const BAR_BUTTON =
  "flex items-center gap-1.5 px-3 py-1.5 font-label-sm text-label-sm rounded-lg shrink-0 transition-all duration-150";

type TempoStageTopBarProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  /** 0 = Prospecting … 4 = Negotiation */
  flowIndex: number;
  onOpenHandoff: () => void;
  /** Mobile-only dashboard exit (desktop uses left-column control). */
  onBackToDashboard: () => void;
  /** Prospecting wizard only — go to previous wizard step. */
  previousStepLabel?: string | null;
  onPreviousStep?: () => void;
};

/**
 * Fixed Tempo simulation top bar shared across stages 1–5.
 */
export function TempoStageTopBar({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  flowIndex,
  onOpenHandoff,
  onBackToDashboard,
  previousStepLabel = null,
  onPreviousStep,
}: TempoStageTopBarProps): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-[50] h-16 border-b border-border bg-page shrink-0">
      <div className="h-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 lg:px-6 min-w-0">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-2 shrink-0 text-xl font-bold text-primary tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pitchlab-logo-new.png"
            alt="Rehearse logo"
            className="h-[1.5em] w-auto shrink-0"
          />
          <span className="hidden sm:inline">Rehearse</span>
        </Link>

        <div className="hidden sm:block w-px h-6 bg-outline-variant shrink-0" />

        {/* Dashboard exit when the left column is hidden */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className={`${BAR_BUTTON} lg:hidden text-on-surface-variant border border-outline-variant hover:bg-surface-container`}
        >
          <MaterialIcon name="arrow_back" className="text-[16px]" />
          <span>Back</span>
        </button>

        {previousStepLabel && onPreviousStep ? (
          <button
            type="button"
            onClick={onPreviousStep}
            className={`${BAR_BUTTON} text-on-surface-variant border border-outline-variant hover:bg-surface-container`}
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            <span className="hidden md:inline">Back to {previousStepLabel}</span>
            <span className="md:hidden">Back</span>
          </button>
        ) : null}

        <TempoProjectFlow currentIndex={flowIndex} />

        <div className="flex items-center gap-3 shrink-0 ml-1">
          <button
            type="button"
            onClick={onOpenHandoff}
            className={`${BAR_BUTTON} text-on-surface-variant border border-outline-variant hover:bg-surface-container`}
          >
            <MaterialIcon name="mail" className="text-[16px]" />
            <span className="hidden sm:inline">Handoff Note</span>
          </button>
          <RestartSimulationButton
            attemptId={attemptId}
            simulationId={simulationId}
            classId={classId}
            simulationTitle={simulationTitle}
            variant="tempoTopBar"
          />
        </div>
      </div>
    </header>
  );
}
