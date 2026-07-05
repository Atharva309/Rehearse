/**
 * page.tsx — student registration
 * Centered auth card for new students joining a class via join code.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/student-session";
import { StudentRegisterForm } from "./StudentRegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account — Rehearse",
};

type PageProps = {
  searchParams: { code?: string };
};

/**
 * Student registration page — redirects if session already exists.
 */
export default async function StudentRegisterPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (session) {
    redirect("/student/dashboard");
  }

  const initialJoinCode = searchParams.code?.trim().toUpperCase() ?? "";

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md p-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <img
            src="/pitchlab-logo-new.png"
            alt="Rehearse logo"
            className="h-8 w-auto"
          />
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold mt-6">
            Create your account
          </h1>
          <p className="text-on-surface-variant font-body-md mt-2">
            Join your professor&apos;s class and start training
          </p>
        </div>

        <StudentRegisterForm initialJoinCode={initialJoinCode} />

        <p className="text-label-sm text-on-surface-variant text-center mt-6">
          Already have an account?{" "}
          <Link href="/student-login" className="text-secondary font-bold hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
