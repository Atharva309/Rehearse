/**
 * join/[joinCode]/page.tsx
 * Class-specific join landing — register or sign in for a professor class.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { DEFAULT_CLASS_JOIN_CODE } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";

type PageProps = { params: { joinCode: string } };

/**
 * Join page for a specific class code from professor share links.
 */
export default async function JoinClassPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const joinCode = params.joinCode.trim().toUpperCase();
  const registerHref = `/student-register?code=${encodeURIComponent(joinCode)}`;

  let className = "Your Class";
  let professorName = "Your Professor";
  let isActive = true;

  if (joinCode !== DEFAULT_CLASS_JOIN_CODE) {
    const supabase = createServiceClient();
    const { data: classRow } = await supabase
      .from("classes")
      .select("name, professor_id, is_active")
      .eq("join_code", joinCode)
      .maybeSingle();

    if (classRow) {
      className = classRow.name as string;
      isActive = classRow.is_active as boolean;

      if (classRow.professor_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", classRow.professor_id as string)
          .maybeSingle();

        if (profile?.full_name) {
          professorName = profile.full_name as string;
        }
      }
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md p-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <img
            src="/pitchlab-logo-new.png"
            alt="Rehearse logo"
            className="h-8 w-auto"
          />
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold mt-6">
            {className}
          </h1>
          <p className="text-on-surface-variant font-body-md mt-1">{professorName}</p>
          {isActive && (
            <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-green-100 text-green-700 font-bold text-label-sm rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              Active
            </span>
          )}
        </div>

        <div className="border-t border-outline-variant my-8" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <MaterialIcon name="person_add" className="text-secondary text-[32px]" />
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                I&apos;m new here
              </h2>
              <p className="text-on-surface-variant font-body-md mt-1">
                Create your account to join this class
              </p>
            </div>
            <Link
              href={registerHref}
              className="mt-auto w-full h-10 bg-primary-container text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors"
            >
              Register →
            </Link>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <MaterialIcon name="login" className="text-secondary text-[32px]" />
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                I have an account
              </h2>
              <p className="text-on-surface-variant font-body-md mt-1">
                Sign in and join from your dashboard
              </p>
            </div>
            <Link
              href="/student-login"
              className="mt-auto w-full h-10 border border-outline-variant text-on-surface font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
            >
              Sign In →
            </Link>
          </div>
        </div>

        <p className="text-center text-label-sm text-on-surface-variant mt-8 font-code-md uppercase tracking-widest">
          Class code: {joinCode}
        </p>
      </div>
    </div>
  );
}

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: `Join ${params.joinCode.toUpperCase()} — Rehearse`,
  };
}
