/**
 * TestShortcutsDropdown.tsx
 * Dev shortcut — jump to any Tempo stage or prefilled results preview.
 */

"use client";

import { useRouter } from "next/navigation";
import { DEFAULT_CLASS_ID, TEMPO_SIMULATION_ID } from "@/lib/constants";
import { TEMPO_TEST_RESULTS_OUTCOMES } from "@/lib/tempo-results";

type TestShortcutsDropdownProps = {
  simulationId?: string;
  classId?: string;
};

const STAGE_OPTIONS = [
  { id: "prospecting", label: "Stage 1 — Prospecting", teststage: null },
  { id: "discovery", label: "Stage 2 — Discovery", teststage: "discovery" },
  { id: "presentation", label: "Stage 3 — Presentation", teststage: "presentation" },
  { id: "objections", label: "Stage 4 — Objections", teststage: "objections" },
  { id: "negotiation", label: "Stage 5 — Negotiation", teststage: "negotiation" },
] as const;

/**
 * Single dropdown for Tempo stage tests and results page previews.
 */
export function TestShortcutsDropdown({
  simulationId = TEMPO_SIMULATION_ID,
  classId = DEFAULT_CLASS_ID,
}: TestShortcutsDropdownProps): React.ReactElement {
  const router = useRouter();

  const handleChange = (value: string): void => {
    if (!value) {
      return;
    }

    if (value.startsWith("stage:")) {
      const stageId = value.replace("stage:", "");
      const stage = STAGE_OPTIONS.find((s) => s.id === stageId);
      if (!stage) {
        return;
      }
      const base = `/student/simulation/${simulationId}?classId=${classId}`;
      router.push(stage.teststage ? `${base}&teststage=${stage.teststage}` : base);
      return;
    }

    if (value.startsWith("results:")) {
      const outcome = value.replace("results:", "");
      router.push(
        `/student/simulation/${simulationId}/complete?classId=${classId}&testresults=${outcome}`
      );
    }
  };

  return (
    <select
      className="h-10 pl-3 pr-8 border border-outline-variant text-on-surface font-bold rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors text-label-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
      defaultValue=""
      title="Test Tempo stages and results"
      onChange={(e) => {
        handleChange(e.target.value);
        e.target.value = "";
      }}
      aria-label="Test shortcuts"
    >
      <option value="" disabled>
        Test…
      </option>
      <optgroup label="Stages">
        {STAGE_OPTIONS.map((stage) => (
          <option key={stage.id} value={`stage:${stage.id}`}>
            {stage.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Results">
        {TEMPO_TEST_RESULTS_OUTCOMES.map((item) => (
          <option key={item.id} value={`results:${item.id}`}>
            Results — {item.shortLabel}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
