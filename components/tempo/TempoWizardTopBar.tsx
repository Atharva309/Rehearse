/**
 * TempoWizardTopBar.tsx
 * Black/gold top navigation for the Tempo prospecting wizard —
 * Rehearse logo, project flow pills, handoff, and restart.
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

type TempoWizardTopBarProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  onOpenHandoff: () => void;
};

/**
 * Fixed header row overlaying the default student header during Tempo wizard.
 */
export function TempoWizardTopBar({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  onOpenHandoff,
}: TempoWizardTopBarProps): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-[50] h-16 bg-black border-b border-tertiary-container/40 shrink-0">
      <div className="h-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 min-w-0">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-2 shrink-0 text-tertiary-container hover:text-tertiary-fixed transition-colors"
        >
          <img src="/pitchlab-logo-new.png" alt="Rehearse logo" className="h-7 w-auto shrink-0" />
          <span className="text-base sm:text-lg font-bold tracking-tight hidden sm:inline">
            Rehearse
          </span>
        </Link>

        <div className="hidden sm:block w-px h-6 bg-tertiary-container/30 shrink-0" />

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <span className="text-[9px] font-bold text-tertiary-container/60 uppercase tracking-wider shrink-0 hidden lg:inline">
            Project Flow
          </span>
          {FLOW_PILLS.map((stage, i) => (
            <span key={stage} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full border whitespace-nowrap ${
                  i === 0
                    ? "bg-tertiary-container text-black border-tertiary-container"
                    : "bg-transparent text-tertiary-container/70 border-tertiary-container/35"
                }`}
              >
                {stage.toUpperCase()}
              </div>
              {i < FLOW_PILLS.length - 1 && (
                <div className="w-2 sm:w-3 h-px bg-tertiary-container/30 hidden md:block" />
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1">
          <button
            type="button"
            onClick={onOpenHandoff}
            className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] font-label-sm text-tertiary-container border border-tertiary-container/40 rounded-md hover:bg-tertiary-container/10 transition-all"
          >
            <MaterialIcon name="mail" className="text-[13px]" />
            <span className="hidden sm:inline">Handoff</span>
          </button>
          <RestartSimulationButton
            attemptId={attemptId}
            simulationId={simulationId}
            classId={classId}
            simulationTitle={simulationTitle}
            variant="tempoBlack"
          />
        </div>
      </div>
    </header>
  );
}
