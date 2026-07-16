/**
 * crm-leads/route.ts
 * GET/POST /api/student/crm-leads — list and create multi-entry CRM Leads.
 * Uses service role because students do not have Supabase auth sessions.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { CrmLead } from "@/types";

type CreateLeadBody = {
  attemptId?: string;
  companyName?: string;
  contactName?: string;
  contactTitle?: string;
  whyFit?: string;
  trigger?: string;
  nextStep?: string;
};

/**
 * Ensures the attempt exists and belongs to the authenticated student.
 */
async function loadOwnedAttempt(
  attemptId: string,
  studentId: string
): Promise<{ id: string } | null> {
  const supabase = createServiceClient();
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .single();
  return attempt;
}

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
 * GET /api/student/crm-leads?attemptId=… — all leads for the attempt.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const attemptId = new URL(request.url).searchParams.get("attemptId")?.trim();
    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId." }, { status: 400 });
    }

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_leads")
      .select(
        "id, attempt_id, company_name, contact_name, contact_title, why_fit, trigger_event, next_step, status, created_at, updated_at"
      )
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[crm-leads] GET failed:", error);
      return NextResponse.json({ error: "Could not load CRM leads." }, { status: 500 });
    }

    const leads = (data ?? []).map((row) => mapLeadRow(row as Record<string, unknown>));
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ error: "Could not load CRM leads." }, { status: 500 });
  }
}

/**
 * POST /api/student/crm-leads — always creates a new Lead (multi-entry).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as CreateLeadBody;
    const attemptId = body.attemptId?.trim();
    if (!attemptId) {
      return NextResponse.json({ error: "Missing attemptId." }, { status: 400 });
    }

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_leads")
      .insert({
        attempt_id: attemptId,
        company_name: (body.companyName ?? "").trim(),
        contact_name: (body.contactName ?? "").trim(),
        contact_title: (body.contactTitle ?? "").trim(),
        why_fit: (body.whyFit ?? "").trim(),
        trigger_event: (body.trigger ?? "").trim(),
        next_step: (body.nextStep ?? "").trim(),
        status: "new",
        created_at: now,
        updated_at: now,
      })
      .select(
        "id, attempt_id, company_name, contact_name, contact_title, why_fit, trigger_event, next_step, status, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      console.error("[crm-leads] POST failed:", error);
      return NextResponse.json({ error: "Could not create CRM lead." }, { status: 500 });
    }

    return NextResponse.json({ lead: mapLeadRow(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Could not create CRM lead." }, { status: 500 });
  }
}
