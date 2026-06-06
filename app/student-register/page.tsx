/**
 * page.tsx — student registration
 * Centered card for new students joining a class via join code.
 */

import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { StudentRegisterForm } from "./StudentRegisterForm";

/**
 * Student registration page with PitchLab branding.
 */
export default function StudentRegisterPage(): React.ReactElement {
  return (
    <AuthSplitLayout accent="accent" subtitle="Create your student account to join your class.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Student</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Create Account</h2>
      <p className="text-sm text-text-secondary mt-1">
        Enter the class code from your professor to get started.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-text-secondary">Loading…</p>}>
        <StudentRegisterForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
