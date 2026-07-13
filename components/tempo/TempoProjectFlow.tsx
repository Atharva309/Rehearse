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
 * Theme colors — done black, current blue-grey, upcoming white.
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
    return { fill: "#B4BECB", stroke: "#1E293B", text: "#1E293B" };
  }
  return { fill: "#FFFFFF", stroke: "#D0D5DD", text: "#6B7280" };
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
 * Fills its parent width so the top bar can align it with the middle column.
 */
export function TempoProjectFlow({ currentIndex }: TempoProjectFlowProps): React.ReactElement {
  return (
    <div
      className="flex items-stretch w-full min-w-0 overflow-x-auto scrollbar-none"
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
            className={`relative h-9 sm:h-10 min-w-0 flex-1 ${
              index === 0 ? "" : "-ml-2 sm:-ml-2.5"
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
              className="relative z-10 flex h-full items-center justify-center px-1 sm:px-2 text-[7px] sm:text-[10px] font-semibold tracking-wide whitespace-nowrap"
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
