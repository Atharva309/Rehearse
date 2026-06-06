/**
 * page.tsx
 * Root redirect to login or role-appropriate dashboard.
 */

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth-helpers";
import { getStudentSession } from "@/lib/student-session";

export const dynamic = "force-dynamic";

/**
 * Sends authenticated users to their dashboard; others to login.
 */
export default async function HomePage(): Promise<never> {
  const studentSession = await getStudentSession();
  if (studentSession) {
    redirect("/student/dashboard");
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(profile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
}
