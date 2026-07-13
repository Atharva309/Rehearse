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
 * Compact back control styled for the dark primary left column.
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
      className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide uppercase text-white/90 border border-white/20 hover:bg-white/10 hover:text-white transition-colors ${className}`}
    >
      <MaterialIcon name="arrow_back" className="text-[16px]" />
      Back to Dashboard
    </button>
  );
}
