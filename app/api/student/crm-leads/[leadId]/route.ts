/**
 * crm-leads/[leadId]/route.ts
 * PATCH /api/student/crm-leads/:leadId — update a Lead still in status "new".
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { CrmLead } from "@/types";

type PatchLeadBody = {
  companyName?: string;
  contactName?: string;
  contactTitle?: string;
  whyFit?: string;
  trigger?: string;
  nextStep?: string;
};

type RouteContext = {
  params: { leadId: string };
};

/**
 * Maps a crm_leads row to the API CrmLead shape.
 */
function mapLeadRow(row: Record<string, unknown>): CrmLead {
  return {
    id: String(row.id),
    attempt_id: String(row.attempt_id),
    company_name: String(row.company_name ?? ""),
    contact_name: String(row.contact_name ?? ""),
    contact_title: String(row.contact_title ?? ""),
    why_fit: String(row.why_fit ?? ""),
    trigger_event: String(row.trigger_event ?? ""),
    next_step: String(row.next_step ?? ""),
    status:
      row.status === "converted"
        ? "converted"
        : row.status === "selected"
          ? "selected"
          : "new",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/**
 * PATCH — update editable fields on a non-converted Lead owned by the student.
 */
export async function PATCH(
  request: Request,
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

    const body = (await request.json()) as PatchLeadBody;
    const supabase = createServiceClient();

    const { data: existing, error: loadError } = await supabase
      .from("crm_leads")
      .select(
        "id, attempt_id, status, company_name, contact_name, contact_title, why_fit, trigger_event, next_step, created_at, updated_at"
      )
      .eq("id", leadId)
      .maybeSingle();

    if (loadError) {
      console.error("[crm-leads] PATCH load failed:", loadError);
      return NextResponse.json({ error: "Could not update CRM lead." }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const { data: attempt } = await supabase
      .from("attempts")
      .select("id")
      .eq("id", existing.attempt_id as string)
      .eq("student_id", auth.session.studentId)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (existing.status === "converted" || existing.status === "selected") {
      return NextResponse.json(
        { error: "Selected or converted leads cannot be edited." },
        { status: 400 }
      );
    }

    const patch: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.companyName === "string") {
      patch.company_name = body.companyName.trim();
    }
    if (typeof body.contactName === "string") {
      patch.contact_name = body.contactName.trim();
    }
    if (typeof body.contactTitle === "string") {
      patch.contact_title = body.contactTitle.trim();
    }
    if (typeof body.whyFit === "string") {
      patch.why_fit = body.whyFit.trim();
    }
    if (typeof body.trigger === "string") {
      patch.trigger_event = body.trigger.trim();
    }
    if (typeof body.nextStep === "string") {
      patch.next_step = body.nextStep.trim();
    }

    const { data, error } = await supabase
      .from("crm_leads")
      .update(patch)
      .eq("id", leadId)
      .select(
        "id, attempt_id, company_name, contact_name, contact_title, why_fit, trigger_event, next_step, status, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      console.error("[crm-leads] PATCH failed:", error);
      return NextResponse.json({ error: "Could not update CRM lead." }, { status: 500 });
    }

    return NextResponse.json({ lead: mapLeadRow(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Could not update CRM lead." }, { status: 500 });
  }
}
