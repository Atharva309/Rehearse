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
                className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 text-left hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <MaterialIcon
                    name={isCritical ? "priority_high" : stage.icon}
                    className={`shrink-0 ${theme.stageIconClass}`}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface">{stage.label}</p>
                    <p className="text-body-md text-on-surface-variant truncate">
                      {TEMPO_RESULTS_STAGE_SUBTITLES[stage.id]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                  <div className="flex-1 md:w-32">
                    <div className="flex justify-between font-code-md text-[12px] mb-1">
                      <span className="text-on-surface-variant">{pct}%</span>
                      <span className={theme.barLabelClass}>
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
                  <span className="font-code-md font-bold text-on-surface whitespace-nowrap">
                    {score}/100
                  </span>
                  <span
                    className={`hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.modalityColor}`}
                  >
                    {stage.modality}
                  </span>
                  <MaterialIcon
                    name="expand_more"
                    className={`text-on-surface-variant transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-outline-variant">
                  <span
                    className={`inline-block sm:hidden mt-3 text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.modalityColor}`}
                  >
                    {stage.modality}
                  </span>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        Substance
                      </span>
                      <span className="font-code-md text-body-md text-on-surface">
                        {substance}/{substanceMax}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-2">
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
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary-container flex items-center gap-1.5">
                        <MaterialIcon name="timer" className="text-[16px]" />
                        Style
                      </span>
                      <span className="font-code-md text-body-md text-on-surface">
                        {style}/{styleMax}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-2">
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
