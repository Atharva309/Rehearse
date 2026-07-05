/**
 * TestResultsDropdown.tsx
 * Dev shortcut — preview Tempo results page with prefilled deal outcomes.
 */

"use client";

import { useRouter } from "next/navigation";
import { TEMPO_TEST_RESULTS_OUTCOMES } from "@/lib/tempo-results";

type TestResultsDropdownProps = {
  simulationId: string;
  classId: string;
};

/**
 * Dropdown beside Test Stage 5 that opens prefilled results previews.
 */
export function TestResultsDropdown({
  simulationId,
  classId,
}: TestResultsDropdownProps): React.ReactElement {
  const router = useRouter();

  return (
    <select
      className="cursor-pointer shrink-0 w-[4.25rem] border-0 bg-emerald-600 px-1 py-2 text-xs font-bold text-white outline-none transition-colors hover:bg-emerald-500 focus:ring-2 focus:ring-white/30"
      defaultValue=""
      title="Test results page"
      onChange={(e) => {
        const outcome = e.target.value;
        if (!outcome) {
          return;
        }
        router.push(
          `/student/simulation/${simulationId}/complete?classId=${classId}&testresults=${outcome}`
        );
        e.target.value = "";
      }}
      aria-label="Test results page outcome"
    >
      <option value="" disabled>
        Res
      </option>
      {TEMPO_TEST_RESULTS_OUTCOMES.map((item) => (
        <option key={item.id} value={item.id} title={item.label}>
          {item.shortLabel}
        </option>
      ))}
    </select>
  );
}
