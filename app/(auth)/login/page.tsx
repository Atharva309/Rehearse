/**
 * login/page.tsx
 * Stitch split-screen login page shell.
 */

import { Suspense } from "react";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { LoginForm } from "./LoginForm";

/**
 * Login page with brand panel and form card.
 */
export default function LoginPage(): React.ReactElement {
  return (
    <AuthSplitLayout accent="accent" subtitle="Sign in to continue your sales training.">
      <h2 className="text-2xl font-bold text-primary">Welcome back</h2>
      <p className="text-sm text-text-secondary mt-1">Sign in to your PitchLab account</p>
      <Suspense fallback={<p className="mt-8 text-sm text-text-secondary">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
