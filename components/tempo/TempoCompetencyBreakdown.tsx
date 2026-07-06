/**
 * TempoCompetencyBreakdown.tsx
 * Collapsible per-stage competency cards for the Tempo simulation results page.
 */

"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  TEMPO_RESULTS_STAGE_CONFIG,
  TEMPO_RESULTS_STAGE_SUBTITLES,
  TEMPO_STYLE_FEEDBACK_PLACEHOLDER,
  tempoResultsCompetencyLabel,
  tempoResultsSubstanceStyle,
  type TempoResultsOutcomeTheme,
  type TempoTestResultsOutcome,
} from "@/lib/tempo-results";
import type { StageScore } from "@/types";

type TempoCompetencyBreakdownProps = {
  stageScores: StageScore[];
  outcome: TempoTestResultsOutcome;
  theme: TempoResultsOutcomeTheme;
};

/** Left padding so expanded body aligns with stage title column. */
const EXPANDED_BODY_PAD = "pt-4 pr-4 pb-4 pl-[4.25rem]";

/**
 * Renders five expandable stage competency dropdowns.
 */
export function TempoCompetencyBreakdown({
  stageScores,
  outcome,
  theme,
}: TempoCompetencyBreakdownProps): React.ReactElement {
  const [openStages, setOpenStages] = useState<ReadonlySet<string>>(() => new Set());

  const toggleStage = (stageId: string): void => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h3 className="text-headline-md font-bold text-on-surface mb-6">Competency Breakdown</h3>
      <div className="space-y-3">
        {TEMPO_RESULTS_STAGE_CONFIG.map((stage) => {
          const stageScore = stageScores.find((s) => s.stage === stage.id);
          const score = stageScore?.score ?? 0;
          const pct = Math.min(100, Math.round(score));
          const feedback = stageScore?.feedback?.trim() || "Submitted — scoring coming soon";
          const { substance, style, substanceMax, styleMax } = tempoResultsSubstanceStyle(score);
          const isCritical = outcome === "kim_walked" && pct < 50;
          const isOpen = openStages.has(stage.id);

          return (
            <div
              key={stage.id}
              className={`border border-outline-variant rounded-lg overflow-hidden ${
                isCritical ? "bg-error-container/5" : "bg-surface-container-lowest"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleStage(stage.id)}
                aria-expanded={isOpen}
                className="w-full p-4 text-left hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <MaterialIcon
                      name={isCritical ? "priority_high" : stage.icon}
                      className={`text-[22px] ${theme.stageIconClass}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem_4rem] lg:grid-cols-[minmax(0,1fr)_9rem_4rem_7.5rem_1.25rem] gap-x-4 gap-y-3 items-center">
                    <div className="min-w-0 pr-6 sm:pr-0">
                      <p className="font-bold text-on-surface leading-tight">{stage.label}</p>
                      <p className="text-body-md text-on-surface-variant leading-snug mt-0.5 line-clamp-2 sm:line-clamp-1">
                        {TEMPO_RESULTS_STAGE_SUBTITLES[stage.id]}
                      </p>
                    </div>

                    <div className="w-full sm:w-36 justify-self-stretch">
                      <div className="flex justify-between font-code-md text-[12px] mb-1 gap-2">
                        <span className="text-on-surface-variant tabular-nums">{pct}%</span>
                        <span className={`${theme.barLabelClass} truncate text-right`}>
                          {tempoResultsCompetencyLabel(pct)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${theme.barFillClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <span className="font-code-md font-bold text-on-surface tabular-nums text-right sm:text-center lg:text-right">
                      {score}/100
                    </span>

                    <span
                      className={`hidden lg:inline-flex justify-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${stage.modalityColor}`}
                    >
                      {stage.modality}
                    </span>

                    <MaterialIcon
                      name="expand_more"
                      className={`hidden lg:block text-on-surface-variant transition-transform duration-200 justify-self-end ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  <MaterialIcon
                    name="expand_more"
                    className={`lg:hidden shrink-0 text-on-surface-variant transition-transform duration-200 mt-1 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <span
                  className={`lg:hidden inline-flex mt-3 ml-[3.25rem] text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.modalityColor}`}
                >
                  {stage.modality}
                </span>
              </button>

              {isOpen && (
                <div className={`border-t border-outline-variant space-y-4 ${EXPANDED_BODY_PAD}`}>
                  <div>
                    <div className="flex justify-between items-baseline gap-4 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        Substance
                      </span>
                      <span className="font-code-md text-body-md text-on-surface tabular-nums shrink-0">
                        {substance}/{substanceMax}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${theme.barFillClass}`}
                        style={{ width: `${(substance / substanceMax) * 100}%` }}
                      />
                    </div>
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      {feedback}
                    </p>
                  </div>

                  <div className="border border-dashed border-outline-variant rounded-lg p-4 bg-surface-container-low">
                    <div className="flex justify-between items-baseline gap-4 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary-container inline-flex items-center gap-1.5">
                        <MaterialIcon name="timer" className="text-[16px]" />
                        Style
                      </span>
                      <span className="font-code-md text-body-md text-on-surface tabular-nums shrink-0">
                        {style}/{styleMax}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${theme.barFillClass}`}
                        style={{ width: `${(style / styleMax) * 100}%` }}
                      />
                    </div>
                    <p className="text-body-md text-outline leading-relaxed">
                      {TEMPO_STYLE_FEEDBACK_PLACEHOLDER}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
