/**
 * crm-leads/[leadId]/select/route.ts
 * POST — fuzzy-validate Lead identity and mark it as the selected target.
 * Returns a manager note tailored to a wrong company or wrong contact.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { validateLeadIdentity } from "@/lib/tempo-lead-conversion";

type RouteContext = {
  params: { leadId: string };
};

const WRONG_COMPANY_NOTE =
  "Let’s focus this opportunity on Summit Dental Group — that’s the account I want us to pursue. Update the company on your lead and try again.";

const WRONG_CONTACT_NOTE =
  "I have a strong contact for us at Summit Dental Group: Dana Reyes. Update the lead with Dana as the contact and try again.";

/**
 * POST /api/student/crm-leads/:leadId/select
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
      .select("id, attempt_id, status, company_name, contact_name")
      .eq("id", leadId)
      .maybeSingle();

    if (loadError) {
      console.error("[crm-leads/select] load failed:", loadError);
      return NextResponse.json({ error: "Could not select lead." }, { status: 500 });
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
        { error: "Converted leads cannot be selected again." },
        { status: 400 }
      );
    }

    const validation = validateLeadIdentity(
      String(lead.company_name ?? ""),
      String(lead.contact_name ?? "")
    );

    if (!validation.success) {
      const managerNote =
        validation.reason === "company" ? WRONG_COMPANY_NOTE : WRONG_CONTACT_NOTE;
      return NextResponse.json({ success: false, managerNote });
    }

    const updatedAt = new Date().toISOString();

    const { error: clearError } = await supabase
      .from("crm_leads")
      .update({ status: "new", updated_at: updatedAt })
      .eq("attempt_id", attemptId)
      .eq("status", "selected");

    if (clearError) {
      console.error("[crm-leads/select] clear previous selected failed:", clearError);
      return NextResponse.json({ error: "Could not select lead." }, { status: 500 });
    }

    const { error: selectError } = await supabase
      .from("crm_leads")
      .update({ status: "selected", updated_at: updatedAt })
      .eq("id", leadId);

    if (selectError) {
      console.error("[crm-leads/select] update failed:", selectError);
      return NextResponse.json(
        {
          error:
            selectError.message?.includes("check") || selectError.code === "23514"
              ? "Could not select lead. Run supabase/crm-leads-selected-status-migration.sql if status 'selected' is not allowed yet."
              : "Could not select lead.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not select lead." }, { status: 500 });
  }
}
