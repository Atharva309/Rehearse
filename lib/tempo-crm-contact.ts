/**
 * tempo-crm-contact.ts
 * Contact profile field schema + helpers for CRM Contacts.
 */

export type CrmContactKey = "contact_1" | "contact_2";

/** Fixed contact slots per attempt (student fills each via Add contact). */
export const CRM_CONTACT_SLOTS: CrmContactKey[] = ["contact_1", "contact_2"];

export type CrmContactFieldDef = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
};

export const CRM_CONTACT_FIELD_SCHEMA: CrmContactFieldDef[] = [
  {
    key: "name",
    label: "Full Name",
    placeholder: "e.g. Dana Reyes",
    required: true,
  },
  {
    key: "position",
    label: "Position / Title",
    placeholder: "e.g. Director of Operations",
  },
];

export const CRM_CONTACT_BUYING_ROLES = [
  "",
  "Economic Buyer",
  "Champion",
  "Influencer",
  "Technical Evaluator",
] as const;

export type CrmContactRecord = {
  contactKey: CrmContactKey;
  fields: Record<string, string>;
  role: string;
  notes: string;
  updated_at: string | null;
};

/**
 * Empty contact profile fields.
 */
export function emptyContactFields(): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of CRM_CONTACT_FIELD_SCHEMA) {
    next[field.key] = "";
  }
  return next;
}

/**
 * True when required contact fields are filled.
 */
export function canSaveContactFields(fields: Record<string, string>): boolean {
  return CRM_CONTACT_FIELD_SCHEMA.filter((f) => f.required).every(
    (f) => (fields[f.key] ?? "").trim().length > 0
  );
}

/**
 * True when this contact slot has a saved profile (has a name).
 */
export function contactHasProfile(record: CrmContactRecord | null | undefined): boolean {
  if (!record) {
    return false;
  }
  return (record.fields.name ?? "").trim().length > 0;
}

/**
 * Display name for lists and lookups.
 */
export function contactDisplayName(fields: Record<string, string>): string {
  return (fields.name ?? "").trim();
}

/**
 * Contact slots not yet saved for this attempt.
 */
export function availableContactSlots(records: CrmContactRecord[]): CrmContactKey[] {
  const saved = new Set(
    records.filter(contactHasProfile).map((r) => r.contactKey)
  );
  return CRM_CONTACT_SLOTS.filter((key) => !saved.has(key));
}
