/**
 * layout.tsx — student section
 * Requires student JWT session; renders Rehearse header with student logout.
 */

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Student layout wrapper — JWT session auth (no Supabase auth).
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("student_classes")
    .select("*", { count: "exact", head: true })
    .eq("student_id", session.studentId);

  const classCount = count ?? 0;
  const subtitle =
    classCount === 0
      ? "Rehearse Student Portal"
      : classCount === 1
        ? "1 class enrolled"
        : `${classCount} classes enrolled`;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        userName={session.displayName}
        subtitle={subtitle}
        homeHref="/student/dashboard"
        logoutMode="student"
        containerClassName="w-full px-4 sm:px-6 h-16 flex items-center justify-between"
      />
      <div className="flex w-full flex-1 flex-col pb-6 pt-2">
        {children}
      </div>
    </div>
  );
}
