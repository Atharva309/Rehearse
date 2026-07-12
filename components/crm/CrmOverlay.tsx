/**
 * CrmOverlay.tsx
 * In-place Rehearse CRM overlay — opportunities, accounts, and contacts.
 * Exports CrmAccess which gates the floating CRM button until after mount
 * (simulation page is a Server Component with no loading flag of its own),
 * and TempoCrmGateProvider context for HandoffModal hard-gate wiring.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccountRecordView } from "@/components/crm/AccountRecordView";
import { ContactRecordView, CRM_CONTACTS, type CrmContactKey } from "@/components/crm/ContactRecordView";
import { CrmHomeView } from "@/components/crm/CrmHomeView";
import { GoToCrmButton } from "@/components/crm/GoToCrmButton";
import { OpportunityRecordView } from "@/components/crm/OpportunityRecordView";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  accountNameFromLogs,
  availableContactKeysToAdd,
  contactHasRecord,
  opportunityTitleFromLogs,
  previewText,
  primaryContactFromLogs,
  type ContactNotesSnapshot,
} from "@/components/crm/crm-display";
import { accountHasProfile, type CrmAccountRecord } from "@/lib/tempo-crm-account";
import { findStageNeedingCrmLog } from "@/lib/tempo-crm-fields";
import type { CrmLogEntry, SimulationStage } from "@/types";

const SLIDE_OUT_MS = 250;

type CrmView =
  | "home"
  | "list"
  | "record"
  | "accounts-list"
  | "account-record"
  | "contacts-list"
  | "contact-record";

type SidebarNavId = "home" | "opportunities" | "accounts" | "contacts";

type CrmRecordStageId =
  | "prospecting"
  | "discovery"
  | "presentation"
  | "objections"
  | "close";

type CrmOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
  classId: string;
  attemptId: string;
  currentStage: SimulationStage;
  displayName: string;
  /** When set with isOpen, skip list and open Opportunity record on this stage tab. */
  deepLinkStage?: SimulationStage | null;
  /** Notifies parent when log entries change (for handoff gate / button blink). */
  onLogEntriesChange?: (entries: CrmLogEntry[]) => void;
};

type CrmAccessProps = {
  simulationId: string;
  classId: string;
  attemptId: string;
  currentStage: SimulationStage;
  displayName: string;
  /** Stages that already have a stage_scores row (completed Tempo work). */
  completedStages: string[];
  /** CRM stages already logged (from server), used until client refresh. */
  initialLoggedStages?: string[];
  children: React.ReactNode;
};

type TempoCrmGateContextValue = {
  loggedStages: ReadonlySet<string>;
  needsLoggingStage: string | null;
  openCrmForStage: (stage: string) => void;
  refreshCrmLogs: () => Promise<void>;
  /** Registers a stage as completed for gate/blink (e.g. right after submit, before page reload). */
  noteCompletedStage: (stage: string) => void;
};

const TempoCrmGateContext = createContext<TempoCrmGateContextValue>({
  loggedStages: new Set(),
  needsLoggingStage: null,
  openCrmForStage: () => undefined,
  refreshCrmLogs: async () => undefined,
  noteCompletedStage: () => undefined,
});

/**
 * HandoffModal / consumers read CRM gate state without prop-drilling through stages.
 */
export function useTempoCrmGate(): TempoCrmGateContextValue {
  return useContext(TempoCrmGateContext);
}

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
    return "opportunities";
  }
  return "home";
}

/**
 * Narrows a SimulationStage to an opportunity record tab id when valid.
 */
function asRecordStage(stage: SimulationStage | null | undefined): CrmRecordStageId | null {
  if (
    stage === "prospecting" ||
    stage === "discovery" ||
    stage === "presentation" ||
    stage === "objections" ||
    stage === "close"
  ) {
    return stage;
  }
  return null;
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
  deepLinkStage = null,
  onLogEntriesChange,
}: CrmOverlayProps): React.ReactElement | null {
  const [closing, setClosing] = useState(false);
  const [view, setView] = useState<CrmView>("home");
  const [contactKey, setContactKey] = useState<CrmContactKey>("dana_reyes");
  const [logEntries, setLogEntries] = useState<CrmLogEntry[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [accountRecord, setAccountRecord] = useState<CrmAccountRecord | null>(null);
  const [contactSnapshots, setContactSnapshots] = useState<ContactNotesSnapshot[]>([]);
  const [activeDeepLink, setActiveDeepLink] = useState<CrmRecordStageId | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      const link = asRecordStage(deepLinkStage);
      setActiveDeepLink(link);
      setView(link ? "record" : "home");
      setContactKey("dana_reyes");
    }
  }, [isOpen, deepLinkStage]);

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
      const next = body.entries ?? [];
      setLogEntries(next);
      setLogsLoaded(true);
      onLogEntriesChange?.(next);
    } catch {
      /* keep prior entries */
    }
  }, [attemptId, onLogEntriesChange]);

  const loadAccountAndContacts = useCallback(async (): Promise<void> => {
    try {
      const contactKeys = Object.keys(CRM_CONTACTS) as CrmContactKey[];
      const [accountRes, ...contactResList] = await Promise.all([
        fetch(`/api/student/crm-account?attemptId=${encodeURIComponent(attemptId)}`),
        ...contactKeys.map((key) =>
          fetch(
            `/api/student/crm-contact?attemptId=${encodeURIComponent(attemptId)}&contactKey=${encodeURIComponent(key)}`
          )
        ),
      ]);

      if (accountRes.ok) {
        const body = (await accountRes.json()) as {
          notes?: string;
          fields?: Record<string, string>;
          updated_at?: string | null;
        };
        setAccountRecord({
          fields: body.fields ?? {},
          notes: body.notes ?? "",
          updated_at: body.updated_at ?? null,
        });
      }

      const snapshots: ContactNotesSnapshot[] = [];
      for (let i = 0; i < contactKeys.length; i += 1) {
        const key = contactKeys[i];
        const res = contactResList[i];
        if (!res?.ok) {
          snapshots.push({ key, role: "", notes: "", updatedAt: null });
          continue;
        }
        const body = (await res.json()) as {
          role?: string;
          notes?: string;
          updated_at?: string | null;
        };
        snapshots.push({
          key,
          role: body.role ?? "",
          notes: body.notes ?? "",
          updatedAt: body.updated_at ?? null,
        });
      }
      setContactSnapshots(snapshots);
    } catch {
      /* keep prior */
    }
  }, [attemptId]);

  useEffect(() => {
    if (!isOpen) {
      setLogsLoaded(false);
      setLogEntries([]);
      setAccountRecord(null);
      setContactSnapshots([]);
      return;
    }
    void loadLogs();
    void loadAccountAndContacts();
  }, [isOpen, loadLogs, loadAccountAndContacts]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (view === "home" || view === "list" || view === "accounts-list" || view === "contacts-list") {
      void loadAccountAndContacts();
      void loadLogs();
    }
  }, [view, isOpen, loadAccountAndContacts, loadLogs]);

  if (!isOpen) {
    return null;
  }

  const stageLabel = crmStageLabel(currentStage);
  const activeNav = activeNavForView(view);
  const hasOpportunity = logEntries.length > 0;
  const hasAccount = accountHasProfile(accountRecord);
  const savedContacts = contactSnapshots.filter(contactHasRecord);
  const accountDisplayName =
    (accountRecord?.fields.accountName ?? "").trim() ||
    accountNameFromLogs(logEntries) ||
    (hasAccount ? "Untitled account" : "");
  const accountNotes = accountRecord?.notes ?? "";
  const oppTitle = opportunityTitleFromLogs(logEntries);
  const lastActivityLabel = hasOpportunity
    ? `Logged ${logEntries.length} stage${logEntries.length === 1 ? "" : "s"}`
    : "Not yet logged";
  const contactOptionsForLookup = savedContacts.map((c) => ({
    value: c.key,
    label: CRM_CONTACTS[c.key].name,
  }));
  const accountOptionsForLookup = hasAccount
    ? [{ value: "account", label: accountDisplayName || "Account" }]
    : [];

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
      const next = [...without, entry];
      onLogEntriesChange?.(next);
      return next;
    });
  };

  const openOpportunityRecord = (): void => {
    setActiveDeepLink(null);
    setView("record");
    if (!logsLoaded) {
      void loadLogs();
    }
  };

  const handleSidebarNav = (id: SidebarNavId): void => {
    setActiveDeepLink(null);
    if (id === "home") {
      setView("home");
      return;
    }
    if (id === "opportunities") {
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
      className={`fixed inset-0 z-[110] flex min-h-screen text-[#161d1b] bg-[#f4fbf7] ${
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

        {view === "home" ? (
          <CrmHomeView
            account={{
              hasRecord: hasAccount,
              name: accountDisplayName || "Account",
              notesPreview: previewText(accountNotes),
            }}
            contacts={savedContacts.map((c) => ({
              key: c.key,
              name: CRM_CONTACTS[c.key].name,
              title: CRM_CONTACTS[c.key].title,
              role: c.role,
            }))}
            opportunity={{
              hasRecord: hasOpportunity,
              title: oppTitle,
              stageLabel,
              activityLabel: lastActivityLabel,
            }}
            availableContactKeys={availableContactKeysToAdd(contactSnapshots)}
            onOpenAccount={() => setView("account-record")}
            onOpenContact={(key) => {
              setContactKey(key);
              setView("contact-record");
            }}
            onAddContact={(key) => {
              setContactKey(key);
              setView("contact-record");
            }}
            onOpenOpportunity={openOpportunityRecord}
            onBrowseAccounts={() => setView("accounts-list")}
            onBrowseContacts={() => setView("contacts-list")}
            onBrowseOpportunities={() => setView("list")}
          />
        ) : null}

        {view === "record" ? (
          <OpportunityRecordView
            key={activeDeepLink ? `deep-${activeDeepLink}` : "record-default"}
            attemptId={attemptId}
            currentStage={currentStage}
            logEntries={logEntries}
            onLogSaved={handleLogSaved}
            onBackToList={() => {
              setActiveDeepLink(null);
              setView("list");
            }}
            onOpenAccount={() => setView("account-record")}
            onOpenContact={(key) => {
              setContactKey(key);
              setView("contact-record");
            }}
            initialTab={activeDeepLink}
            accountLookupOptions={accountOptionsForLookup}
            contactLookupOptions={contactOptionsForLookup}
            opportunityTitle={hasOpportunity ? oppTitle : "New opportunity"}
            primaryContactLabel={
              primaryContactFromLogs(logEntries) ||
              (accountRecord?.fields.primaryContact ?? "").trim()
            }
            accountRecord={accountRecord}
          />
        ) : null}

        {view === "account-record" ? (
          <AccountRecordView
            attemptId={attemptId}
            onBackToList={() => setView("accounts-list")}
            onSaved={(record) => {
              setAccountRecord(record);
            }}
          />
        ) : null}

        {view === "contact-record" ? (
          <ContactRecordView
            key={contactKey}
            attemptId={attemptId}
            contactKey={contactKey}
            accountLabel={accountDisplayName || "—"}
            onBackToList={() => setView("contacts-list")}
            onSaved={(payload) => {
              setContactSnapshots((prev) => {
                const without = prev.filter((row) => row.key !== contactKey);
                return [
                  ...without,
                  {
                    key: contactKey,
                    role: payload.role,
                    notes: payload.notes,
                    updatedAt: payload.updatedAt,
                  },
                ];
              });
            }}
          />
        ) : null}

        {view === "accounts-list" ? (
          <div className="p-6 flex-grow overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-end justify-between gap-4">
                <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">Accounts</h3>
                {!hasAccount ? (
                  <button
                    type="button"
                    onClick={() => setView("account-record")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                  >
                    <MaterialIcon name="add" className="text-[16px]" />
                    Add account
                  </button>
                ) : null}
              </div>
              <div className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                {hasAccount ? (
                  <>
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
                            {accountDisplayName || "Untitled account"}
                          </td>
                          <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                            {(accountRecord?.fields.industry ?? "").trim() || "—"}
                          </td>
                          <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                            {(accountRecord?.fields.region ?? "").trim() || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="px-6 py-4 border-t border-[#bfc8c8] text-[12px] text-[#404848]">
                      1 of 1 account
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-[#707978]">
                      No accounts yet. Add an account to start capturing strategy notes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {view === "contacts-list" ? (
          <div className="p-6 flex-grow overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">Contacts</h3>
                {availableContactKeysToAdd(contactSnapshots).length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const next = availableContactKeysToAdd(contactSnapshots)[0];
                      if (!next) {
                        return;
                      }
                      setContactKey(next);
                      setView("contact-record");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0f4c4c] text-[#0f4c4c] text-[12px] font-medium hover:bg-[#eef5f2]"
                  >
                    <MaterialIcon name="person_add" className="text-[16px]" />
                    Add contact
                  </button>
                ) : null}
              </div>
              <div className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                {savedContacts.length > 0 ? (
                  <>
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#eef5f2]">
                        <tr>
                          <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                            Name
                          </th>
                          <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                            Role
                          </th>
                          <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                            Account
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedContacts.map((c) => (
                          <tr
                            key={c.key}
                            className="group hover:bg-[#eef5f2] transition-colors duration-150 cursor-pointer"
                            onClick={() => {
                              setContactKey(c.key);
                              setView("contact-record");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setContactKey(c.key);
                                setView("contact-record");
                              }
                            }}
                            tabIndex={0}
                            role="link"
                          >
                            <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm font-medium">
                              {CRM_CONTACTS[c.key].name}
                            </td>
                            <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                              {c.role || CRM_CONTACTS[c.key].title}
                            </td>
                            <td className="px-6 py-6 border-b border-[#bfc8c8] text-sm text-[#404848]">
                              {accountDisplayName || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-6 py-4 border-t border-[#bfc8c8] text-[12px] text-[#404848]">
                      {savedContacts.length} of {savedContacts.length} contact
                      {savedContacts.length === 1 ? "" : "s"}
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-[#707978]">
                      No contacts yet. Add someone from the buying committee to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {view === "list" ? (
          <div className="p-6 flex-grow overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <header className="flex flex-wrap items-end justify-between gap-4">
                <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">
                  My Opportunities
                </h3>
                {!hasOpportunity ? (
                  <button
                    type="button"
                    onClick={openOpportunityRecord}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                  >
                    <MaterialIcon name="add" className="text-[16px]" />
                    Create opportunity
                  </button>
                ) : null}
              </header>

              <div className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                {hasOpportunity ? (
                  <>
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#eef5f2]">
                        <tr>
                          <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                            Opportunity
                          </th>
                          <th className="px-6 py-4 text-[12px] font-medium tracking-wide text-[#404848] border-b border-[#bfc8c8]">
                            Stage
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
                          aria-label={`Open ${oppTitle}`}
                        >
                          <td className="px-6 py-6 border-b border-[#bfc8c8]">
                            <span className="text-sm text-[#161d1b] font-medium">{oppTitle}</span>
                          </td>
                          <td className="px-6 py-6 border-b border-[#bfc8c8]">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#0f4c4c] text-white text-[10px] font-bold uppercase tracking-widest">
                              {stageLabel}
                            </span>
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
                    <div className="px-6 py-4 bg-white border-t border-[#bfc8c8] text-[12px] text-[#404848]">
                      1 of 1 opportunity
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-[#707978]">
                      No opportunities yet. Create one when you are ready to log a stage.
                    </p>
                  </div>
                )}
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
 * Owns CRM open/deep-link state and provides gate context to HandoffModal.
 */
export function CrmAccess({
  simulationId,
  classId,
  attemptId,
  currentStage,
  displayName,
  completedStages,
  initialLoggedStages = [],
  children,
}: CrmAccessProps): React.ReactElement {
  const [isPageReady, setIsPageReady] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(false);
  const [deepLinkStage, setDeepLinkStage] = useState<SimulationStage | null>(null);
  const [loggedStageIds, setLoggedStageIds] = useState<string[]>(initialLoggedStages);
  const [liveCompleted, setLiveCompleted] = useState<string[]>(completedStages);

  useEffect(() => {
    setIsPageReady(true);
  }, []);

  useEffect(() => {
    setLiveCompleted(completedStages);
  }, [completedStages]);

  useEffect(() => {
    setLoggedStageIds(initialLoggedStages);
  }, [initialLoggedStages]);

  const refreshCrmLogs = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(
        `/api/student/crm-log?attemptId=${encodeURIComponent(attemptId)}`
      );
      if (!res.ok) {
        return;
      }
      const body = (await res.json()) as { entries?: CrmLogEntry[] };
      setLoggedStageIds((body.entries ?? []).map((e) => e.stage));
    } catch {
      /* keep prior */
    }
  }, [attemptId]);

  useEffect(() => {
    if (!isPageReady) {
      return;
    }
    void refreshCrmLogs();
  }, [isPageReady, refreshCrmLogs]);

  const loggedStages = useMemo(() => new Set(loggedStageIds), [loggedStageIds]);

  const needsLoggingStage = useMemo(
    () => findStageNeedingCrmLog(liveCompleted, loggedStages),
    [liveCompleted, loggedStages]
  );

  const openCrmForStage = useCallback((stage: string): void => {
    setDeepLinkStage(stage as SimulationStage);
    setIsCrmOpen(true);
  }, []);

  const noteCompletedStage = useCallback((stage: string): void => {
    setLiveCompleted((prev) => (prev.includes(stage) ? prev : [...prev, stage]));
  }, []);

  const handleCloseCrm = useCallback((): void => {
    setIsCrmOpen(false);
    setDeepLinkStage(null);
    void refreshCrmLogs();
  }, [refreshCrmLogs]);

  const handleLogEntriesChange = useCallback((entries: CrmLogEntry[]): void => {
    setLoggedStageIds(entries.map((e) => e.stage));
  }, []);

  const gateValue = useMemo<TempoCrmGateContextValue>(
    () => ({
      loggedStages,
      needsLoggingStage,
      openCrmForStage,
      refreshCrmLogs,
      noteCompletedStage,
    }),
    [loggedStages, needsLoggingStage, openCrmForStage, refreshCrmLogs, noteCompletedStage]
  );

  return (
    <TempoCrmGateContext.Provider value={gateValue}>
      {children}
      {isPageReady ? (
        <>
          <GoToCrmButton
            needsLogging={needsLoggingStage !== null}
            onClick={() => {
              setDeepLinkStage(null);
              setIsCrmOpen(true);
            }}
          />
          <CrmOverlay
            isOpen={isCrmOpen}
            onClose={handleCloseCrm}
            simulationId={simulationId}
            classId={classId}
            attemptId={attemptId}
            currentStage={currentStage}
            displayName={displayName}
            deepLinkStage={deepLinkStage}
            onLogEntriesChange={handleLogEntriesChange}
          />
        </>
      ) : null}
    </TempoCrmGateContext.Provider>
  );
}
