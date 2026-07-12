/**
 * OpportunityRecordView.tsx
 * CRM opportunity record — stepper, stage tabs, and per-stage log forms.
 * Rendered inside CrmOverlay’s shared shell (sidebar/top bar stay in the overlay).
 */

"use client";

import { useMemo, useState } from "react";
import { CrmStageLogForm } from "@/components/crm/CrmStageLogForm";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLogEntry, SimulationStage } from "@/types";

const CRM_RECORD_STAGES = [
  { id: "prospecting" as const, label: "Prospecting", number: 1 },
  { id: "discovery" as const, label: "Discovery", number: 2 },
  { id: "presentation" as const, label: "Presentation", number: 3 },
  { id: "objections" as const, label: "Objection Handling", number: 4 },
  { id: "close" as const, label: "Negotiation", number: 5 },
];

type CrmRecordStageId = (typeof CRM_RECORD_STAGES)[number]["id"];

type TabStatus = "logged" | "needs_logging" | "locked";

type OpportunityRecordViewProps = {
  attemptId: string;
  currentStage: SimulationStage;
  logEntries: CrmLogEntry[];
  onLogSaved: (entry: CrmLogEntry) => void;
  onBackToList: () => void;
};

/**
 * Maps attempt.current_stage onto the CRM record stage order.
 */
function normalizeCrmStage(stage: SimulationStage): CrmRecordStageId {
  if (stage === "lead_gen") {
    return "prospecting";
  }
  if (stage === "results") {
    return "close";
  }
  if (
    stage === "prospecting" ||
    stage === "discovery" ||
    stage === "presentation" ||
    stage === "objections" ||
    stage === "close"
  ) {
    return stage;
  }
  return "prospecting";
}

/**
 * Index of a CRM stage in the record stepper (0–4).
 */
function crmStageIndex(stage: CrmRecordStageId): number {
  return CRM_RECORD_STAGES.findIndex((s) => s.id === stage);
}

/**
 * Contact shown in the record header for the selected tab.
 */
function contactForStage(stage: CrmRecordStageId): string {
  if (stage === "objections" || stage === "close") {
    return "Dr. Saul Kim";
  }
  return "Dana Reyes";
}

/**
 * Tab unlock / logging status from Tempo progress + saved CRM rows.
 */
function tabStatusForStage(
  stageId: CrmRecordStageId,
  currentStage: SimulationStage,
  loggedStages: ReadonlySet<string>
): TabStatus {
  const currentIndex = crmStageIndex(normalizeCrmStage(currentStage));
  const thisIndex = crmStageIndex(stageId);
  if (thisIndex > currentIndex) {
    return "locked";
  }
  if (loggedStages.has(stageId)) {
    return "logged";
  }
  return "needs_logging";
}

/**
 * Opportunity record canvas: header, stepper, tabs, and active stage form.
 */
export function OpportunityRecordView({
  attemptId,
  currentStage,
  logEntries,
  onLogSaved,
  onBackToList,
}: OpportunityRecordViewProps): React.ReactElement {
  const loggedStages = useMemo(
    () => new Set(logEntries.map((entry) => entry.stage)),
    [logEntries]
  );

  const normalizedCurrent = normalizeCrmStage(currentStage);
  const currentIndex = crmStageIndex(normalizedCurrent);
  const progressPct =
    CRM_RECORD_STAGES.length <= 1
      ? 0
      : Math.round((currentIndex / (CRM_RECORD_STAGES.length - 1)) * 100);

  const defaultTab =
    CRM_RECORD_STAGES.find(
      (s) => tabStatusForStage(s.id, currentStage, loggedStages) !== "locked"
    )?.id ?? "prospecting";

  const [selectedTab, setSelectedTab] = useState<CrmRecordStageId>(defaultTab);

  const selectedStatus = tabStatusForStage(selectedTab, currentStage, loggedStages);
  const existingEntry =
    logEntries.find((entry) => entry.stage === selectedTab) ?? null;
  const stageBadgeLabel =
    CRM_RECORD_STAGES.find((s) => s.id === normalizedCurrent)?.label ?? "Prospecting";

  return (
    <div className="p-6 flex-grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-[#404848] text-[12px] font-medium tracking-wide">
          <button
            type="button"
            onClick={onBackToList}
            className="hover:text-[#0f4c4c] transition-colors"
          >
            Opportunities
          </button>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <span className="text-[#161d1b]">Summit Dental Group</span>
        </nav>

        {/* Record header */}
        <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm p-6 mb-6">
          <div className="space-y-1">
            <span className="text-[12px] font-medium tracking-widest uppercase text-[#404848]">
              Opportunity
            </span>
            <h2 className="text-[32px] leading-10 font-semibold tracking-tight text-[#003434]">
              Summit Dental Group — Tempo Pro
            </h2>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
              <div className="flex items-center gap-2">
                <MaterialIcon name="person" className="text-[#404848] text-[18px]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium tracking-wide text-[#404848]">
                    CONTACT
                  </span>
                  <span className="text-sm font-medium text-[#161d1b]">
                    {contactForStage(selectedTab)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MaterialIcon name="payments" className="text-[#404848] text-[18px]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium tracking-wide text-[#404848]">
                    VALUE
                  </span>
                  <span className="text-sm font-medium text-[#0f4c4c]">$14,600/yr</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MaterialIcon name="account_tree" className="text-[#404848] text-[18px]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium tracking-wide text-[#404848]">
                    STAGE
                  </span>
                  <span className="text-sm font-medium px-2 py-0.5 bg-[#ffdcc1] rounded text-[#6c3a00] w-fit">
                    {stageBadgeLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage stepper */}
        <div className="mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10 px-4">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#bfc8c8] -translate-y-1/2 -z-10" />
            <div
              className="absolute top-1/2 left-0 h-[2px] bg-[#0f4c4c] -translate-y-1/2 -z-10 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
            {CRM_RECORD_STAGES.map((step) => {
              const index = crmStageIndex(step.id);
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-[#f4fbf7]">
                  {isComplete ? (
                    <div className="w-8 h-8 rounded-full bg-[#0f4c4c] text-white flex items-center justify-center border-4 border-[#f4fbf7] shadow-sm">
                      <MaterialIcon name="check" className="text-[18px]" filled />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0f4c4c] text-[#0f4c4c] flex items-center justify-center shadow-sm relative">
                      <div className="absolute inset-0 rounded-full border-2 border-[#0f4c4c] animate-ping opacity-25" />
                      <span className="text-[12px] font-bold">{step.number}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#e8efec] border-2 border-[#bfc8c8] text-[#707978] flex items-center justify-center">
                      <span className="text-[12px] font-medium">{step.number}</span>
                    </div>
                  )}
                  <span
                    className={`text-[12px] font-medium tracking-wide ${
                      isCurrent
                        ? "text-[#0f4c4c] font-bold"
                        : isComplete
                          ? "text-[#404848]"
                          : "text-[#707978]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#bfc8c8] mb-6 overflow-x-auto">
          {CRM_RECORD_STAGES.map((step) => {
            const status = tabStatusForStage(step.id, currentStage, loggedStages);
            const isSelected = selectedTab === step.id;
            const isLocked = status === "locked";

            return (
              <button
                key={step.id}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  if (!isLocked) {
                    setSelectedTab(step.id);
                  }
                }}
                className={`px-6 py-4 flex items-center gap-2 text-[12px] font-medium tracking-wide whitespace-nowrap border-b-2 transition-all ${
                  isLocked
                    ? "text-[#707978] cursor-not-allowed border-transparent"
                    : isSelected
                      ? "text-[#003434] font-bold border-[#0f4c4c] bg-[#eef5f2]/40"
                      : "text-[#404848] border-transparent hover:text-[#0f4c4c]"
                }`}
              >
                {step.label}
                {status === "logged" ? (
                  <>
                    <MaterialIcon
                      name="check_circle"
                      className="text-[16px] text-[#0f4c4c]"
                      filled
                    />
                    <span className="text-[10px] bg-[#9ad0d0]/30 px-1 rounded text-[#0f4c4c]">
                      LOGGED
                    </span>
                  </>
                ) : null}
                {status === "needs_logging" ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-[#ffb877] shadow-[0_0_8px_rgba(255,184,119,0.6)]" />
                    <span className="text-[10px] text-[#482500] font-bold">NEEDS LOGGING</span>
                  </>
                ) : null}
                {status === "locked" ? (
                  <MaterialIcon name="lock" className="text-[14px]" />
                ) : null}
              </button>
            );
          })}
        </div>

        {selectedStatus === "locked" ? (
          <div className="p-4 bg-[#eef5f2] border-l-4 border-[#bfc8c8] rounded flex items-start gap-3 opacity-60">
            <MaterialIcon name="info" className="text-[#707978]" />
            <p className="text-[12px] font-medium text-[#161d1b]">
              Complete this stage in the simulation first, then return here to log it.
            </p>
          </div>
        ) : (
          <>
            <CrmStageLogForm
              key={`${selectedTab}-${existingEntry?.submitted_at ?? "new"}-${existingEntry ? "saved" : "blank"}`}
              stage={selectedTab}
              attemptId={attemptId}
              existingEntry={existingEntry}
              onSaved={onLogSaved}
            />
            <div className="mt-8 p-4 bg-[#eef5f2] border-l-4 border-[#bfc8c8] rounded flex items-start gap-3 opacity-60">
              <MaterialIcon name="info" className="text-[#707978]" />
              <p className="text-[12px] font-medium text-[#161d1b]">
                Complete this stage in the simulation, then log it here to unlock the next one.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
