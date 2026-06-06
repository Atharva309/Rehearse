/**
 * join/[joinCode]/page.tsx
 * Professor shareable link — shows class info and routes to register or login.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";
import { createServiceClient } from "@/lib/supabase/server";

type PageProps = { params: { joinCode: string } };

/**
 * Join landing page for a class — no form, just navigation to register/login.
 */
export default async function JoinClassPage({ params }: PageProps): Promise<React.ReactElement> {
  const joinCode = params.joinCode.toUpperCase();
  const supabase = createServiceClient();

  const { data: classRow } = await supabase
    .from("classes")
    .select("id, name, description, is_active, professor_id")
    .eq("join_code", joinCode)
    .single();

  if (!classRow || !classRow.is_active) {
    notFound();
  }

  const { data: professor } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", classRow.professor_id)
    .single();

  const professorName = professor?.full_name ?? "Your professor";
  const codeQuery = `?code=${joinCode}`;

  return (
    <AuthSplitLayout accent="gold" subtitle="Join your class on PitchLab.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Join Class</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Join {classRow.name}</h2>
      <p className="text-sm text-text-secondary mt-1">
        Taught by <span className="font-medium text-text-primary">{professorName}</span>
      </p>
      {classRow.description && (
        <p className="text-sm text-text-secondary mt-3">{classRow.description}</p>
      )}

      <div className="mt-8 space-y-3">
        <Link
          href={`/student-register${codeQuery}`}
          className="block w-full text-center btn-primary"
        >
          New student? Create account
        </Link>
        <Link
          href={`/student-login${codeQuery}`}
          className="block w-full text-center btn-accent"
        >
          Already registered? Sign in
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-text-secondary">
        Class code: <span className="font-mono font-semibold tracking-widest">{joinCode}</span>
      </p>
    </AuthSplitLayout>
  );
}
