/**
 * tempo-lead-conversion.ts
 * Shared Lead identity validation + Account/Contact conversion for Tempo CRM.
 * Used by select (Prospecting) and auto-convert on Prospecting stage completion.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const CORRECT_COMPANY = "Summit Dental Group";
const CORRECT_CONTACT = "Dana Reyes";

export const WRONG_COMPANY_NOTE =
  "This doesn't look like the account we're prioritizing — Summit Dental Group is showing stronger signals right now (recent 8th-location expansion, visible no-show pain, a confirmed contact who took your call). Revisit your Lead list and reconsider.";

export const WRONG_CONTACT_NOTE =
  "Dana Reyes is our confirmed point of contact at Summit Dental — she's the one who responded and has visibility into daily operations. The contact you selected doesn't have that same access. Update your Lead's contact and try again.";

export type LeadValidationFailure = {
  success: false;
  reason: "wrong_company" | "wrong_contact";
  managerNote: string;
};

export type LeadValidationResult = { success: true } | LeadValidationFailure;

export type ConvertLeadResult = { success: true } | LeadValidationFailure;

/**
 * Case-insensitive trimmed compare for Lead correctness checks.
 */
export function namesMatch(actual: string, expected: string): boolean {
  return (
    actual.trim().toLowerCase().replace(/\s+/g, " ") ===
    expected.trim().toLowerCase().replace(/\s+/g, " ")
  );
}

/**
 * Validates company + contact against the known correct Tempo path.
 */
export function validateLeadIdentity(
  companyName: string,
  contactName: string
): LeadValidationResult {
  if (!namesMatch(companyName, CORRECT_COMPANY)) {
    return {
      success: false,
      reason: "wrong_company",
      managerNote: WRONG_COMPANY_NOTE,
    };
  }
  if (!namesMatch(contactName, CORRECT_CONTACT)) {
    return {
      success: false,
      reason: "wrong_contact",
      managerNote: WRONG_CONTACT_NOTE,
    };
  }
  return { success: true };
}

/**
 * Converts a Lead into Account + Dana Contact and marks the Lead converted.
 * Validates identity first; idempotent if this lead is already converted.
 */
export async function convertLead(
  supabase: SupabaseClient,
  attemptId: string,
  leadId: string
): Promise<ConvertLeadResult> {
  const { data: lead, error: loadError } = await supabase
    .from("crm_leads")
    .select(
      "id, attempt_id, status, company_name, contact_name, contact_title, why_fit, trigger_event"
    )
    .eq("id", leadId)
    .eq("attempt_id", attemptId)
    .maybeSingle();

  if (loadError || !lead) {
    console.error("[convertLead] load failed:", loadError);
    throw new Error("Could not load lead for conversion.");
  }

  if (lead.status === "converted") {
    return { success: true };
  }

  const companyName = String(lead.company_name ?? "");
  const contactName = String(lead.contact_name ?? "");
  const validation = validateLeadIdentity(companyName, contactName);
  if (!validation.success) {
    return validation;
  }

  const { data: alreadyConverted } = await supabase
    .from("crm_leads")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("status", "converted")
    .maybeSingle();

  if (alreadyConverted && alreadyConverted.id !== leadId) {
    console.error(
      "[convertLead] another lead already converted for attempt",
      attemptId,
      alreadyConverted.id
    );
    throw new Error("A lead has already been converted for this deal.");
  }

  const contactTitle = String(lead.contact_title ?? "").trim();
  const whyFit = String(lead.why_fit ?? "").trim();
  const triggerEvent = String(lead.trigger_event ?? "").trim();
  const primaryContact = contactTitle
    ? `${contactName.trim()}, ${contactTitle}`
    : contactName.trim();
  const updatedAt = new Date().toISOString();

  const accountFields: Record<string, string> = {
    accountName: companyName.trim(),
    industry: "",
    locations: "",
    region: "",
    primaryContact,
    whyFit,
    trigger: triggerEvent,
  };

  const { error: accountError } = await supabase.from("crm_account_notes").upsert(
    {
      attempt_id: attemptId,
      notes: "",
      fields: accountFields,
      updated_at: updatedAt,
    },
    { onConflict: "attempt_id" }
  );

  if (accountError) {
    console.error("[convertLead] account upsert failed:", accountError);
    throw new Error("Could not create account from lead.");
  }

  const contactFields: Record<string, string> = {
    name: contactName.trim(),
    position: contactTitle,
  };

  const { error: contactError } = await supabase.from("crm_contact_notes").upsert(
    {
      attempt_id: attemptId,
      contact_key: "dana_reyes",
      role: "",
      notes: "",
      fields: contactFields,
      updated_at: updatedAt,
    },
    { onConflict: "attempt_id,contact_key" }
  );

  if (contactError) {
    console.error("[convertLead] contact upsert failed:", contactError);
    throw new Error("Could not create contact from lead.");
  }

  const { error: leadError } = await supabase
    .from("crm_leads")
    .update({ status: "converted", updated_at: updatedAt })
    .eq("id", leadId);

  if (leadError) {
    console.error("[convertLead] lead status update failed:", leadError);
    throw new Error("Could not mark lead converted.");
  }

  return { success: true };
}
