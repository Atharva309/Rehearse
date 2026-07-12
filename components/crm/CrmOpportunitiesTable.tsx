/**
 * CrmOpportunitiesTable.tsx
 * Rehearse CRM opportunities list — Stitch visual reference for Tempo/Summit Dental.
 * Client component for slide-out “Back to Simulation” navigation.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { SimulationStage } from "@/types";

type CrmOpportunitiesTableProps = {
  simulationId: string;
  classId: string;
  attemptId: string;
  displayName: string;
  currentStage: SimulationStage;
};

const CRM_STAGE_LABELS: Partial<Record<SimulationStage, string>> = {
  lead_gen: "Prospecting",
  prospecting: "Prospecting",
  discovery: "Discovery",
  presentation: "Presentation",
  objections: "Objection Handling",
  close: "Negotiation",
  results: "Negotiation",
};

const SIDEBAR_NAV = [
  { id: "home", label: "Home", icon: "home", active: true },
  { id: "opportunities", label: "Opportunities", icon: "query_stats", active: false },
  { id: "accounts", label: "Accounts", icon: "business", active: false },
  { id: "contacts", label: "Contacts", icon: "group", active: false },
] as const;

/**
 * Maps attempt.current_stage to the CRM opportunity stage badge label.
 */
function crmStageLabel(stage: SimulationStage): string {
  return CRM_STAGE_LABELS[stage] ?? "Prospecting";
}

/**
 * Full-screen CRM shell with a single Summit Dental opportunity row.
 */
export function CrmOpportunitiesTable({
  simulationId,
  classId,
  attemptId,
  displayName,
  currentStage,
}: CrmOpportunitiesTableProps): React.ReactElement {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const stageLabel = crmStageLabel(currentStage);
  const backHref = `/student/simulation/${simulationId}?classId=${encodeURIComponent(classId)}&attempt=${encodeURIComponent(attemptId)}`;

  /**
   * Plays slide-out, then returns to the Tempo stage runner for this attempt.
   */
  const handleBackToSimulation = (): void => {
    if (isClosing) {
      return;
    }
    setIsClosing(true);
    window.setTimeout(() => {
      router.push(backHref);
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[50] flex min-h-screen text-[#161d1b] bg-[#f4fbf7] ${
        isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
      }`}
    >
      {/* Side nav */}
      <aside className="fixed left-0 top-0 h-full z-40 flex flex-col pt-8 w-[240px] text-[#dde4e1] bg-[#2d3142]">
        <div className="px-4 mb-8">
          <h1 className="text-lg font-bold text-white leading-6">Rehearse CRM</h1>
          <p className="text-[12px] font-medium tracking-wide text-[#606376] opacity-80 uppercase mt-0.5">
            Sales Intelligence
          </p>
        </div>
        <nav className="flex-grow">
          {SIDEBAR_NAV.map((item) =>
            item.active ? (
              <div
                key={item.id}
                className="bg-[#0f4c4c] text-[#85bbbb] rounded-lg mx-2 my-1 px-4 py-2 flex items-center gap-4"
                aria-current="page"
              >
                <MaterialIcon name={item.icon} className="text-[22px]" />
                <span className="text-[12px] font-medium tracking-wide uppercase">{item.label}</span>
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                disabled
                className="text-[#606376] mx-2 my-1 px-4 py-2 flex items-center gap-4 rounded-lg w-[calc(100%-1rem)] opacity-70 cursor-not-allowed text-left"
                title="Coming soon"
              >
                <MaterialIcon name={item.icon} className="text-[22px]" />
                <span className="text-[12px] font-medium tracking-wide uppercase">{item.label}</span>
              </button>
            )
          )}
        </nav>
        <div className="p-4 border-t border-[#171b2b]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-[#bfc8c8] bg-[#0f4c4c] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {displayName.trim().charAt(0).toUpperCase() || "S"}
            </div>
            <div className="overflow-hidden">
              <p className="text-[12px] font-medium text-white truncate">{displayName}</p>
              <p className="text-[10px] text-[#606376] uppercase tracking-wider">Sales Trainee</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main canvas */}
      <main className="ml-[240px] flex-grow flex flex-col h-screen min-w-0">
        <header className="flex justify-between items-center w-full px-6 py-4 bg-[#f4fbf7] border-b border-[#bfc8c8] shadow-sm sticky top-0 z-30">
          <h2 className="text-lg font-bold text-[#003434]">Rehearse CRM</h2>
          <button
            type="button"
            onClick={handleBackToSimulation}
            disabled={isClosing}
            className="px-4 py-2 border border-[#003434] text-[#003434] text-[12px] font-medium rounded-lg hover:bg-[#eef5f2] transition-colors duration-200 uppercase tracking-wide disabled:opacity-60"
          >
            Back to Simulation
          </button>
        </header>

        <div className="p-6 flex-grow overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">My Opportunities</h3>
            </header>

            <div className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eef5f2]">
                  <tr>
                    <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                      Account
                    </th>
                    <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                      Stage
                    </th>
                    <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                      Value
                    </th>
                    <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group hover:bg-[#eef5f2] transition-colors duration-150">
                    <td className="px-6 py-6 border-b border-[#bfc8c8]">
                      <span className="text-sm text-[#161d1b] font-medium">
                        Summit Dental Group — Tempo Pro
                      </span>
                    </td>
                    <td className="px-6 py-6 border-b border-[#bfc8c8]">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#0f4c4c] text-white text-[10px] font-bold uppercase tracking-widest">
                        {stageLabel}
                      </span>
                    </td>
                    <td className="px-6 py-6 border-b border-[#bfc8c8]">
                      <span className="font-code-md text-[13px] text-[#161d1b]">$14,600/yr</span>
                    </td>
                    <td className="px-6 py-6 border-b border-[#bfc8c8]">
                      <div className="flex items-center gap-1 text-[#404848] opacity-60">
                        <MaterialIcon name="history" className="text-[18px]" />
                        <span className="text-sm">Not yet logged</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="px-6 py-4 bg-white border-t border-[#bfc8c8] flex justify-between items-center">
                <span className="text-[12px] font-medium text-[#404848]">1 of 1 opportunity</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc8c8] text-[#707978] opacity-40 cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <MaterialIcon name="chevron_left" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc8c8] text-[#707978] opacity-40 cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <MaterialIcon name="chevron_right" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden h-48 border border-[#bfc8c8] shadow-[0_1px_3px_rgba(0,0,0,0.05)] opacity-60">
              <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center bg-[#f4fbf7]/40 backdrop-blur-sm">
                <p className="text-base text-[#003434] max-w-md">
                  No further opportunities pending review. Your current pipeline is clean and
                  updated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
