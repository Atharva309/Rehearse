/**
 * TempoSimulationResultsView.tsx
 * Outcome-driven results layout for Tempo / Summit Dental (Won, Partial, Lost).
 * Single page structure with hero, manager note, competency breakdown, badges, leaderboard.
 */

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { buildStudentLeaderboardRows } from "@/lib/leaderboard";
import {
  TEMPO_RESULTS_MAX_SCORE,
  TEMPO_RESULTS_STAGE_CONFIG,
  TEMPO_RESULTS_STAGE_SUBTITLES,
  TEMPO_STYLE_FEEDBACK_PLACEHOLDER,
  tempoResultsCompetencyLabel,
  tempoResultsDurationLabel,
  tempoResultsGradeColor,
  tempoResultsGradeFromPercent,
  tempoResultsHeroSubtitle,
  tempoResultsHeroTitle,
  tempoResultsManagerNote,
  tempoResultsOutcomeTheme,
  tempoResultsSubstanceStyle,
  resolveTempoResultsOutcome,
  type TempoTestResultsOutcome,
} from "@/lib/tempo-results";
import type { LeaderboardEntry, StageScore } from "@/types";

type TempoSimulationResultsViewProps = {
  simulationId: string;
  classId: string;
  displayName: string;
  totalScore: number;
  grade: string;
  dealWon: boolean;
  stageScores: StageScore[];
  leaderboard: LeaderboardEntry[];
  studentId: string;
  completedAt: string | null;
  startedAt: string | null;
  negotiationOutcome?: TempoTestResultsOutcome | null;
};

/**
 * Formats an ISO date for the leaderboard completed column.
 */
function formatCompletedDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Renders the Tempo simulation results page with outcome-specific styling.
 */
export function TempoSimulationResultsView({
  simulationId,
  classId,
  displayName,
  totalScore,
  grade,
  dealWon,
  stageScores,
  leaderboard,
  studentId,
  completedAt,
  startedAt,
  negotiationOutcome = null,
}: TempoSimulationResultsViewProps): React.ReactElement {
  const outcome = resolveTempoResultsOutcome(negotiationOutcome, dealWon);
  const theme = tempoResultsOutcomeTheme(outcome);
  const heroTitle = tempoResultsHeroTitle(outcome);
  const heroSubtitle = tempoResultsHeroSubtitle(negotiationOutcome, dealWon);
  const managerNote = tempoResultsManagerNote(negotiationOutcome, dealWon);
  const { topRows, showSeparator, currentRow } = buildStudentLeaderboardRows(
    leaderboard,
    studentId,
    5
  );

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Nav links — student portal header remains from layout */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors"
          >
            <MaterialIcon name="home" className="text-[18px]" />
            Dashboard
          </Link>
          <Link
            href={`/student/simulation/${simulationId}/entry?classId=${classId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors"
          >
            <MaterialIcon name="arrow_back" className="text-[18px]" />
            Rehearse Essentials
          </Link>
        </div>

        {/* Hero card */}
        <div
          className={`${theme.heroBgClass} rounded-xl overflow-hidden text-white relative`}
        >
          <div className="relative p-8 sm:p-12">
            <div className="flex flex-col xl:flex-row justify-between gap-10">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-tertiary-fixed block mb-4">
                  Simulation Complete
                </span>
                <h1 className="text-headline-lg font-bold mb-2">{heroTitle}</h1>
                <p className="text-body-lg opacity-90 mb-6">{heroSubtitle}</p>

                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { icon: "business", text: "Summit Dental Group" },
                    { icon: "work", text: "Tempo Pro · 8 locations" },
                    { icon: "check_circle", text: "5 stages completed" },
                  ].map((pill) => (
                    <span
                      key={pill.text}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-body-md bg-white/10 border border-white/20"
                    >
                      <MaterialIcon name={pill.icon} className="text-[16px]" />
                      {pill.text}
                    </span>
                  ))}
                </div>

                <div>
                  <span className="text-[11px] text-white/40 uppercase tracking-widest block mb-2">
                    Final Performance Score
                  </span>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-code-lg text-[48px] sm:text-[56px] font-bold leading-none">
                        {totalScore}
                      </span>
                      <span className="text-white/40 font-code-md text-xl sm:text-2xl ml-1">
                        / {TEMPO_RESULTS_MAX_SCORE}
                      </span>
                    </div>
                    <div
                      className={`px-6 py-4 rounded-xl flex flex-col items-center ${theme.gradeBadgeClass}`}
                    >
                      <span className="text-body-md font-code-md uppercase tracking-widest opacity-80">
                        Grade
                      </span>
                      <span className="text-[48px] sm:text-[56px] font-bold leading-none py-1">
                        {grade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full xl:w-72 shrink-0">
                <span className="text-[11px] text-white/40 uppercase tracking-widest block mb-4">
                  Skill Competencies
                </span>
                <div className="space-y-4 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                  {TEMPO_RESULTS_STAGE_CONFIG.map((stage) => {
                    const stageScore = stageScores.find((s) => s.stage === stage.id);
                    const score = stageScore?.score ?? 0;
                    const pct = Math.min(100, Math.round(score));

                    return (
                      <div key={stage.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-xs">{stage.label}</span>
                          <span className="font-code-md text-white text-xs">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                          <div
                            className={`h-full rounded-full ${theme.barFillClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-white/30 text-[10px] mt-3 italic">
                  Scores calculated after each stage, revealed now
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Manager note */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-lg shrink-0">
                  AT
                </div>
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface">Alex Torres</h3>
                  <p className="text-body-md text-on-surface-variant">Sales Director, Tempo</p>
                </div>
              </div>
              <p className="text-body-lg text-on-surface leading-relaxed whitespace-pre-line">
                {managerNote}
              </p>
            </div>

            {/* Competency breakdown — all 5 stages */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <h3 className="text-headline-md font-bold text-on-surface mb-6">
                Competency Breakdown
              </h3>
              <div className="space-y-4">
                {TEMPO_RESULTS_STAGE_CONFIG.map((stage) => {
                  const stageScore = stageScores.find((s) => s.stage === stage.id);
                  const score = stageScore?.score ?? 0;
                  const pct = Math.min(100, Math.round(score));
                  const feedback =
                    stageScore?.feedback?.trim() || "Submitted — scoring coming soon";
                  const { substance, style, substanceMax, styleMax } =
                    tempoResultsSubstanceStyle(score);
                  const isCritical = outcome === "kim_walked" && pct < 50;

                  return (
                    <div
                      key={stage.id}
                      className={`border border-outline-variant rounded-lg overflow-hidden ${
                        isCritical ? "bg-error-container/5" : "bg-surface-container-lowest"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-outline-variant">
                        <div className="flex items-center gap-4">
                          <MaterialIcon
                            name={isCritical ? "priority_high" : stage.icon}
                            className={theme.stageIconClass}
                          />
                          <div>
                            <p className="font-bold text-on-surface">{stage.label}</p>
                            <p className="text-body-md text-on-surface-variant">
                              {TEMPO_RESULTS_STAGE_SUBTITLES[stage.id]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-code-md font-bold text-on-surface">
                            {score}/100
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.modalityColor}`}
                          >
                            {stage.modality}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Overall competency bar */}
                        <div className="w-full md:max-w-xs md:ml-auto">
                          <div className="flex justify-between font-code-md text-[13px] mb-1">
                            <span>{pct}%</span>
                            <span className={theme.barLabelClass}>
                              {tempoResultsCompetencyLabel(pct)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${theme.barFillClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Substance */}
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

                        {/* Style */}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Locked badges */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
              <h4 className="text-headline-md font-bold text-on-surface mb-4">
                Achievement Progress
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center grayscale opacity-40"
                  >
                    <MaterialIcon name="lock" className="text-outline text-3xl" />
                  </div>
                ))}
              </div>
              <p className="text-label-sm text-on-surface-variant mt-4 text-center">
                Badges coming soon — 12 available in this simulation
              </p>
            </div>

            {/* Leaderboard */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                <h4 className="text-headline-md font-bold text-on-surface">Class Leaderboard</h4>
                <p className="text-body-md text-on-surface-variant mt-1">
                  Tempo — Summit Dental Group
                </p>
              </div>
              <div className="p-2 space-y-1">
                {topRows.map((entry) => {
                  const isCurrentStudent = entry.student_id === studentId;
                  const entryGrade = tempoResultsGradeFromPercent(
                    Math.round(((entry.total_score ?? 0) / TEMPO_RESULTS_MAX_SCORE) * 100)
                  );

                  return (
                    <div
                      key={entry.attempt_id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isCurrentStudent
                          ? "bg-secondary-container/20 border border-secondary"
                          : entry.rank === 1
                            ? "bg-tertiary-fixed/10 border border-tertiary-container/20"
                            : "hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-code-md w-5 shrink-0 ${
                            isCurrentStudent ? "text-secondary font-bold" : "text-outline"
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[10px] shrink-0">
                          {entry.student_name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`text-body-md truncate ${
                            isCurrentStudent ? "font-bold text-secondary" : "font-medium text-on-surface"
                          }`}
                        >
                          {entry.student_name}
                          {isCurrentStudent && " (You)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`font-code-md ${
                            isCurrentStudent ? "text-secondary font-bold" : "text-on-surface"
                          }`}
                        >
                          {entry.total_score ?? 0}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tempoResultsGradeColor(entryGrade)}`}
                        >
                          {entryGrade}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {showSeparator && currentRow && (
                  <>
                    <div className="px-3 py-2 flex items-center gap-3">
                      <div className="flex-1 border-t border-dashed border-outline-variant" />
                      <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">
                        {currentRow.rank - 5} more
                      </span>
                      <div className="flex-1 border-t border-dashed border-outline-variant" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary-container/20 border border-secondary">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-code-md text-secondary font-bold w-5 shrink-0">
                          {currentRow.rank}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[10px]">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-body-md font-bold text-secondary truncate">
                          {displayName} (You)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-code-md text-secondary font-bold">{totalScore}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tempoResultsGradeColor(grade)}`}
                        >
                          {grade}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant">
                <p className="text-label-sm text-on-surface-variant">
                  {leaderboard.length} students have completed this simulation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="pt-6 border-t border-outline-variant">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href={`/student/simulation/${simulationId}/entry?classId=${classId}&new=1`}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary-container text-on-primary font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                <MaterialIcon name="replay" />
                Start New Attempt
              </Link>
              <Link
                href="/student/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border border-outline-variant bg-surface-container-lowest text-on-surface font-medium rounded-xl hover:bg-surface-container-low active:scale-95 transition-all"
              >
                <MaterialIcon name="home" />
                Back to Dashboard
              </Link>
            </div>
            <p className="text-label-sm text-on-surface-variant/50">
              Tempo simulation · Summit Dental Group · Powered by Rehearse
            </p>
            <p className="text-label-sm text-on-surface-variant/40">
              Your highest score ({totalScore}) has been saved · Completed in{" "}
              {tempoResultsDurationLabel(startedAt, completedAt)} ·{" "}
              {formatCompletedDate(completedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
