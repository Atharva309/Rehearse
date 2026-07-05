/**
 * page.tsx — student login
 * Centered auth card for returning students — username and password sign-in.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/student-session";
import { StudentLoginForm } from "./StudentLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — Rehearse",
};

/**
 * Student login page — redirects if session already exists.
 */
export default async function StudentLoginPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (session) {
    redirect("/student/dashboard");
  }

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
            Welcome back
          </h1>
          <p className="text-on-surface-variant font-body-md mt-2">
            Sign in to continue your training
          </p>
        </div>

        <StudentLoginForm />

        <p className="text-label-sm text-on-surface-variant text-center mt-6">
          New student? Use your professor&apos;s join link to register
        </p>
      </div>
    </div>
  );
}
