/**
 * layout.tsx — student section
 * Requires student JWT session; renders PitchLab header with student logout.
 */

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Student layout wrapper — class-based auth (no Supabase auth).
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
  const { data: classRow } = await supabase
    .from("classes")
    .select("name")
    .eq("id", session.classId)
    .single();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        userName={session.displayName}
        subtitle={classRow?.name ?? undefined}
        homeHref="/student/dashboard"
        logoutMode="student"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-6 pt-2 sm:px-6">
        {children}
      </div>
    </div>
  );
}
