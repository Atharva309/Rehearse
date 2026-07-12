/**
 * crm-contact/route.ts
 * GET/POST /api/student/crm-contact — load and upsert contact profile + notes.
 */

import { NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/api-auth";
import { CRM_CONTACT_SLOTS, type CrmContactKey } from "@/lib/tempo-crm-contact";
import { createServiceClient } from "@/lib/supabase/server";

const CONTACT_KEYS = new Set<CrmContactKey>(CRM_CONTACT_SLOTS);

type ContactBody = {
  attemptId?: string;
  contactKey?: string;
  role?: string;
  notes?: string;
  fields?: Record<string, unknown>;
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
 * Normalizes jsonb fields into a string map.
 */
function normalizeFields(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {
      next[key] = value;
    } else if (value != null) {
      next[key] = String(value);
    }
  }
  return next;
}

/**
 * GET /api/student/crm-contact?attemptId=…&contactKey=…
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const attemptId = url.searchParams.get("attemptId")?.trim();
    const contactKey = url.searchParams.get("contactKey")?.trim() as CrmContactKey | undefined;

    if (!attemptId || !contactKey) {
      return NextResponse.json({ error: "Missing attemptId or contactKey." }, { status: 400 });
    }
    if (!CONTACT_KEYS.has(contactKey)) {
      return NextResponse.json({ error: "Invalid contactKey." }, { status: 400 });
    }

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_contact_notes")
      .select("role, notes, fields, updated_at")
      .eq("attempt_id", attemptId)
      .eq("contact_key", contactKey)
      .maybeSingle();

    if (error) {
      console.error("[crm-contact] GET failed:", error);
      return NextResponse.json({ error: "Could not load contact." }, { status: 500 });
    }

    return NextResponse.json({
      role: (data?.role as string | undefined) ?? "",
      notes: (data?.notes as string | undefined) ?? "",
      fields: normalizeFields(data?.fields),
      updated_at: (data?.updated_at as string | null | undefined) ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Could not load contact." }, { status: 500 });
  }
}

/**
 * POST /api/student/crm-contact — upsert contact profile + notes for the owned attempt.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as ContactBody;
    const attemptId = body.attemptId?.trim();
    const contactKey = body.contactKey?.trim() as CrmContactKey | undefined;

    if (
      !attemptId ||
      !contactKey ||
      typeof body.notes !== "string" ||
      typeof body.role !== "string" ||
      body.fields === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!CONTACT_KEYS.has(contactKey)) {
      return NextResponse.json({ error: "Invalid contactKey." }, { status: 400 });
    }

    const fields = normalizeFields(body.fields);
    if (!(fields.name ?? "").trim()) {
      return NextResponse.json({ error: "Contact name is required." }, { status: 400 });
    }

    const attempt = await loadOwnedAttempt(attemptId, auth.session.studentId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("crm_contact_notes")
      .upsert(
        {
          attempt_id: attemptId,
          contact_key: contactKey,
          role: body.role,
          notes: body.notes,
          fields,
          updated_at: updatedAt,
        },
        { onConflict: "attempt_id,contact_key" }
      )
      .select("role, notes, fields, updated_at")
      .single();

    if (error || !data) {
      console.error("[crm-contact] POST failed:", error);
      return NextResponse.json({ error: "Could not save contact." }, { status: 500 });
    }

    return NextResponse.json({
      role: data.role as string,
      notes: data.notes as string,
      fields: normalizeFields(data.fields),
      updated_at: data.updated_at as string,
    });
  } catch {
    return NextResponse.json({ error: "Could not save contact." }, { status: 500 });
  }
}
