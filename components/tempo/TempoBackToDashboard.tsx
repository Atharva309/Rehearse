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
 * Compact back control — gold fill so it stands out on the dark left column.
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
      className={`inline-flex items-center gap-1.5 w-fit px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-tertiary-container text-on-tertiary-fixed border border-tertiary-container shadow-sm hover:brightness-95 active:scale-[0.98] transition-all ${className}`}
    >
      <MaterialIcon name="arrow_back" className="text-[16px]" />
      Back to Dashboard
    </button>
  );
}
