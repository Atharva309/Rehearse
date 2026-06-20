/**
 * TempoWizardTopBar.tsx
 * Top navigation for the Tempo prospecting wizard — Rehearse logo,
 * project flow pills, handoff note, and restart. Uses the standard app palette.
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
 * Fixed header overlaying the default student header during the Tempo prospecting wizard.
 */
export function TempoWizardTopBar({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  onOpenHandoff,
}: TempoWizardTopBarProps): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-[50] h-16 border-b border-border bg-page shrink-0">
      <div className="h-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 min-w-0">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-2 shrink-0 text-xl font-bold text-primary tracking-tight"
        >
          <img src="/pitchlab-logo-new.png" alt="Rehearse logo" className="h-[1.5em] w-auto shrink-0" />
          <span className="hidden sm:inline">Rehearse</span>
        </Link>

        <div className="hidden sm:block w-px h-6 bg-outline-variant shrink-0" />

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 hidden lg:inline">
            Project Flow
          </span>
          {FLOW_PILLS.map((stage, i) => (
            <span key={stage} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-full border whitespace-nowrap ${
                  i === 0
                    ? "bg-primary-container text-white border-primary-container"
                    : "bg-transparent text-on-surface-variant border-outline-variant"
                }`}
              >
                {stage.toUpperCase()}
              </div>
              {i < FLOW_PILLS.length - 1 && (
                <div className="w-2 sm:w-4 h-px bg-outline-variant hidden md:block" />
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1">
          <button
            type="button"
            onClick={onOpenHandoff}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-on-surface-variant font-label-sm border border-outline-variant rounded-lg hover:bg-surface-container transition-all"
          >
            <MaterialIcon name="mail" className="text-[16px]" />
            <span className="hidden sm:inline">Handoff Note</span>
          </button>
          <RestartSimulationButton
            attemptId={attemptId}
            simulationId={simulationId}
            classId={classId}
            simulationTitle={simulationTitle}
          />
        </div>
      </div>
    </header>
  );
}
