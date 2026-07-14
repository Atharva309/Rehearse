/**
 * crm-display.ts
 * Helpers to derive CRM list/home labels from student-filled log + notes data.
 * Nothing is pre-seeded — empty until the student saves CRM content.
 */

import {
  contactDisplayName,
  contactHasProfile,
  availableContactSlots,
  type CrmContactKey,
  type CrmContactRecord,
} from "@/lib/tempo-crm-contact";
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

const OPPORTUNITY_COMPLETION_STAGES = [
  "prospecting",
  "discovery",
  "presentation",
  "objections",
  "close",
] as const;

/**
 * CRM opportunity completion percent from logged stage rows (0–100, steps of 20).
 */
export function opportunityCompletionPercent(entries: CrmLogEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }
  const logged = new Set(entries.map((e) => e.stage));
  const count = OPPORTUNITY_COMPLETION_STAGES.filter((stage) => logged.has(stage)).length;
  return Math.round((count / OPPORTUNITY_COMPLETION_STAGES.length) * 100);
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

export type ContactNotesSnapshot = CrmContactRecord;

/**
 * True when the student has saved a contact profile for this slot.
 */
export function contactHasRecord(snap: ContactNotesSnapshot): boolean {
  return contactHasProfile(snap);
}

/**
 * Contact slots not yet filled for this attempt.
 */
export function availableContactKeysToAdd(records: ContactNotesSnapshot[]): CrmContactKey[] {
  return availableContactSlots(records);
}

export { contactDisplayName };
