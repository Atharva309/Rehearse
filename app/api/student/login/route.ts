/**
 * login/route.ts
 * POST /api/student/login — authenticate returning student by username + password.
 */

import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { createStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";

type LoginBody = {
  username?: string;
  password?: string;
};

/**
 * Validates credentials and sets the student session cookie.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as LoginBody;
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: student } = await supabase
      .from("students")
      .select("id, username, display_name, password_hash")
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
      username: student.username,
      displayName: student.display_name,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
