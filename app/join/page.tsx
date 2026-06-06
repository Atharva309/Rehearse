/**
 * join/page.tsx
 * Generic student entry — no class code in the URL; teachers share the code separately.
 */

import Link from "next/link";
import { AuthSplitLayout } from "@/components/ui/AuthSplitLayout";

/**
 * Join landing page — routes to register or login; students enter class code on those forms.
 */
export default function JoinPage(): React.ReactElement {
  return (
    <AuthSplitLayout accent="gold" subtitle="Join your class on PitchLab.">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Join Class</p>
      <h2 className="text-2xl font-bold text-primary mt-2">Welcome to PitchLab</h2>
      <p className="text-sm text-text-secondary mt-1">
        Use the class code from your professor when you create an account or sign in.
      </p>

      <div className="mt-8 space-y-3">
        <Link href="/student-register" className="block w-full text-center btn-primary">
          New student? Create account
        </Link>
        <Link href="/student-login" className="block w-full text-center btn-accent">
          Already registered? Sign in
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
