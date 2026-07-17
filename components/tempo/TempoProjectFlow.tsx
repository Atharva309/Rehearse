/**
 * TempoProjectFlow.tsx
 * Segmented stage timeline for Tempo top bars — completed / current / upcoming.
 */

import { MaterialIcon } from "@/components/ui/MaterialIcon";

export const TEMPO_FLOW_STAGES = [
  { id: "prospecting", label: "Prospecting", icon: "search" },
  { id: "discovery", label: "Discovery", icon: "record_voice_over" },
  { id: "presentation", label: "Presentation", icon: "present_to_all" },
  { id: "objections", label: "Objections", icon: "shield" },
  { id: "negotiation", label: "Negotiation", icon: "handshake" },
] as const;

export type TempoFlowStageId = (typeof TEMPO_FLOW_STAGES)[number]["id"];

type FlowStatus = "completed" | "current" | "upcoming";

type TempoProjectFlowProps = {
  /** 0-based index of the active Tempo stage. */
  currentIndex: number;
};

/**
 * Resolves segment status relative to the current stage index.
 */
function statusForIndex(index: number, currentIndex: number): FlowStatus {
  if (index < currentIndex) {
    return "completed";
  }
  if (index === currentIndex) {
    return "current";
  }
  return "upcoming";
}

/**
 * Horizontal segmented project-flow strip used in every Tempo stage top bar.
 * Completed segments show a check; the current segment pulses with its stage icon.
 */
export function TempoProjectFlow({ currentIndex }: TempoProjectFlowProps): React.ReactElement {
  const clampedIndex = Math.max(0, Math.min(currentIndex, TEMPO_FLOW_STAGES.length - 1));
  const progressPercent = Math.round((clampedIndex / TEMPO_FLOW_STAGES.length) * 100);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" aria-label="Project flow">
      <div className="flex items-center w-full h-8 sm:h-9" role="list">
        {TEMPO_FLOW_STAGES.map((stage, index) => {
          const status = statusForIndex(index, clampedIndex);
          const isFirst = index === 0;
          const isLast = index === TEMPO_FLOW_STAGES.length - 1;
          const roundClass = isFirst
            ? "rounded-l-full"
            : isLast
              ? "rounded-r-full"
              : "";

          let segmentClass = `absolute inset-0 flex items-center justify-center bg-surface-container-highest ${roundClass}`;
          let iconName: string = stage.icon;
          let iconClass = "text-on-surface-variant/50 text-[16px] sm:text-[18px]";

          if (status === "completed") {
            segmentClass = `absolute inset-0 flex items-center justify-center bg-tertiary-container ${roundClass}`;
            iconName = "check";
            iconClass = "text-white text-[16px] sm:text-[18px]";
          } else if (status === "current") {
            segmentClass = `absolute inset-0 flex items-center justify-center bg-secondary border-2 border-secondary tempo-flow-pulse ${roundClass}`;
            iconClass = "text-white text-[18px] sm:text-[20px]";
          }

          return (
            <div
              key={stage.id}
              role="listitem"
              aria-current={status === "current" ? "step" : undefined}
              className="flex-1 h-full relative min-w-0"
            >
              <div className={segmentClass}>
                <MaterialIcon name={iconName} className={iconClass} filled />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex flex-1 min-w-0">
          {TEMPO_FLOW_STAGES.map((stage, index) => {
            const status = statusForIndex(index, clampedIndex);
            return (
              <div key={stage.id} className="flex-1 text-center min-w-0 px-0.5">
                <span
                  className={`font-label-md text-[9px] sm:text-label-md truncate block ${
                    status === "current"
                      ? "text-secondary font-bold"
                      : "text-on-surface-variant font-medium"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="hidden md:flex items-center gap-1 shrink-0 pl-2">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
            Progress
          </span>
          <span className="font-code-md text-[11px] text-secondary font-bold whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
