/**
 * join/[joinCode]/page.tsx
 * Class-specific join landing — links to register (with code) or login.
 */

import Link from "next/link";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";

type PageProps = { params: { joinCode: string } };

/**
 * Join page for a specific class code from professor share links.
 */
export default function JoinClassPage({ params }: PageProps): React.ReactElement {
  const joinCode = params.joinCode.trim().toUpperCase();
  const registerHref = `/student-register?code=${encodeURIComponent(joinCode)}`;

  return (
    <AuthSplitLayout accent="gold" subtitle="Join your class on PitchLab.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Join Class</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Welcome to PitchLab</h2>
      <p className="text-sm text-text-secondary mt-1">
        Class code <span className="font-mono font-semibold text-primary">{joinCode}</span> — use it
        when creating your account, or sign in and join from your dashboard.
      </p>

      <div className="mt-8 space-y-3">
        <Link href={registerHref} className="block w-full text-center btn-primary">
          New student? Create your account
        </Link>
        <Link href="/student-login" className="block w-full text-center btn-accent">
          Already have an account? Sign in and join
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
