/**
 * CrmHomeView.tsx
 * CRM Home dashboard — short Account, Contacts, and Opportunities sections.
 * All sections start empty; students fill CRM as they progress the simulation.
 */

"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { CRM_CONTACTS, type CrmContactKey } from "@/components/crm/ContactRecordView";

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
};

type CrmHomeViewProps = {
  account: CrmHomeAccountSummary;
  contacts: CrmHomeContactSummary[];
  opportunity: CrmHomeOpportunitySummary;
  availableContactKeys: CrmContactKey[];
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
 * Home dashboard with three short coverage sections.
 */
export function CrmHomeView({
  account,
  contacts,
  opportunity,
  availableContactKeys,
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
            Your CRM starts empty. Log accounts, contacts, and opportunity stages as you work
            the deal.
          </p>
        </header>

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
                <EmptyHint message="No account yet. Add one to capture strategy notes." />
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                  Add account
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
          <div className="px-5 py-4 space-y-3">
            {contacts.length === 0 ? (
              <EmptyHint message="No contacts yet. Add buying-committee members as you meet them." />
            ) : (
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
            )}
            {availableContactKeys.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {availableContactKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onAddContact(key)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#0f4c4c] text-[#0f4c4c] text-[12px] font-medium hover:bg-[#eef5f2]"
                  >
                    <MaterialIcon name="person_add" className="text-[16px]" />
                    Add {CRM_CONTACTS[key].name}
                  </button>
                ))}
              </div>
            ) : null}
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
                className="w-full text-left rounded-md hover:bg-[#eef5f2] transition-colors p-2 -mx-2"
              >
                <p className="text-sm font-medium text-[#161d1b]">{opportunity.title}</p>
                <p className="text-xs text-[#404848] mt-1">
                  {opportunity.stageLabel} · {opportunity.activityLabel}
                </p>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <EmptyHint message="No opportunity yet. Create one when you start logging stages." />
                <button
                  type="button"
                  onClick={onOpenOpportunity}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide hover:brightness-110"
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                  Create opportunity
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
