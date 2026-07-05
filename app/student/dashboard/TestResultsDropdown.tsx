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
    <label className="inline-flex items-center gap-1 rounded-lg border border-emerald-900/30 bg-emerald-800 pl-3 pr-1 py-1 text-sm font-bold text-white shadow-sm">
      <span className="hidden sm:inline whitespace-nowrap">Test Results</span>
      <select
        className="cursor-pointer rounded-md border-0 bg-emerald-700 px-2 py-1.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/30"
        defaultValue=""
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
          Outcome…
        </option>
        {TEMPO_TEST_RESULTS_OUTCOMES.map((item) => (
          <option key={item.id} value={item.id} className="text-on-surface bg-white">
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
