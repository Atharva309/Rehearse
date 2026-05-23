/**
 * register/page.tsx
 * Stitch split-screen registration with role selector cards.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

/**
 * Registration form with student/teacher role cards.
 */
export default function RegisterPage(): React.ReactElement {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }
    router.push(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    router.refresh();
  };

  return (
    <AuthSplitLayout accent="gold" subtitle="Create your account and start practicing.">
      <h2 className="text-2xl font-bold text-primary">Create account</h2>
      <p className="text-sm text-text-secondary mt-1">Join as a student or teacher</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-text-primary">
          Full name
          <input
            required
            className="input-field mt-1"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Email
          <input
            type="email"
            required
            className="input-field mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Password
          <input
            type="password"
            required
            minLength={6}
            className="input-field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <p className="text-sm font-medium text-text-primary pt-2">I am a</p>
        <div className="grid grid-cols-2 gap-3">
          {(["student", "teacher"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`p-4 border-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                role === r
                  ? "border-accent bg-accent text-white shadow-md"
                  : "border-border text-text-secondary bg-surface hover:border-accent/40"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error.length > 0 && <p className="text-sm text-error">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full btn-primary">
          {isLoading ? "Creating…" : "Register"}
        </button>
      </form>

      <p className="text-sm text-text-secondary mt-6 text-center">
        Have an account?{" "}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
