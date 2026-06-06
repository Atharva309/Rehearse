/**
 * login/route.ts
 * POST /api/student/login — authenticate returning student.
 */

import { NextResponse } from "next/server";
import { JOIN_CODE_LENGTH } from "@/lib/constants";
import { verifyPassword } from "@/lib/password";
import { createStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";

type LoginBody = {
  username?: string;
  password?: string;
  joinCode?: string;
};

/**
 * Validates credentials and sets the student session cookie.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as LoginBody;
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const joinCode = body.joinCode?.trim().toUpperCase() ?? "";

    if (!username || !password || joinCode.length !== JOIN_CODE_LENGTH) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: classRow } = await supabase
      .from("classes")
      .select("id, professor_id, is_active")
      .eq("join_code", joinCode)
      .single();

    if (!classRow) {
      return NextResponse.json({ error: "Class not found. Check your class code." }, { status: 404 });
    }

    const { data: student } = await supabase
      .from("students")
      .select("id, username, display_name, password_hash")
      .eq("class_id", classRow.id)
      .eq("username", username)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 404 });
    }

    const valid = await verifyPassword(password, student.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    await createStudentSession({
      studentId: student.id,
      classId: classRow.id,
      professorId: classRow.professor_id,
      username: student.username,
      displayName: student.display_name,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
