/**
 * TempoProjectFlow.tsx
 * Chevron stage strip for Tempo top bars — completed / current / upcoming.
 */

export const TEMPO_FLOW_STAGES = [
  { id: "prospecting", label: "PROSPECTING" },
  { id: "discovery", label: "DISCOVERY" },
  { id: "presentation", label: "PRESENTATION" },
  { id: "objections", label: "OBJECTIONS" },
  { id: "negotiation", label: "NEGOTIATION" },
] as const;

export type TempoFlowStageId = (typeof TEMPO_FLOW_STAGES)[number]["id"];

type FlowStatus = "completed" | "current" | "upcoming";

type TempoProjectFlowProps = {
  /** 0-based index of the active Tempo stage. */
  currentIndex: number;
};

/**
 * Resolves chevron fill/stroke/text for a stage relative to the current one.
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
 * Theme colors for each chevron state — black / grey (not teal).
 */
function colorsForStatus(status: FlowStatus): {
  fill: string;
  stroke: string;
  text: string;
} {
  if (status === "completed") {
    return { fill: "#1A1A1A", stroke: "#1A1A1A", text: "#FFFFFF" };
  }
  if (status === "current") {
    return { fill: "#F0F0F0", stroke: "#1A1A1A", text: "#1A1A1A" };
  }
  return { fill: "#F5F5F5", stroke: "#D0D0D0", text: "#6B6B6B" };
}

/**
 * Chevron path for first / middle / last segment in a 160×64 viewBox.
 */
function chevronPath(position: "first" | "middle" | "last"): string {
  if (position === "first") {
    return "M0 4C0 1.79086 1.79086 0 4 0H140L160 32L140 64H4C1.79086 64 0 62.2091 0 60V4Z";
  }
  if (position === "last") {
    return "M0 0H156C158.209 0 160 1.79086 160 4V60C160 62.2091 158.209 64 156 64H0L20 32L0 0Z";
  }
  return "M0 0H140L160 32L140 64H0L20 32L0 0Z";
}

/**
 * Horizontal chevron project-flow strip used in every Tempo stage top bar.
 */
export function TempoProjectFlow({ currentIndex }: TempoProjectFlowProps): React.ReactElement {
  return (
    <div
      className="flex items-stretch min-w-0 flex-1 overflow-x-auto scrollbar-none"
      role="list"
      aria-label="Project flow"
    >
      {TEMPO_FLOW_STAGES.map((stage, index) => {
        const status = statusForIndex(index, currentIndex);
        const colors = colorsForStatus(status);
        const position =
          index === 0 ? "first" : index === TEMPO_FLOW_STAGES.length - 1 ? "last" : "middle";

        return (
          <div
            key={stage.id}
            role="listitem"
            aria-current={status === "current" ? "step" : undefined}
            className={`relative h-9 sm:h-10 shrink-0 ${
              index === 0 ? "min-w-[5.5rem] sm:min-w-[6.5rem] flex-[1.05]" : "min-w-[5.5rem] sm:min-w-[6.5rem] flex-1 -ml-2 sm:-ml-2.5"
            }`}
          >
            <svg
              viewBox="0 0 160 64"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              aria-hidden
            >
              <path
                d={chevronPath(position)}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={status === "upcoming" || status === "current" ? 1.5 : 0}
              />
            </svg>
            <span
              className="relative z-10 flex h-full items-center justify-center px-3 sm:px-4 text-[8px] sm:text-[10px] font-semibold tracking-wide whitespace-nowrap"
              style={{ color: colors.text }}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
