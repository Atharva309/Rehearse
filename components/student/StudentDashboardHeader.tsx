/**
 * StudentDashboardHeader.tsx
 * Top app bar for the student portal — matches professor header styling.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { JoinClassButton } from "@/app/student/dashboard/JoinClassButton";

type StudentDashboardHeaderProps = {
  displayName: string;
  classCount: number;
};

/**
 * Sticky header with logo, join class, user info, and logout.
 */
export function StudentDashboardHeader({
  displayName,
  classCount,
}: StudentDashboardHeaderProps): React.ReactElement {
  const router = useRouter();

  const handleLogout = async (): Promise<void> => {
    await fetch("/api/student/logout", { method: "POST" });
    router.push("/student-login");
    router.refresh();
  };

  const subtitle =
    classCount === 0
      ? "Student"
      : classCount === 1
        ? "1 class enrolled"
        : `${classCount} classes enrolled`;

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant shrink-0 z-50">
      <div className="flex justify-between items-center w-full pl-4 pr-4 sm:pl-6 sm:pr-6 h-16">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-2 font-headline-lg text-headline-lg font-bold text-primary"
        >
          <img
            src="/pitchlab-logo-new.png"
            alt="Rehearse logo"
            className="h-[1.5em] w-auto shrink-0"
          />
          <span className="hidden sm:inline">Rehearse</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <JoinClassButton />
          <div className="hidden md:flex items-center gap-3 pr-4 border-r border-outline-variant">
            <div className="text-right">
              <p className="font-label-md text-label-md font-bold text-primary">{displayName}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {subtitle}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="px-4 h-10 border border-outline-variant text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2 active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
