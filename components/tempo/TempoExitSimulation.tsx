/**
 * TempoExitSimulation.tsx
 * Exit control for the top of Tempo stage left (blue) columns.
 * Returns the student to the simulation entry (briefing) screen.
 */

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type TempoExitSimulationProps = {
  className?: string;
};

/**
 * Compact arrow + text exit — matches top-bar control height.
 */
export function TempoExitSimulation({
  className = "",
}: TempoExitSimulationProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleExit = (): void => {
    // Stage pages live at /student/simulation/[id]; the briefing screen is /entry.
    const classId = searchParams.get("classId")?.trim() ?? "";
    router.push(
      classId ? `${pathname}/entry?classId=${classId}` : "/student/dashboard"
    );
  };

  return (
    <button
      type="button"
      onClick={handleExit}
      className={`inline-flex items-center gap-1.5 h-8 w-fit text-[12px] font-medium tracking-wide text-on-primary/85 hover:text-on-primary transition-colors ${className}`}
    >
      <MaterialIcon name="arrow_back" className="text-[18px]" />
      Exit Simulation
    </button>
  );
}
