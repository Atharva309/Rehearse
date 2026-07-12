/**
 * crm-display.ts
 * Helpers to derive CRM list/home labels from student-filled log + notes data.
 * Nothing is pre-seeded — empty until the student saves CRM content.
 */

import type { CrmContactKey } from "@/components/crm/ContactRecordView";
import { CRM_CONTACTS } from "@/components/crm/ContactRecordView";
import type { CrmLogEntry } from "@/types";

/**
 * Account name from the prospecting CRM log, if the student filled it in.
 */
export function accountNameFromLogs(entries: CrmLogEntry[]): string {
  const prospecting = entries.find((e) => e.stage === "prospecting");
  return (prospecting?.fields?.accountName ?? "").trim();
}

/**
 * Primary contact label from the prospecting CRM log.
 */
export function primaryContactFromLogs(entries: CrmLogEntry[]): string {
  const prospecting = entries.find((e) => e.stage === "prospecting");
  return (prospecting?.fields?.primaryContact ?? "").trim();
}

/**
 * Opportunity title for lists/home — student account name, or untitled.
 */
export function opportunityTitleFromLogs(entries: CrmLogEntry[]): string {
  const name = accountNameFromLogs(entries);
  return name.length > 0 ? name : "Untitled opportunity";
}

/**
 * Short notes preview for home cards.
 */
export function previewText(text: string, max = 120): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max).trim()}…`;
}

export type ContactNotesSnapshot = {
  key: CrmContactKey;
  role: string;
  notes: string;
  updatedAt: string | null;
};

/**
 * True when the student has saved contact CRM data for this key.
 */
export function contactHasRecord(snap: ContactNotesSnapshot): boolean {
  return (
    Boolean(snap.updatedAt) ||
    snap.role.trim().length > 0 ||
    snap.notes.trim().length > 0
  );
}

/**
 * Contact keys that exist as templates but have not been saved yet.
 */
export function availableContactKeysToAdd(
  snapshots: ContactNotesSnapshot[]
): CrmContactKey[] {
  const saved = new Set(
    snapshots.filter(contactHasRecord).map((s) => s.key)
  );
  return (Object.keys(CRM_CONTACTS) as CrmContactKey[]).filter((k) => !saved.has(k));
}
