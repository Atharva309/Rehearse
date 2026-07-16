/**
 * crm-leads/[leadId]/convert/route.ts
 * POST — convert a Lead into Account + Dana Contact + unlock Opportunity.
 * Validates Summit Dental Group / Dana Reyes; only one successful convert per attempt.
 * Writes into existing crm_account_notes.fields / crm_contact_notes.fields jsonb.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";

const CORRECT_COMPANY = "Summit Dental Group";
const CORRECT_CONTACT = "Dana Reyes";

const WRONG_COMPANY_NOTE =
  "This doesn't look like the account we're prioritizing — Summit Dental Group is showing stronger signals right now (recent 8th-location expansion, visible no-show pain, a confirmed contact who took your call). Revisit your Lead list and reconsider.";

const WRONG_CONTACT_NOTE =
  "Dana Reyes is our confirmed point of contact at Summit Dental — she's the one who responded and has visibility into daily operations. The contact you selected doesn't have that same access. Update your Lead's contact and try again.";

type RouteContext = {
  params: { leadId: string };
};

/**
 * Case-insensitive trimmed compare for convert correctness checks.
 */
function namesMatch(actual: string, expected: string): boolean {
  return actual.trim().toLowerCase().replace(/\s+/g, " ") ===
    expected.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * POST /api/student/crm-leads/:leadId/convert
 */
export async function POST(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const leadId = context.params.leadId?.trim();
    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: lead, error: loadError } = await supabase
      .from("crm_leads")
      .select(
        "id, attempt_id, status, company_name, contact_name, contact_title, why_fit, trigger_event, next_step"
      )
      .eq("id", leadId)
      .maybeSingle();

    if (loadError) {
      console.error("[crm-leads/convert] load failed:", loadError);
      return NextResponse.json({ error: "Could not convert lead." }, { status: 500 });
    }
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const attemptId = lead.attempt_id as string;
    const { data: attempt } = await supabase
      .from("attempts")
      .select("id")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (lead.status === "converted") {
      return NextResponse.json(
        { error: "This lead has already been converted." },
        { status: 400 }
      );
    }

    const { data: alreadyConverted } = await supabase
      .from("crm_leads")
      .select("id")
      .eq("attempt_id", attemptId)
      .eq("status", "converted")
      .maybeSingle();

    if (alreadyConverted) {
      return NextResponse.json(
        {
          success: false,
          reason: "already_converted",
          error: "A lead has already been converted for this deal.",
        },
        { status: 400 }
      );
    }

    const { data: existingAccount } = await supabase
      .from("crm_account_notes")
      .select("attempt_id")
      .eq("attempt_id", attemptId)
      .maybeSingle();

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          reason: "already_converted",
          error: "A lead has already been converted for this deal.",
        },
        { status: 400 }
      );
    }

    const companyName = String(lead.company_name ?? "");
    const contactName = String(lead.contact_name ?? "");

    if (!namesMatch(companyName, CORRECT_COMPANY)) {
      return NextResponse.json({
        success: false,
        reason: "wrong_company",
        managerNote: WRONG_COMPANY_NOTE,
      });
    }

    if (!namesMatch(contactName, CORRECT_CONTACT)) {
      return NextResponse.json({
        success: false,
        reason: "wrong_contact",
        managerNote: WRONG_CONTACT_NOTE,
      });
    }

    const contactTitle = String(lead.contact_title ?? "").trim();
    const whyFit = String(lead.why_fit ?? "").trim();
    const triggerEvent = String(lead.trigger_event ?? "").trim();
    const primaryContact = contactTitle
      ? `${contactName.trim()}, ${contactTitle}`
      : contactName.trim();
    const updatedAt = new Date().toISOString();

    // Existing schema stores profile data in jsonb `fields` (not top-level columns).
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
      console.error("[crm-leads/convert] account upsert failed:", accountError);
      return NextResponse.json(
        {
          error:
            "Could not create account from lead. Check that crm_account_notes.fields exists.",
        },
        { status: 500 }
      );
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
      console.error("[crm-leads/convert] contact upsert failed:", contactError);
      return NextResponse.json(
        {
          error:
            "Could not create contact from lead. Check that crm_contact_notes.fields exists.",
        },
        { status: 500 }
      );
    }

    const { error: leadError } = await supabase
      .from("crm_leads")
      .update({ status: "converted", updated_at: updatedAt })
      .eq("id", leadId);

    if (leadError) {
      console.error("[crm-leads/convert] lead status update failed:", leadError);
      return NextResponse.json({ error: "Could not convert lead." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not convert lead." }, { status: 500 });
  }
}
