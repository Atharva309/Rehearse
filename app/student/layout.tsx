/**
 * layout.tsx — student section
 * Requires student role; renders PitchLab header.
 */

export const dynamic = "force-dynamic";

import { AppHeader } from "@/components/AppHeader";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Student layout wrapper.
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const profile = await requireRole("student");
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader userName={profile.full_name} homeHref="/student/dashboard" />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 pb-3 pt-2 sm:px-6">
        {children}
      </div>
    </div>
  );
}
