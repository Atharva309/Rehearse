/**
 * CrmHelperWidget.tsx
 * Persistent top-right CRM coach card — one prioritized guidance message.
 */

"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLead, SimulationStage } from "@/types";

type CrmHelperWidgetProps = {
  leads: CrmLead[];
  hasConvertedLead: boolean;
  currentStage: SimulationStage;
  loggedStages: ReadonlySet<string>;
  hasKimContact: boolean;
};

const OPPORTUNITY_LOG_STAGES = [
  "discovery",
  "presentation",
  "objections",
  "close",
] as const;

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
    return "Convert your Lead now to unlock Discovery logging.";
  }

  const logStage = currentLogStage(currentStage);
  if (hasConvertedLead && logStage && !loggedStages.has(logStage)) {
    return "Log this stage in your Opportunity as you complete it.";
  }

  if (currentStage === "objections" && !hasKimContact) {
    return "New stakeholder — add Dr. Saul Kim as a Contact.";
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
 * Fixed coach card shown while the CRM overlay is open.
 */
export function CrmHelperWidget(props: CrmHelperWidgetProps): React.ReactElement {
  const message = helperMessage(props);

  return (
    <aside
      className="fixed top-20 right-6 z-[120] w-[min(320px,calc(100vw-280px))] rounded-lg border border-[#bfc8c8] bg-white shadow-lg shadow-black/10 p-4"
      aria-label="CRM helper"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#ffdcc1] text-[#6c3a00] flex items-center justify-center shrink-0">
          <MaterialIcon name="lightbulb" className="text-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#404848] mb-1">
            CRM tip
          </p>
          <p className="text-sm text-[#161d1b] leading-snug">{message}</p>
        </div>
      </div>
    </aside>
  );
}
