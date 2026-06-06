/**
 * api-auth.ts
 * Shared auth helpers for student and professor API routes.
 */

import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-session";
import { createClient } from "@/lib/supabase/server";
import type { StudentSession } from "@/types";

type ProfessorAuthResult =
  | { ok: true; professorId: string }
  | { ok: false; response: NextResponse };

type StudentAuthResult =
  | { ok: true; session: StudentSession }
  | { ok: false; response: NextResponse };

/**
 * Requires a logged-in professor (teacher role) for API routes.
 */
export async function requireProfessorApi(): Promise<ProfessorAuthResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, professorId: user.id };
}

/**
 * Requires a valid student JWT session for API routes.
 */
export async function requireStudentApi(): Promise<StudentAuthResult> {
  const session = await getStudentSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}
