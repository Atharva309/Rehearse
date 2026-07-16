/**
 * CrmHomeView.tsx
 * CRM Home dashboard — Leads, Account, Contacts, and Opportunities sections.
 * All sections start empty; students fill CRM as they progress the simulation.
 */

"use client";

import { CrmOpportunityCompletionGauge } from "@/components/crm/CrmOpportunityCompletionGauge";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmContactKey } from "@/lib/tempo-crm-contact";

export type CrmHomeAccountSummary = {
  hasRecord: boolean;
  name: string;
  notesPreview: string;
};

export type CrmHomeContactSummary = {
  key: CrmContactKey;
  name: string;
  title: string;
  role: string;
};

export type CrmHomeOpportunitySummary = {
  hasRecord: boolean;
  title: string;
  stageLabel: string;
  activityLabel: string;
  completionPercent: number;
};

export type CrmHomeLeadSummary = {
  id: string;
  companyName: string;
  contactName: string;
  status: "new" | "selected" | "converted";
};

type CrmHomeViewProps = {
  leads: CrmHomeLeadSummary[];
  account: CrmHomeAccountSummary;
  contacts: CrmHomeContactSummary[];
  opportunity: CrmHomeOpportunitySummary;
  availableContactKeys: CrmContactKey[];
  onOpenLead: (leadId: string) => void;
  onAddLead: () => void;
  onBrowseLeads: () => void;
  onOpenAccount: () => void;
  onOpenContact: (key: CrmContactKey) => void;
  onAddContact: (key: CrmContactKey) => void;
  onOpenOpportunity: () => void;
  onBrowseAccounts: () => void;
  onBrowseContacts: () => void;
  onBrowseOpportunities: () => void;
};

/**
 * Compact empty-state row used inside Home sections.
 */
function EmptyHint({ message }: { message: string }): React.ReactElement {
  return (
    <p className="text-sm text-[#707978] py-3">{message}</p>
  );
}

/**
 * Home dashboard with Leads + coverage sections.
 */
export function CrmHomeView({
  leads,
  account,
  contacts,
  opportunity,
  availableContactKeys,
  onOpenLead,
  onAddLead,
  onBrowseLeads,
  onOpenAccount,
  onOpenContact,
  onAddContact,
  onOpenOpportunity,
  onBrowseAccounts,
  onBrowseContacts,
  onBrowseOpportunities,
}: CrmHomeViewProps): React.ReactElement {
  return (
    <div className="p-6 flex-grow overflow-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h3 className="text-2xl font-semibold tracking-tight text-[#003434]">Home</h3>
          <p className="text-sm text-[#404848] mt-1">
            Your CRM starts empty. Capture leads, then build account, contacts, and opportunity
            records as you work the deal.
          </p>
        </header>

        {/* Leads */}
        <section className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#bfc8c8] bg-[#eef5f2]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="person_search" className="text-[#0f4c4c] text-[20px]" />
              <h4 className="text-sm font-semibold tracking-wide uppercase text-[#003434]">
                Leads
              </h4>
            </div>
            <button
              type="button"
              onClick={onBrowseLeads}
              className="text-[11px] font-medium uppercase tracking-wide text-[#0f4c4c] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="px-5 py-4">
            {leads.length === 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <EmptyHint message="No leads yet. Add a Lead for the company you're researching." />
                <button
                  type="button"
                  onClick={onAddLead}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                  Add Lead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <ul className="divide-y divide-[#bfc8c8]/60">
                  {leads.slice(0, 3).map((lead) => (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => onOpenLead(lead.id)}
                        className="w-full text-left py-2.5 hover:bg-[#eef5f2] rounded-md px-2 -mx-2 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#161d1b] truncate">
                            {lead.companyName.trim() || "Untitled lead"}
                          </p>
                          <p className="text-xs text-[#404848] truncate">
                            {lead.contactName.trim() || "No contact yet"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            lead.status === "converted"
                              ? "bg-[#0f4c4c] text-white"
                              : lead.status === "selected"
                                ? "bg-[#acc7ff] text-[#00315f]"
                                : "bg-[#e3eae6] text-[#404848]"
                          }`}
                        >
                          {lead.status === "converted"
                            ? "Converted"
                            : lead.status === "selected"
                              ? "Selected"
                              : "New"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onAddLead}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                  >
                    <MaterialIcon name="add" className="text-[16px]" />
                    Add Lead
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Account */}
        <section className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#bfc8c8] bg-[#eef5f2]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="business" className="text-[#0f4c4c] text-[20px]" />
              <h4 className="text-sm font-semibold tracking-wide uppercase text-[#003434]">
                Account
              </h4>
            </div>
            <button
              type="button"
              onClick={onBrowseAccounts}
              className="text-[11px] font-medium uppercase tracking-wide text-[#0f4c4c] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="px-5 py-4">
            {account.hasRecord ? (
              <button
                type="button"
                onClick={onOpenAccount}
                className="w-full text-left rounded-md hover:bg-[#eef5f2] transition-colors p-2 -mx-2"
              >
                <p className="text-sm font-medium text-[#161d1b]">{account.name}</p>
                {account.notesPreview ? (
                  <p className="text-xs text-[#404848] mt-1 line-clamp-2">{account.notesPreview}</p>
                ) : (
                  <p className="text-xs text-[#707978] mt-1">No strategy notes yet</p>
                )}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <EmptyHint message="No account yet. Convert a Lead when you're ready to open the deal." />
                <button
                  type="button"
                  onClick={onBrowseLeads}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                >
                  <MaterialIcon name="person_search" className="text-[16px]" />
                  Go to Leads
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Contacts */}
        <section className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#bfc8c8] bg-[#eef5f2]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="group" className="text-[#0f4c4c] text-[20px]" />
              <h4 className="text-sm font-semibold tracking-wide uppercase text-[#003434]">
                Contacts
              </h4>
            </div>
            <button
              type="button"
              onClick={onBrowseContacts}
              className="text-[11px] font-medium uppercase tracking-wide text-[#0f4c4c] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="px-5 py-4">
            {contacts.length === 0 ? (
              availableContactKeys.length > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <EmptyHint message="No contacts yet. Add buying-committee members as you meet them." />
                  <button
                    type="button"
                    onClick={() => onAddContact(availableContactKeys[0])}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                  >
                    <MaterialIcon name="add" className="text-[16px]" />
                    Add contact
                  </button>
                </div>
              ) : (
                <EmptyHint message="No contacts yet. Add buying-committee members as you meet them." />
              )
            ) : (
              <div className="space-y-3">
                <ul className="divide-y divide-[#bfc8c8]/60">
                  {contacts.map((c) => (
                    <li key={c.key}>
                      <button
                        type="button"
                        onClick={() => onOpenContact(c.key)}
                        className="w-full text-left py-2.5 hover:bg-[#eef5f2] rounded-md px-2 -mx-2 transition-colors"
                      >
                        <p className="text-sm font-medium text-[#161d1b]">{c.name}</p>
                        <p className="text-xs text-[#404848]">
                          {c.role || c.title || "Role not set"}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
                {availableContactKeys.length > 0 ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onAddContact(availableContactKeys[0])}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                    >
                      <MaterialIcon name="add" className="text-[16px]" />
                      Add contact
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Opportunities */}
        <section className="bg-white border border-[#bfc8c8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#bfc8c8] bg-[#eef5f2]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MaterialIcon name="query_stats" className="text-[#0f4c4c] text-[20px]" />
              <h4 className="text-sm font-semibold tracking-wide uppercase text-[#003434]">
                Opportunities
              </h4>
            </div>
            <button
              type="button"
              onClick={onBrowseOpportunities}
              className="text-[11px] font-medium uppercase tracking-wide text-[#0f4c4c] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="px-5 py-4">
            {opportunity.hasRecord ? (
              <button
                type="button"
                onClick={onOpenOpportunity}
                className="w-full text-left rounded-md hover:bg-[#eef5f2] transition-colors p-2 -mx-2 flex items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#161d1b]">{opportunity.title}</p>
                  <p className="text-xs text-[#404848] mt-1">
                    {opportunity.stageLabel} · {opportunity.activityLabel}
                  </p>
                </div>
                <CrmOpportunityCompletionGauge
                  percent={opportunity.completionPercent}
                  size="sm"
                  className="shrink-0"
                />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <EmptyHint message="No opportunity yet. Convert a Lead when you're ready to open the deal." />
                <button
                  type="button"
                  onClick={onBrowseLeads}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                >
                  <MaterialIcon name="person_search" className="text-[16px]" />
                  Go to Leads
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
