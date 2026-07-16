/**
 * ProspectingLeadSelectionStep.tsx
 * Prospecting wizard step — pick and validate the target CRM Lead.
 * On success the wizard advances; failures show ConvertFailureModal.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { ConvertFailureModal } from "@/components/crm/ConvertFailureModal";
import { useTempoCrmGate } from "@/components/crm/CrmOverlay";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLead } from "@/types";

type ProspectingLeadSelectionStepProps = {
  attemptId: string;
  selectedLeadId: string | null;
  onSelected: (leadId: string) => Promise<void>;
};

/**
 * Selectable Lead list with CRM deep-link when none exist yet.
 */
export function ProspectingLeadSelectionStep({
  attemptId,
  selectedLeadId,
  onSelected,
}: ProspectingLeadSelectionStepProps): React.ReactElement {
  const { openCrmLeads } = useTempoCrmGate();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickedId, setPickedId] = useState<string | null>(selectedLeadId);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerNote, setManagerNote] = useState<string | null>(null);

  const loadLeads = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student/crm-leads?attemptId=${encodeURIComponent(attemptId)}`
      );
      if (!res.ok) {
        setError("Could not load leads.");
        return;
      }
      const body = (await res.json()) as { leads?: CrmLead[] };
      setLeads(body.leads ?? []);
    } catch {
      setError("Could not load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    setPickedId(selectedLeadId);
  }, [selectedLeadId]);

  /**
   * Validates and marks the picked Lead as the Prospecting target.
   */
  const handleSelectTarget = async (): Promise<void> => {
    if (!pickedId || isSelecting) {
      return;
    }
    setIsSelecting(true);
    setError(null);
    setManagerNote(null);
    try {
      const res = await fetch(
        `/api/student/crm-leads/${encodeURIComponent(pickedId)}/select`,
        { method: "POST" }
      );
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        managerNote?: string;
        error?: string;
      } | null;

      if (!res.ok || !body?.success) {
        if (typeof body?.managerNote === "string" && body.managerNote.trim()) {
          setManagerNote(body.managerNote);
          return;
        }
        setError(body?.error ?? "Could not select this lead.");
        return;
      }

      await onSelected(pickedId);
    } catch {
      setError("Could not select this lead.");
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {managerNote ? (
        <ConvertFailureModal
          managerNote={managerNote}
          onDismiss={() => setManagerNote(null)}
        />
      ) : null}

      <div>
        <div className="flex items-center gap-sm mb-md">
          <MaterialIcon name="person_search" className="text-secondary" />
          <h3 className="font-headline-md text-headline-md">Select Your Target Lead</h3>
        </div>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Choose the lead you will pursue. Your selection is checked against what your manager is
          prioritizing — pick carefully, then move on to your opening message.
        </p>
      </div>

      {isLoading ? (
        <p className="text-body-md text-on-surface-variant">Loading leads…</p>
      ) : leads.length === 0 ? (
        <div className="bg-surface-container-high rounded-xl border border-outline-variant p-lg space-y-4">
          <p className="text-body-md text-on-surface">
            You haven&apos;t added any leads yet — open your CRM and add at least one before
            continuing.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openCrmLeads()}
              className="inline-flex items-center gap-2 px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-label-md hover:bg-primary shadow-md"
            >
              <MaterialIcon name="hub" className="text-[18px]" />
              Open CRM — Leads
            </button>
            <button
              type="button"
              onClick={() => void loadLeads()}
              className="inline-flex items-center gap-2 px-lg py-sm rounded-lg border border-outline-variant text-on-surface font-bold text-label-md hover:bg-surface-container-low"
            >
              <MaterialIcon name="refresh" className="text-[18px]" />
              Refresh list
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <ul className="divide-y divide-outline-variant">
            {leads.map((lead) => {
              const isPicked = pickedId === lead.id;
              const company = lead.company_name.trim() || "Untitled lead";
              const contact = lead.contact_name.trim() || "No contact";
              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => setPickedId(lead.id)}
                    className={`w-full text-left px-lg py-md flex items-center justify-between gap-4 transition-colors ${
                      isPicked
                        ? "bg-secondary-fixed/40"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-label-md text-on-surface font-bold truncate">{company}</p>
                      <p className="text-label-sm text-on-surface-variant truncate">{contact}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isPicked
                          ? "border-primary-container bg-primary-container"
                          : "border-outline-variant"
                      }`}
                    >
                      {isPicked ? (
                        <MaterialIcon name="check" className="text-white text-[14px]" />
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="p-lg bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  openCrmLeads();
                }}
                className="text-label-md text-primary font-medium hover:underline"
              >
                Manage leads in CRM
              </button>
              <button
                type="button"
                onClick={() => void loadLeads()}
                disabled={isLoading || isSelecting}
                className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant font-medium hover:text-on-surface disabled:opacity-50"
              >
                <MaterialIcon name="refresh" className="text-[18px]" />
                Refresh list
              </button>
            </div>
            <button
              type="button"
              disabled={!pickedId || isSelecting}
              onClick={() => void handleSelectTarget()}
              className={`px-lg py-sm rounded-lg font-bold text-label-md flex items-center gap-xs transition-all ${
                pickedId && !isSelecting
                  ? "bg-primary-container text-white hover:bg-primary shadow-md"
                  : "bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed"
              }`}
            >
              {isSelecting ? "Selecting…" : "Select as Target"}
              <MaterialIcon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
