/**
 * TempoBackToDashboard.tsx
 * Dashboard exit control for the top of Tempo stage left (blue) columns.
 */

"use client";

import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type TempoBackToDashboardProps = {
  /** Optional override; defaults to /student/dashboard. */
  href?: string;
  className?: string;
};

/**
 * Compact arrow + text exit — matches top-bar control height.
 */
export function TempoBackToDashboard({
  href = "/student/dashboard",
  className = "",
}: TempoBackToDashboardProps): React.ReactElement {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`inline-flex items-center gap-1.5 h-8 w-fit text-[12px] font-medium tracking-wide text-on-primary/85 hover:text-on-primary transition-colors ${className}`}
    >
      <MaterialIcon name="arrow_back" className="text-[18px]" />
      Back to Dashboard
    </button>
  );
}
