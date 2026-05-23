/**
 * AppHeader.tsx
 * Stitch navbar — logo, notifications placeholder, user name, logout.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AppHeaderProps = {
  userName: string;
  homeHref: string;
};

/**
 * Top navigation bar for student and teacher dashboards.
 */
export function AppHeader({ userName, homeHref }: AppHeaderProps): React.ReactElement {
  const router = useRouter();

  const handleLogout = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-page sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={homeHref} className="text-xl font-bold text-primary tracking-tight">
          PitchLab
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {/* TODO: notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:bg-surface transition-colors"
            disabled
            title="Notifications coming soon"
          >
            <span className="sr-only">Notifications</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <span className="hidden sm:inline font-medium text-text-primary">{userName}</span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-text-secondary hover:text-primary font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
