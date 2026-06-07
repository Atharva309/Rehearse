/**
 * join-class/route.ts
 * POST /api/student/join-class — enroll logged-in student in an additional class.
 */

import { NextResponse } from "next/server";
import { JOIN_CODE_LENGTH } from "@/lib/constants";
import {
  enrollStudentInClass,
  enrollmentErrorMessage,
  isStudentEnrolledInClass,
} from "@/lib/student-enrollment";
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

    const { data: studentRow, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", session.studentId)
      .single();

    if (studentError || !studentRow) {
      return NextResponse.json(
        { error: "Session expired. Please sign out and sign in again." },
        { status: 401 }
      );
    }

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

    if (!classRow.professor_id) {
      return NextResponse.json({ error: "This class is not configured correctly." }, { status: 500 });
    }

    const { enrolled, lookupFailed } = await isStudentEnrolledInClass(
      supabase,
      session.studentId,
      classRow.id
    );

    if (lookupFailed) {
      const probe = await supabase.from("student_classes").select("id").limit(1);
      if (probe.error) {
        const mapped = enrollmentErrorMessage(probe.error);
        return NextResponse.json(
          { error: mapped.message, code: mapped.code },
          { status: mapped.status }
        );
      }
    }

    if (enrolled) {
      return NextResponse.json(
        { error: "You are already enrolled in this class" },
        { status: 409 }
      );
    }

    const result = await enrollStudentInClass(supabase, {
      studentId: session.studentId,
      classId: classRow.id,
      professorId: classRow.professor_id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ success: true, className: classRow.name });
  } catch (err) {
    console.error("[join-class] unexpected", err);
    return NextResponse.json({ error: "Could not join class." }, { status: 500 });
  }
}
