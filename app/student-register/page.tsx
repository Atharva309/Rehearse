/**
 * page.tsx — student registration
 * Centered card for new students joining a class via join code.
 */

import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { getStudentSession } from "@/lib/student-session";
import { StudentRegisterForm } from "./StudentRegisterForm";

export const dynamic = "force-dynamic";

/**
 * Student registration page — redirects if session already exists.
 */
export default async function StudentRegisterPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (session) {
    redirect("/student/dashboard");
  }

  return (
    <AuthSplitLayout accent="accent" subtitle="Create your student account to join your class.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Student</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Create Account</h2>
      <p className="text-sm text-text-secondary mt-1">
        Enter the class code from your professor to get started.
      </p>
      <StudentRegisterForm />
    </AuthSplitLayout>
  );
}
