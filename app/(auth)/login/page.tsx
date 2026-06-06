/**
 * login/page.tsx
 * Stitch split-screen login page shell — professor Supabase auth only.
 */

import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

/**
 * Login page — redirects authenticated professors to dashboard; otherwise shows form.
 */
export default async function LoginPage(): Promise<React.ReactElement> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "teacher") {
        redirect("/teacher/dashboard");
      }
    }
  }

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
