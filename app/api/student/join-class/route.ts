/**
 * join-class/route.ts
 * POST /api/student/join-class — enroll logged-in student in an additional class.
 */

import { NextResponse } from "next/server";
import { JOIN_CODE_LENGTH } from "@/lib/constants";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";

type JoinClassBody = {
  joinCode?: string;
};

/**
 * Adds the current student to a class via join code.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as JoinClassBody;
    const joinCode = body.joinCode?.trim().toUpperCase() ?? "";

    if (joinCode.length !== JOIN_CODE_LENGTH) {
      return NextResponse.json({ error: "Invalid class code." }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("id, name, professor_id, is_active")
      .eq("join_code", joinCode)
      .single();

    if (classError || !classRow) {
      return NextResponse.json({ error: "Class not found. Check your class code." }, { status: 404 });
    }

    if (!classRow.is_active) {
      return NextResponse.json({ error: "This class is not accepting new students." }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from("student_classes")
      .select("id")
      .eq("student_id", session.studentId)
      .eq("class_id", classRow.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You are already enrolled in this class" },
        { status: 409 }
      );
    }

    const { error: enrollError } = await supabase.from("student_classes").insert({
      student_id: session.studentId,
      class_id: classRow.id,
      professor_id: classRow.professor_id,
    });

    if (enrollError) {
      return NextResponse.json({ error: "Could not join class. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, className: classRow.name });
  } catch {
    return NextResponse.json({ error: "Could not join class." }, { status: 500 });
  }
}
