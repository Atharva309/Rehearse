/**
 * LeadDetailForm.tsx
 * Create/edit/convert a CRM Lead. Converted leads are read-only.
 * Failed convert opens ConvertFailureModal; success routes to Opportunity.
 */

"use client";

import { useMemo, useState } from "react";
import {
  ConvertFailureModal,
  type ConvertFailureReason,
} from "@/components/crm/ConvertFailureModal";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLead } from "@/types";

type LeadFormValues = {
  companyName: string;
  contactName: string;
  contactTitle: string;
  whyFit: string;
  trigger: string;
  nextStep: string;
};

type LeadDetailFormProps = {
  attemptId: string;
  /** Null = create a new Lead. */
  lead: CrmLead | null;
  onBackToList: () => void;
  onSaved: (lead: CrmLead) => void;
  onConverted: (lead: CrmLead) => void;
};

const FIELD_DEFS: {
  key: keyof LeadFormValues;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  {
    key: "companyName",
    label: "Company Name",
    placeholder: "Company name",
  },
  {
    key: "contactName",
    label: "Contact Name",
    placeholder: "Primary contact name",
  },
  {
    key: "contactTitle",
    label: "Contact Title",
    placeholder: "e.g. Practice Manager",
  },
  {
    key: "whyFit",
    label: "Why This Account Is a Fit",
    placeholder: "Why does this account match your ICP?",
    multiline: true,
  },
  {
    key: "trigger",
    label: "Trigger Event",
    placeholder: "What timing signal makes this worth pursuing now?",
  },
  {
    key: "nextStep",
    label: "Next Step",
    placeholder: "What will you do next with this lead?",
  },
];

/**
 * Builds editable form values from an existing Lead or blanks.
 */
function valuesFromLead(lead: CrmLead | null): LeadFormValues {
  if (!lead) {
    return {
      companyName: "",
      contactName: "",
      contactTitle: "",
      whyFit: "",
      trigger: "",
      nextStep: "",
    };
  }
  return {
    companyName: lead.company_name,
    contactName: lead.contact_name,
    contactTitle: lead.contact_title,
    whyFit: lead.why_fit,
    trigger: lead.trigger_event,
    nextStep: lead.next_step,
  };
}

/**
 * Narrows convert API reason to a known failure modal reason.
 */
function asConvertFailureReason(reason: string | undefined): ConvertFailureReason | null {
  if (reason === "wrong_company" || reason === "wrong_contact") {
    return reason;
  }
  return null;
}

/**
 * Lead create/edit/convert form.
 */
export function LeadDetailForm({
  attemptId,
  lead,
  onBackToList,
  onSaved,
  onConverted,
}: LeadDetailFormProps): React.ReactElement {
  const isConverted = lead?.status === "converted";
  const [values, setValues] = useState<LeadFormValues>(() => valuesFromLead(lead));
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<ConvertFailureReason | null>(null);
  const [convertSuccess, setConvertSuccess] = useState(false);

  const title = values.companyName.trim() || (lead ? "Lead" : "New lead");
  const canSave = useMemo(
    () => !isConverted && !isSaving && !isConverting,
    [isConverted, isSaving, isConverting]
  );

  /**
   * Creates or patches the Lead via the CRM Leads API.
   * @param notifyParent - when false, skip onSaved (used mid-convert before remount).
   */
  const persistLead = async (notifyParent: boolean): Promise<CrmLead | null> => {
    setError(null);
    try {
      if (!lead) {
        const res = await fetch("/api/student/crm-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, ...values }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Could not save lead.");
          return null;
        }
        const body = (await res.json()) as { lead: CrmLead };
        if (notifyParent) {
          onSaved(body.lead);
        }
        return body.lead;
      }

      const res = await fetch(`/api/student/crm-leads/${encodeURIComponent(lead.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Could not save lead.");
        return null;
      }
      const body = (await res.json()) as { lead: CrmLead };
      if (notifyParent) {
        onSaved(body.lead);
      }
      return body.lead;
    } catch {
      setError("Could not save lead.");
      return null;
    }
  };

  /**
   * Creates or patches the Lead via the CRM Leads API.
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await persistLead(true);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Saves latest field values then attempts Convert.
   */
  const handleConvert = async (): Promise<void> => {
    if (isConverted || isConverting) {
      return;
    }
    setIsConverting(true);
    setError(null);
    setFailureReason(null);
    try {
      // Avoid onSaved mid-convert — parent remounts on new lead id and would abort Convert.
      const saved = await persistLead(false);
      if (!saved) {
        return;
      }

      const res = await fetch(
        `/api/student/crm-leads/${encodeURIComponent(saved.id)}/convert`,
        { method: "POST" }
      );
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        reason?: string;
        managerNote?: string;
        error?: string;
      } | null;

      if (!res.ok || !body?.success) {
        onSaved(saved);
        const reason = asConvertFailureReason(body?.reason);
        if (reason) {
          setFailureReason(reason);
          return;
        }
        setError(body?.error ?? "Could not convert lead.");
        return;
      }

      const converted: CrmLead = { ...saved, status: "converted" };
      setConvertSuccess(true);
      onConverted(converted);
    } catch {
      setError("Could not convert lead.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="p-6 flex-grow overflow-auto">
      {failureReason ? (
        <ConvertFailureModal
          reason={failureReason}
          onDismiss={() => setFailureReason(null)}
        />
      ) : null}

      <div className="max-w-[1200px] mx-auto w-full space-y-6">
        <nav className="flex items-center gap-2 text-[#404848] text-[12px] font-medium tracking-wide">
          <button
            type="button"
            onClick={onBackToList}
            className="hover:text-[#0f4c4c] transition-colors"
          >
            Leads
          </button>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <span className="text-[#161d1b]">{title}</span>
          {isConverted ? (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#0f4c4c] text-white text-[10px] font-bold uppercase tracking-widest">
              Converted
            </span>
          ) : null}
        </nav>

        {convertSuccess ? (
          <div className="bg-[#eef5f2] border border-[#0f4c4c]/30 rounded-lg px-4 py-3 text-sm text-[#003434]">
            Lead converted — Account, Contact, and Opportunity are ready.
          </div>
        ) : null}

        <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#bfc8c8] bg-[#eef5f2]/20">
            <h3 className="text-lg font-semibold text-[#003434]">Lead Details</h3>
            <p className="text-sm text-[#404848] mt-1">
              {isConverted
                ? "This lead has been converted and is read-only."
                : "Fill in the company and contact you are researching, then convert when ready."}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FIELD_DEFS.map((field) => {
                const value = values[field.key];
                return (
                  <div
                    key={field.key}
                    className={`space-y-2 ${field.multiline ? "md:col-span-2" : ""}`}
                  >
                    <label className="text-[12px] font-medium tracking-wide text-[#404848]">
                      {field.label}
                    </label>
                    {isConverted ? (
                      <div className="w-full rounded-md px-4 py-2 text-sm text-[#161d1b] bg-[#eef5f2] border border-[#bfc8c8] whitespace-pre-wrap">
                        {value.trim() || "—"}
                      </div>
                    ) : field.multiline ? (
                      <textarea
                        className="w-full bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all placeholder:text-[#bfc8c8] resize-none"
                        placeholder={field.placeholder}
                        rows={3}
                        value={value}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    ) : (
                      <input
                        className="w-full bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all placeholder:text-[#bfc8c8]"
                        placeholder={field.placeholder}
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {error ? <p className="text-sm text-[#ba1a1a] mt-4">{error}</p> : null}
          </div>

          {!isConverted ? (
            <div className="p-6 bg-[#eef5f2] border-t border-[#bfc8c8] flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={!canSave}
                onClick={() => void handleSave()}
                className="px-6 py-2 border border-[#0f4c4c] text-[#0f4c4c] text-[12px] font-medium tracking-wide rounded-lg hover:bg-[#e3eae6] transition-all active:scale-95 disabled:opacity-40"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => void handleConvert()}
                className="px-6 py-2 bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide rounded-lg hover:bg-[#0f4c4c]/90 shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              >
                <MaterialIcon name="sync_alt" className="text-[18px]" />
                {isConverting ? "Converting…" : "Convert"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
