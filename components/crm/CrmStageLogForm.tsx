/**
 * CrmStageLogForm.tsx
 * Per-stage CRM opportunity logging form — create, edit, and read-only views.
 * Prospecting Account Name is a dropdown of saved CRM accounts; selecting one
 * autofills overlapping fields the account has values for.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  CRM_STAGE_FIELD_SCHEMA,
  type CrmStageFieldDef,
} from "@/lib/tempo-crm-fields";
import {
  accountHasProfile,
  prospectingAutofillFromAccount,
  type CrmAccountRecord,
} from "@/lib/tempo-crm-account";
import type { CrmLogEntry, SimulationStage } from "@/types";

export type { CrmStageFieldDef };
/** Re-export schema so existing imports keep working; source of truth is lib/tempo-crm-fields. */
export { CRM_STAGE_FIELD_SCHEMA };

type CrmLoggableStage = keyof typeof CRM_STAGE_FIELD_SCHEMA;

type CrmStageLogFormProps = {
  stage: SimulationStage;
  attemptId: string;
  existingEntry: CrmLogEntry | null;
  onSaved: (entry: CrmLogEntry) => void;
  /** Optional preloaded account (Prospecting dropdown). Fetched if omitted. */
  accountRecord?: CrmAccountRecord | null;
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
  accountRecord: accountRecordProp,
}: CrmStageLogFormProps): React.ReactElement {
  const loggableStage = stage as CrmLoggableStage;
  const schema = CRM_STAGE_FIELD_SCHEMA[loggableStage];
  const isProspecting = loggableStage === "prospecting";

  const [isEditing, setIsEditing] = useState(existingEntry === null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    existingEntry ? { ...emptyFields(loggableStage), ...existingEntry.fields } : emptyFields(loggableStage)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountRecord, setAccountRecord] = useState<CrmAccountRecord | null>(
    accountRecordProp ?? null
  );

  useEffect(() => {
    if (accountRecordProp !== undefined) {
      setAccountRecord(accountRecordProp);
    }
  }, [accountRecordProp]);

  useEffect(() => {
    if (!isProspecting || accountRecordProp !== undefined) {
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(
          `/api/student/crm-account?attemptId=${encodeURIComponent(attemptId)}`
        );
        if (!res.ok || cancelled) {
          return;
        }
        const body = (await res.json()) as {
          notes?: string;
          fields?: Record<string, string>;
          updated_at?: string | null;
        };
        if (!cancelled) {
          setAccountRecord({
            fields: body.fields ?? {},
            notes: body.notes ?? "",
            updated_at: body.updated_at ?? null,
          });
        }
      } catch {
        /* leave null */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [attemptId, isProspecting, accountRecordProp]);

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

  const savedAccountName = (accountRecord?.fields.accountName ?? "").trim();
  const hasAccount = accountHasProfile(accountRecord) && savedAccountName.length > 0;

  /**
   * Selecting an account fills overlapping prospecting fields the account has.
   */
  const handleAccountSelect = (accountName: string): void => {
    if (!accountRecord || !accountName) {
      setValues((prev) => ({ ...prev, accountName: "" }));
      return;
    }
    const patch = prospectingAutofillFromAccount(accountRecord.fields);
    setValues((prev) => ({
      ...prev,
      ...patch,
      accountName,
    }));
  };

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

  /**
   * Renders one schema field — Account Name becomes a dropdown on Prospecting.
   */
  const renderField = (field: CrmStageFieldDef): React.ReactElement => {
    const value = values[field.key] ?? "";
    const spanFull = Boolean(field.multiline);
    const useAccountDropdown =
      isProspecting && field.key === "accountName" && !readOnly;

    return (
      <div key={field.key} className={`space-y-2 ${spanFull ? "md:col-span-2" : ""}`}>
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
        ) : useAccountDropdown ? (
          <div className="space-y-1.5">
            <select
              className="w-full bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all"
              value={hasAccount && value === savedAccountName ? savedAccountName : ""}
              onChange={(e) => handleAccountSelect(e.target.value)}
            >
              <option value="">
                {hasAccount ? "Select an account…" : "No accounts yet — add one first"}
              </option>
              {hasAccount ? (
                <option value={savedAccountName}>{savedAccountName}</option>
              ) : null}
            </select>
            {!hasAccount ? (
              <p className="text-[11px] text-[#707978]">
                Use Add account on the Accounts page, then return here to select it.
              </p>
            ) : (
              <p className="text-[11px] text-[#707978]">
                Selecting an account fills fields it already has; leave the rest blank to fill
                yourself.
              </p>
            )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{schema.map(renderField)}</div>
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
