/**
 * page.tsx — student login
 * Returning students sign in with class code, username, and password.
 */

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { getStudentSession } from "@/lib/student-session";
import { StudentLoginForm } from "./StudentLoginForm";

export const dynamic = "force-dynamic";

/**
 * Student login page — redirects if session already exists.
 */
export default async function StudentLoginPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (session) {
    redirect("/student/dashboard");
  }

  return (
    <AuthSplitLayout accent="accent" subtitle="Sign in to continue your sales training.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Student</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Student Sign In</h2>
      <p className="text-sm text-text-secondary mt-1">Use the class code from your professor.</p>
      <Suspense fallback={<p className="mt-8 text-sm text-text-secondary">Loading…</p>}>
        <StudentLoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
