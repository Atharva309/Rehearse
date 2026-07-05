/**
 * ObjectionHandlingTopBar.tsx
 * Top app bar for Tempo Stage 4 Objection Handling — matches Stages 1–3
 * (Rehearse logo, Back, project flow pills, handoff note, restart) with
 * Objection Handling as the active stage.
 */

import Link from "next/link";
import { RestartSimulationButton } from "@/components/simulation/RestartSimulationButton";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const FLOW_PILLS = [
  "Prospecting",
  "Discovery",
  "Presentation",
  "Objection Handling",
  "Negotiation",
] as const;

const OBJECTIONS_FLOW_INDEX = 3;

const BAR_BUTTON =
  "flex items-center gap-1.5 px-3 py-1.5 font-label-sm text-label-sm rounded-lg shrink-0 transition-all duration-150";

type ObjectionHandlingTopBarProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  onOpenHandoff: () => void;
  onBack: () => void;
};

/**
 * Fixed header overlaying the default student header during Stage 4.
 */
export function ObjectionHandlingTopBar({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  onOpenHandoff,
  onBack,
}: ObjectionHandlingTopBarProps): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-[50] h-16 border-b border-border bg-page shrink-0">
      <div className="h-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 lg:px-6 min-w-0">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-2 shrink-0 text-xl font-bold text-primary tracking-tight"
        >
          <img
            src="/pitchlab-logo-new.png"
            alt="Rehearse logo"
            className="h-[1.5em] w-auto shrink-0"
          />
          <span className="hidden sm:inline">Rehearse</span>
        </Link>

        <div className="hidden sm:block w-px h-6 bg-outline-variant shrink-0" />

        <button
          type="button"
          onClick={onBack}
          className={`${BAR_BUTTON} text-on-surface-variant border border-outline-variant hover:bg-surface-container`}
        >
          <MaterialIcon name="arrow_back" className="text-[16px]" />
          <span className="hidden md:inline">Back to Dashboard</span>
          <span className="md:hidden">Back</span>
        </button>

        <div className="hidden sm:block w-px h-6 bg-outline-variant shrink-0" />

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 hidden lg:inline">
            Project Flow
          </span>
          {FLOW_PILLS.map((stage, i) => (
            <span key={stage} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`px-2 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-full border whitespace-nowrap leading-tight ${
                  i === OBJECTIONS_FLOW_INDEX
                    ? "bg-primary-container text-white border-primary-container"
                    : "bg-transparent text-on-surface-variant border-outline-variant"
                }`}
              >
                {stage.toUpperCase()}
              </div>
              {i < FLOW_PILLS.length - 1 && (
                <div className="w-2 sm:w-3 h-px bg-outline-variant hidden md:block" />
              )}
            </span>
          ))}
        </div>

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
