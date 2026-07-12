/**
 * CrmOverlay.tsx
 * In-place Rehearse CRM overlay — opportunities, accounts, and contacts.
 * Exports CrmAccess which gates the floating CRM button until after mount
 * (simulation page is a Server Component with no loading flag of its own).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AccountRecordView, SUMMIT_DENTAL_ACCOUNT } from "@/components/crm/AccountRecordView";
import { ContactRecordView, CRM_CONTACTS, type CrmContactKey } from "@/components/crm/ContactRecordView";
import { GoToCrmButton } from "@/components/crm/GoToCrmButton";
import { OpportunityRecordView } from "@/components/crm/OpportunityRecordView";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLogEntry, SimulationStage } from "@/types";

const SLIDE_OUT_MS = 250;

type CrmView =
  | "list"
  | "record"
  | "accounts-list"
  | "account-record"
  | "contacts-list"
  | "contact-record";

type SidebarNavId = "home" | "opportunities" | "accounts" | "contacts";

type CrmOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
  classId: string;
  attemptId: string;
  currentStage: SimulationStage;
  displayName: string;
};

type CrmAccessProps = {
  simulationId: string;
  classId: string;
  attemptId: string;
  currentStage: SimulationStage;
  displayName: string;
  children: React.ReactNode;
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

const SIDEBAR_ITEMS: { id: SidebarNavId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "opportunities", label: "Opportunities", icon: "query_stats" },
  { id: "accounts", label: "Accounts", icon: "business" },
  { id: "contacts", label: "Contacts", icon: "group" },
];

/**
 * Maps attempt.current_stage to the CRM opportunity stage badge label.
 */
function crmStageLabel(stage: SimulationStage): string {
  return CRM_STAGE_LABELS[stage] ?? "Prospecting";
}

/**
 * Resolves which sidebar item should appear active for the current view.
 */
function activeNavForView(view: CrmView): SidebarNavId {
  if (view === "accounts-list" || view === "account-record") {
    return "accounts";
  }
  if (view === "contacts-list" || view === "contact-record") {
    return "contacts";
  }
  if (view === "list" || view === "record") {
    return view === "list" ? "home" : "opportunities";
  }
  return "home";
}

/**
 * Full-viewport CRM overlay — covers the stage without unmounting it.
 */
export function CrmOverlay({
  isOpen,
  onClose,
  attemptId,
  currentStage,
  displayName,
}: CrmOverlayProps): React.ReactElement | null {
  const [closing, setClosing] = useState(false);
  const [view, setView] = useState<CrmView>("list");
  const [contactKey, setContactKey] = useState<CrmContactKey>("dana_reyes");
  const [logEntries, setLogEntries] = useState<CrmLogEntry[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setView("list");
      setContactKey("dana_reyes");
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const loadLogs = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(
        `/api/student/crm-log?attemptId=${encodeURIComponent(attemptId)}`
      );
      if (!res.ok) {
        return;
      }
      const body = (await res.json()) as { entries?: CrmLogEntry[] };
      setLogEntries(body.entries ?? []);
      setLogsLoaded(true);
    } catch {
      /* keep prior entries */
    }
  }, [attemptId]);

  useEffect(() => {
    if (!isOpen) {
      setLogsLoaded(false);
      setLogEntries([]);
      return;
    }
    void loadLogs();
  }, [isOpen, loadLogs]);

  if (!isOpen) {
    return null;
  }

  const stageLabel = crmStageLabel(currentStage);
  const activeNav = activeNavForView(view);
  const lastActivityLabel =
    logEntries.length > 0
      ? `Logged ${logEntries.length} stage${logEntries.length === 1 ? "" : "s"}`
      : "Not yet logged";

  const handleBackToSimulation = (): void => {
    if (closing) {
      return;
    }
    setClosing(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, SLIDE_OUT_MS);
  };

  const handleLogSaved = (entry: CrmLogEntry): void => {
    setLogEntries((prev) => {
      const without = prev.filter((row) => row.stage !== entry.stage);
      return [...without, entry];
    });
  };

  const openOpportunityRecord = (): void => {
    setView("record");
    if (!logsLoaded) {
      void loadLogs();
    }
  };

  const handleSidebarNav = (id: SidebarNavId): void => {
    if (id === "home" || id === "opportunities") {
      setView("list");
      return;
    }
    if (id === "accounts") {
      setView("accounts-list");
      return;
    }
    setView("contacts-list");
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex min-h-screen text-[#161d1b] bg-[#f4fbf7] ${
        closing ? "animate-slide-out-right" : "animate-slide-in-right"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Rehearse CRM"
    >
      <aside className="fixed left-0 top-0 h-full z-40 flex flex-col pt-8 w-[240px] text-[#dde4e1] bg-[#2d3142]">
        <div className="px-4 mb-8">
          <h1 className="text-lg font-bold text-white leading-6">Rehearse CRM</h1>
          <p className="text-[12px] font-medium tracking-wide text-[#606376] opacity-80 uppercase mt-0.5">
            Sales Intelligence
          </p>
        </div>
        <nav className="flex-grow">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSidebarNav(item.id)}
                className={`mx-2 my-1 px-4 py-2 flex items-center gap-4 rounded-lg w-[calc(100%-1rem)] text-left transition-colors ${
                  isActive
                    ? "bg-[#0f4c4c] text-[#85bbbb]"
                    : "text-[#606376] hover:bg-white/5 hover:text-[#dde4e1]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <MaterialIcon name={item.icon} className="text-[22px]" />
                <span className="text-[12px] font-medium tracking-wide uppercase">{item.label}</span>
              </button>
            );
          })}
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

      <main className="ml-[240px] flex-grow flex flex-col h-screen min-w-0">
        <header className="flex justify-between items-center w-full px-6 py-4 bg-[#f4fbf7] border-b border-[#bfc8c8] shadow-sm sticky top-0 z-30">
          <h2 className="text-lg font-bold text-[#003434]">Rehearse CRM</h2>
          <button
            type="button"
            onClick={handleBackToSimulation}
            disabled={closing}
            className="px-4 py-2 border border-[#003434] text-[#003434] text-[12px] font-medium rounded-lg hover:bg-[#eef5f2] transition-colors duration-200 uppercase tracking-wide disabled:opacity-60"
          >
            Back to Simulation
          </button>
        </header>

        {view === "record" ? (
          <OpportunityRecordView
            attemptId={attemptId}
            currentStage={currentStage}
            logEntries={logEntries}
            onLogSaved={handleLogSaved}
            onBackToList={() => setView("list")}
            onOpenAccount={() => setView("account-record")}
            onOpenContact={(key) => {
              setContactKey(key);
              setView("contact-record");
            }}
          />
        ) : null}

        {view === "account-record" ? (
          <AccountRecordView
            attemptId={attemptId}
            onBackToList={() => setView("accounts-list")}
          />
        ) : null}

        {view === "contact-record" ? (
          <ContactRecordView
            key={contactKey}
            attemptId={attemptId}
            contactKey={contactKey}
            onBackToList={() => setView("contacts-list")}
          />
        ) : null}

        {view === "accounts-list" ? (
          <div className="p-6 flex-grow overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">Accounts</h3>
              <div className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#eef5f2]">
                    <tr>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Account
                      </th>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Industry
                      </th>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Locations
                      </th>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Region
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className="group hover:bg-[#eef5f2] transition-colors duration-150 cursor-pointer"
                      onClick={() => setView("account-record")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setView("account-record");
                        }
                      }}
                      tabIndex={0}
                      role="link"
                    >
                      <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm font-medium">
                        {SUMMIT_DENTAL_ACCOUNT.name}
                      </td>
                      <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                        {SUMMIT_DENTAL_ACCOUNT.industry}
                      </td>
                      <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                        {SUMMIT_DENTAL_ACCOUNT.locations}
                      </td>
                      <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                        {SUMMIT_DENTAL_ACCOUNT.region}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-[#bfc8c8] text-[12px] text-[#404848]">
                  1 of 1 account
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {view === "contacts-list" ? (
          <div className="p-6 flex-grow overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">Contacts</h3>
              <div className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#eef5f2]">
                    <tr>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Name
                      </th>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Title
                      </th>
                      <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                        Account
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(CRM_CONTACTS) as CrmContactKey[]).map((key) => (
                      <tr
                        key={key}
                        className="group hover:bg-[#eef5f2] transition-colors duration-150 cursor-pointer"
                        onClick={() => {
                          setContactKey(key);
                          setView("contact-record");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setContactKey(key);
                            setView("contact-record");
                          }
                        }}
                        tabIndex={0}
                        role="link"
                      >
                        <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm font-medium">
                          {CRM_CONTACTS[key].name}
                        </td>
                        <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                          {CRM_CONTACTS[key].title}
                        </td>
                        <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                          {SUMMIT_DENTAL_ACCOUNT.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-[#bfc8c8] text-[12px] text-[#404848]">
                  2 of 2 contacts
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {view === "list" ? (
          <div className="p-6 flex-grow overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <header className="flex items-end justify-between">
                <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">
                  My Opportunities
                </h3>
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
                    <tr
                      className="group hover:bg-[#eef5f2] transition-colors duration-150 cursor-pointer"
                      onClick={openOpportunityRecord}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openOpportunityRecord();
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label="Open Summit Dental Group opportunity"
                    >
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
                          <span className="text-sm">{lastActivityLabel}</span>
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
        ) : null}
      </main>
    </div>
  );
}

/**
 * Client bridge — wraps stage content and only shows Go to CRM after mount,
 * so the floating button does not appear before the stage UI hydrates.
 */
export function CrmAccess({
  simulationId,
  classId,
  attemptId,
  currentStage,
  displayName,
  children,
}: CrmAccessProps): React.ReactElement {
  const [isPageReady, setIsPageReady] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(false);

  useEffect(() => {
    setIsPageReady(true);
  }, []);

  return (
    <>
      {children}
      {isPageReady ? (
        <>
          <GoToCrmButton onClick={() => setIsCrmOpen(true)} />
          <CrmOverlay
            isOpen={isCrmOpen}
            onClose={() => setIsCrmOpen(false)}
            simulationId={simulationId}
            classId={classId}
            attemptId={attemptId}
            currentStage={currentStage}
            displayName={displayName}
          />
        </>
      ) : null}
    </>
  );
}
