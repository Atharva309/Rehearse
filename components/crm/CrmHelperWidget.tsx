/**
 * CrmHelperWidget.tsx
 * Collapsible CRM coach tip — expands briefly, then docks as a side tab
 * (Chrome-extension style) so it does not block the CRM canvas.
 */

"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLead, SimulationStage } from "@/types";

type CrmHelperWidgetProps = {
  leads: CrmLead[];
  hasConvertedLead: boolean;
  currentStage: SimulationStage;
  loggedStages: ReadonlySet<string>;
  hasKimContact: boolean;
};

const AUTO_COLLAPSE_MS = 3500;
const COLLAPSE_ANIM_MS = 220;

/** Shared vertical anchor — panel and docked tab stay at the same height. */
const TIP_TOP_CLASS = "top-20";

const OPPORTUNITY_LOG_STAGES = [
  "discovery",
  "presentation",
  "objections",
  "close",
] as const;

type TipPhase = "open" | "closing" | "docked";

/**
 * True when Tempo has moved past Prospecting into Discovery or later.
 */
function hasReachedDiscovery(stage: SimulationStage): boolean {
  return (
    stage === "discovery" ||
    stage === "presentation" ||
    stage === "objections" ||
    stage === "close" ||
    stage === "results"
  );
}

/**
 * True when the student is still in Prospecting / lead_gen.
 */
function isInProspecting(stage: SimulationStage): boolean {
  return stage === "prospecting" || stage === "lead_gen";
}

/**
 * Maps current Tempo stage onto the Opportunity tab that should be logged now.
 */
function currentLogStage(stage: SimulationStage): string | null {
  if (stage === "discovery") {
    return "discovery";
  }
  if (stage === "presentation") {
    return "presentation";
  }
  if (stage === "objections") {
    return "objections";
  }
  if (stage === "close" || stage === "results") {
    return "close";
  }
  return null;
}

/**
 * Picks exactly one helper message from the priority order in the CRM task.
 */
function helperMessage({
  leads,
  hasConvertedLead,
  currentStage,
  loggedStages,
  hasKimContact,
}: CrmHelperWidgetProps): string {
  if (leads.length === 0) {
    return "Start here: add a Lead for the company you're researching.";
  }

  if (!hasConvertedLead && isInProspecting(currentStage)) {
    return "Fill out your Lead's details before your outreach goes out.";
  }

  if (!hasConvertedLead && hasReachedDiscovery(currentStage)) {
    return "Select your best lead in the simulation to move Prospecting forward.";
  }

  const logStage = currentLogStage(currentStage);
  if (hasConvertedLead && logStage && !loggedStages.has(logStage)) {
    return "Log this stage in your Opportunity as you complete it.";
  }

  if (currentStage === "objections" && !hasKimContact) {
    return "New stakeholder — add contacts as new people enter the deal.";
  }

  const allLogged = OPPORTUNITY_LOG_STAGES.every((stage) => loggedStages.has(stage));
  if (hasConvertedLead && allLogged) {
    return "Your CRM record is complete for this deal.";
  }

  if (hasConvertedLead && logStage && !loggedStages.has(logStage)) {
    return "Log this stage in your Opportunity as you complete it.";
  }

  return "Your CRM record is complete for this deal.";
}

/**
 * Fixed coach tip — auto-collapses to a right-edge tab after a short delay.
 */
export function CrmHelperWidget(props: CrmHelperWidgetProps): React.ReactElement {
  const message = helperMessage(props);
  const [phase, setPhase] = useState<TipPhase>("open");

  /**
   * Starts the short slide-out, then docks the tip tab.
   */
  const beginCollapse = (): void => {
    setPhase((prev) => (prev === "docked" || prev === "closing" ? prev : "closing"));
  };

  useEffect(() => {
    setPhase("open");
    const timer = window.setTimeout(() => beginCollapse(), AUTO_COLLAPSE_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (phase !== "closing") {
      return;
    }
    const timer = window.setTimeout(() => setPhase("docked"), COLLAPSE_ANIM_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "docked") {
    return (
      <button
        type="button"
        onClick={() => setPhase("open")}
        className={`fixed ${TIP_TOP_CLASS} right-0 z-[120] flex flex-col items-center gap-1 rounded-l-lg border border-r-0 border-[#bfc8c8] bg-white px-2 py-3 shadow-md hover:bg-[#eef5f2] transition-transform duration-200 ease-out`}
        style={{ animation: "crmTipDockIn 200ms ease-out" }}
        aria-label="Show CRM tip"
        title="CRM tip"
      >
        <MaterialIcon name="lightbulb" className="text-[18px] text-[#6c3a00]" />
        <span
          className="text-[10px] font-bold uppercase tracking-widest text-[#404848]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Tip
        </span>
      </button>
    );
  }

  return (
    <aside
      className={`fixed ${TIP_TOP_CLASS} right-6 z-[120] w-[min(300px,calc(100vw-280px))] rounded-lg border border-[#bfc8c8] bg-white shadow-lg shadow-black/10 p-4 transition-all duration-[220ms] ease-out ${
        phase === "closing"
          ? "opacity-0 translate-x-3 scale-95 pointer-events-none"
          : "opacity-100 translate-x-0 scale-100"
      }`}
      aria-label="CRM helper"
      aria-hidden={phase === "closing"}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#ffdcc1] text-[#6c3a00] flex items-center justify-center shrink-0">
          <MaterialIcon name="lightbulb" className="text-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#404848]">
              CRM tip
            </p>
            <button
              type="button"
              onClick={beginCollapse}
              className="text-[#707978] hover:text-[#003434] p-0.5 rounded"
              aria-label="Collapse tip"
            >
              <MaterialIcon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
          <p className="text-sm text-[#161d1b] leading-snug">{message}</p>
        </div>
      </div>
    </aside>
  );
}
