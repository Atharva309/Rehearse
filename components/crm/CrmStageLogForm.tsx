/**
 * CrmStageLogForm.tsx
 * Per-stage CRM opportunity logging form — create, edit, and read-only views.
 */

"use client";

import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { CrmLogEntry, SimulationStage } from "@/types";

type FieldDef = {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  prefix?: string;
};

export const CRM_STAGE_FIELD_SCHEMA: Record<
  "prospecting" | "discovery" | "presentation" | "objections" | "close",
  FieldDef[]
> = {
  prospecting: [
    {
      key: "accountName",
      label: "Account Name",
      placeholder: "e.g. Summit Dental Group",
    },
    {
      key: "primaryContact",
      label: "Primary Contact",
      placeholder: "e.g. Dana Reyes, Practice Manager",
    },
    {
      key: "whyFit",
      label: "Why This Account Is a Fit",
      placeholder: "Why does Summit Dental match your ICP?",
      multiline: true,
    },
    {
      key: "trigger",
      label: "Trigger Event",
      placeholder: "e.g. Opening an 8th location next quarter",
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "e.g. Book discovery call with Dana",
    },
  ],
  discovery: [
    {
      key: "businessIssue",
      label: "Business Issue Identified",
      placeholder: "e.g. Inefficient scheduling workflow",
    },
    {
      key: "quantifiedValue",
      label: "Quantified Value, if known",
      placeholder: "0.00",
      prefix: "$",
    },
    {
      key: "painPoints",
      label: "Key Pain Points",
      placeholder:
        "Describe the specific technical or operational hurdles the client is facing...",
      multiline: true,
    },
    {
      key: "stakeholders",
      label: "Other Stakeholders Involved",
      placeholder: "Comma separated names...",
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "Schedule follow-up demo",
    },
  ],
  presentation: [
    {
      key: "whatProposed",
      label: "What You Proposed",
      placeholder: "Summarize the Tempo offer you presented...",
      multiline: true,
    },
    {
      key: "stakeholderReaction",
      label: "Stakeholder Reaction",
      placeholder: "How did Dana / the team respond?",
      multiline: true,
    },
    {
      key: "anticipatedObjections",
      label: "Anticipated Objections",
      placeholder: "What pushback do you expect next?",
      multiline: true,
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "e.g. Objection-handling call with Dr. Kim",
    },
  ],
  objections: [
    {
      key: "objectionsRaised",
      label: "Objections Raised",
      placeholder: "List the objections Dr. Kim raised...",
      multiline: true,
    },
    {
      key: "howResolved",
      label: "How You Resolved Them",
      placeholder: "Describe how you handled each concern...",
      multiline: true,
    },
    {
      key: "remainingConcerns",
      label: "Remaining Concerns",
      placeholder: "Anything still open?",
      multiline: true,
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "e.g. Move to commercial negotiation",
    },
  ],
  close: [
    {
      key: "termsDiscussed",
      label: "Terms Discussed",
      placeholder: "Pricing, seats, billing, onboarding...",
      multiline: true,
    },
    {
      key: "outcome",
      label: "Outcome",
      placeholder: "e.g. Deal agreed / Partial close / Walked",
    },
    {
      key: "closeNotes",
      label: "Close Notes",
      placeholder: "Final notes on the negotiation...",
      multiline: true,
    },
  ],
};

type CrmLoggableStage = keyof typeof CRM_STAGE_FIELD_SCHEMA;

type CrmStageLogFormProps = {
  stage: SimulationStage;
  attemptId: string;
  existingEntry: CrmLogEntry | null;
  onSaved: (entry: CrmLogEntry) => void;
};

/**
 * Empty field map for a CRM stage schema.
 */
function emptyFields(stage: CrmLoggableStage): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of CRM_STAGE_FIELD_SCHEMA[stage]) {
    next[field.key] = "";
  }
  return next;
}

/**
 * True when every schema field has a non-empty trimmed value.
 */
function allFieldsFilled(
  stage: CrmLoggableStage,
  values: Record<string, string>
): boolean {
  return CRM_STAGE_FIELD_SCHEMA[stage].every(
    (field) => (values[field.key] ?? "").trim().length > 0
  );
}

/**
 * Per-stage CRM log form with create / edit / read-only modes.
 */
export function CrmStageLogForm({
  stage,
  attemptId,
  existingEntry,
  onSaved,
}: CrmStageLogFormProps): React.ReactElement {
  const loggableStage = stage as CrmLoggableStage;
  const schema = CRM_STAGE_FIELD_SCHEMA[loggableStage];

  const [isEditing, setIsEditing] = useState(existingEntry === null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    existingEntry ? { ...emptyFields(loggableStage), ...existingEntry.fields } : emptyFields(loggableStage)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(
    () => allFieldsFilled(loggableStage, values) && !isSaving,
    [loggableStage, values, isSaving]
  );

  const readOnly = existingEntry !== null && !isEditing;
  const stageTitle =
    stage === "objections"
      ? "Objection Handling"
      : stage === "close"
        ? "Negotiation"
        : stage.charAt(0).toUpperCase() + stage.slice(1);

  /**
   * Clears draft values (or restores saved entry when discarding an edit).
   */
  const handleDiscard = (): void => {
    setError(null);
    if (existingEntry) {
      setValues({ ...emptyFields(loggableStage), ...existingEntry.fields });
      setIsEditing(false);
      return;
    }
    setValues(emptyFields(loggableStage));
  };

  /**
   * POSTs the form to /api/student/crm-log and notifies the parent.
   */
  const handleSave = async (): Promise<void> => {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/student/crm-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, stage: loggableStage, fields: values }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Could not save log entry.");
        return;
      }
      const body = (await res.json()) as { entry: CrmLogEntry };
      onSaved(body.entry);
      setIsEditing(false);
    } catch {
      setError("Could not save log entry.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#bfc8c8] bg-[#eef5f2]/20">
        <h3 className="text-lg font-semibold text-[#003434]">{stageTitle} Phase Log</h3>
        <p className="text-sm text-[#404848] mt-1">
          {readOnly
            ? "This stage is logged. Edit to update your CRM entry."
            : `Complete the ${stageTitle} criteria to keep this opportunity current.`}
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schema.map((field) => {
            const value = values[field.key] ?? "";
            const spanFull = Boolean(field.multiline);
            return (
              <div
                key={field.key}
                className={`space-y-2 ${spanFull ? "md:col-span-2" : ""}`}
              >
                <label className="text-[12px] font-medium tracking-wide text-[#404848] flex items-center gap-1">
                  {field.label}
                  <span className="text-[#ba1a1a]">*</span>
                </label>
                {readOnly ? (
                  <div
                    className={`w-full rounded-md px-4 py-2 text-sm text-[#161d1b] bg-[#eef5f2] border border-[#bfc8c8] whitespace-pre-wrap ${
                      field.prefix ? "font-code-md" : ""
                    }`}
                  >
                    {field.prefix ? `${field.prefix}${value}` : value || "—"}
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
                  <div className="relative">
                    {field.prefix ? (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#404848] font-code-md text-[13px]">
                        {field.prefix}
                      </span>
                    ) : field.key === "nextStep" ? (
                      <MaterialIcon
                        name="subdirectory_arrow_right"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0f4c4c] text-[18px]"
                      />
                    ) : null}
                    <input
                      className={`w-full bg-[#eef5f2] border border-[#bfc8c8] rounded-md py-2 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all placeholder:text-[#bfc8c8] ${
                        field.prefix || field.key === "nextStep" ? "pl-10 pr-4" : "px-4"
                      } ${field.prefix ? "font-code-md" : ""} ${
                        field.key === "nextStep"
                          ? "bg-[#b5edec]/20 border-[#0f4c4c]/30 text-[#003434] font-medium"
                          : ""
                      }`}
                      placeholder={field.placeholder}
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
      </div>

      <div className="p-6 bg-[#eef5f2] border-t border-[#bfc8c8] flex justify-end gap-3">
        {readOnly ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide rounded-lg hover:bg-[#0f4c4c]/90 shadow-md transition-all active:scale-95"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDiscard}
              className="px-6 py-2 border border-[#707978] text-[#404848] text-[12px] font-medium tracking-wide rounded-lg hover:bg-[#e3eae6] transition-all active:scale-95"
            >
              Discard Draft
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void handleSave()}
              className="px-6 py-2 bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide rounded-lg hover:bg-[#0f4c4c]/90 shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MaterialIcon name="save" className="text-[18px]" />
              {isSaving ? "Saving…" : "Save Log Entry"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
