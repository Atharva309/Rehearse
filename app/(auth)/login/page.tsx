/**
 * login/page.tsx
 * Stitch split-screen login page shell.
 */

import { Suspense } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { LoginForm } from "./LoginForm";

/**
 * Login page with brand panel and form card.
 */
export default function LoginPage(): React.ReactElement {
  return (
    <AuthSplitLayout accent="accent" subtitle="Sign in to continue your sales training.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Professor Sign In</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Welcome back</h2>
      <p className="text-sm text-text-secondary mt-1">Sign in to your PitchLab account</p>
      <Suspense fallback={<p className="mt-8 text-sm text-text-secondary">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-text-secondary text-center">
        Students — use the link provided by your professor or{" "}
        <Link href="/student-login" className="text-accent font-medium hover:underline">
          Student Login →
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
