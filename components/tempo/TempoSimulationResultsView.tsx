/**
 * TempoSimulationResultsView.tsx
 * Full results layout for the Tempo / Summit Dental simulation (default class).
 * Deal won/lost hero, manager note, stage breakdown, badges placeholder, leaderboard.
 */

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  TEMPO_RESULTS_MAX_SCORE,
  TEMPO_RESULTS_STAGE_CONFIG,
  tempoResultsDurationLabel,
  tempoResultsGradeColor,
  tempoResultsGradeFromPercent,
  tempoResultsHeroSubtitle,
  tempoResultsManagerNote,
  tempoResultsSubstanceStyle,
  type TempoTestResultsOutcome,
} from "@/lib/tempo-results";
import { buildStudentLeaderboardRows } from "@/lib/leaderboard";
import type { LeaderboardEntry } from "@/types";
import type { StageScore } from "@/types";

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
 * Renders the Tempo simulation results page sections from Stitch reference.
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
  const heroSubtitle = tempoResultsHeroSubtitle(negotiationOutcome, dealWon);
  const managerNote = tempoResultsManagerNote(negotiationOutcome, dealWon);
  const heroTitle =
    negotiationOutcome === "partial_close"
      ? "Partial Close."
      : dealWon
        ? "Deal Won."
        : "Deal Lost.";
  const { topRows, showSeparator, currentRow } = buildStudentLeaderboardRows(
    leaderboard,
    studentId,
    5
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section
        className={`w-full px-4 sm:px-8 ${
          dealWon ? "bg-primary-container" : "bg-[#1a1a1a]"
        }`}
      >
        <div className="max-w-5xl mx-auto pt-6 pb-2 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <MaterialIcon name="home" className="text-[18px]" />
            Dashboard
          </Link>
          <Link
            href={`/student/simulation/${simulationId}/entry?classId=${classId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <MaterialIcon name="arrow_back" className="text-[18px]" />
            Rehearse Essentials
          </Link>
        </div>
        <div className="max-w-5xl mx-auto py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-tertiary-fixed block mb-4">
                Simulation Complete
              </span>
              <h1 className="font-display-lg text-[40px] sm:text-[56px] font-bold leading-tight text-white mb-3">
                {heroTitle}
              </h1>
              <p className="text-white/70 font-body-lg mb-8">{heroSubtitle}</p>

              <div className="flex flex-wrap gap-3 mb-10">
                {[
                  { icon: "business", text: "Summit Dental Group" },
                  { icon: "work", text: "Tempo Pro · 8 locations" },
                  { icon: "check_circle", text: "5 stages completed" },
                ].map((pill) => (
                  <span
                    key={pill.text}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-label-sm text-white bg-white/10 border border-white/20"
                  >
                    <MaterialIcon name={pill.icon} className="text-[16px]" />
                    {pill.text}
                  </span>
                ))}
              </div>

              <div className="flex items-end gap-6">
                <div>
                  <span className="text-[11px] text-white/40 uppercase tracking-widest block mb-1">
                    Final Performance Score
                  </span>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-code-lg text-[48px] sm:text-[64px] font-bold text-white leading-none">
                      {totalScore}
                    </span>
                    <span className="text-white/40 font-code-md text-[20px] sm:text-[24px]">
                      / {TEMPO_RESULTS_MAX_SCORE}
                    </span>
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl ml-0 sm:ml-2 ${
                        dealWon
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : "bg-error-container text-error"
                      }`}
                    >
                      {grade}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-72 shrink-0">
              <span className="text-[11px] text-white/40 uppercase tracking-widest block mb-4">
                Skill Competencies
              </span>
              <div className="space-y-4 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                {TEMPO_RESULTS_STAGE_CONFIG.map((stage) => {
                  const stageScore = stageScores.find((s) => s.stage === stage.id);
                  const score = stageScore?.score ?? 0;
                  const pct = Math.min(100, Math.round((score / 100) * 100));

                  return (
                    <div key={stage.id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-xs">{stage.label}</span>
                        <span className="font-mono-label text-white text-xs">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            dealWon ? "bg-tertiary-fixed" : pct < 50 ? "bg-error" : "bg-white/40"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/30 text-[10px] mt-4 italic">
                Scores calculated after each stage, revealed now
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manager note */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-outline-variant bg-surface-container-low flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-lg">
                  AT
                </div>
                <div>
                  <p className="font-bold text-on-surface">Alex Torres</p>
                  <p className="text-on-surface-variant text-label-sm">
                    Senior Sales Manager, Tempo
                  </p>
                </div>
              </div>
              <span className="text-label-sm text-tertiary font-bold">Simulation complete</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-tertiary-container">
                <p className="text-body-lg text-on-surface leading-relaxed whitespace-pre-line">
                  {managerNote}
                </p>
              </div>
              <p className="text-label-sm text-on-surface-variant italic mt-4">
                This feedback was generated based on your performance across all 5 stages
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stage breakdown */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MaterialIcon name="bar_chart" className="text-primary text-[28px]" />
            <h2 className="font-headline-lg text-headline-lg text-primary">Stage Breakdown</h2>
          </div>

          <div className="space-y-4">
            {TEMPO_RESULTS_STAGE_CONFIG.map((stage) => {
              const stageScore = stageScores.find((s) => s.stage === stage.id);
              const score = stageScore?.score ?? 0;
              const feedback = stageScore?.feedback?.trim() || "Submitted — scoring coming soon";
              const { substance, style, substanceMax, styleMax } =
                tempoResultsSubstanceStyle(score);
              const stageGrade = tempoResultsGradeFromPercent(score);

              return (
                <div
                  key={stage.id}
                  className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm border-l-4 ${stage.borderColor}`}
                >
                  <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                        <MaterialIcon name={stage.icon} className="text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{stage.label}</h3>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.modalityColor}`}
                        >
                          {stage.modality}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-code-md text-on-surface font-bold text-lg">
                        {score}/100
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${tempoResultsGradeColor(stageGrade)}`}
                      >
                        {stageGrade}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-outline-variant">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                          Substance
                        </span>
                        <span className="font-code-md text-body-md text-on-surface">
                          {substance}/{substanceMax}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${(substance / substanceMax) * 100}%` }}
                        />
                      </div>
                      <p className="text-body-md text-on-surface-variant italic leading-relaxed">
                        {feedback}
                      </p>
                    </div>
                    <div className="p-6 md:border-t-0 border-t border-outline-variant">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary-container">
                          Style
                        </span>
                        <span className="font-code-md text-body-md text-on-surface">
                          {style}/{styleMax}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-tertiary-container rounded-full"
                          style={{ width: `${(style / styleMax) * 100}%` }}
                        />
                      </div>
                      <p className="text-body-md text-on-surface-variant italic leading-relaxed">
                        Style feedback will appear here once scoring is implemented.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Badges placeholder */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MaterialIcon name="workspace_premium" className="text-tertiary-container text-[28px]" filled />
            <h2 className="font-headline-lg text-headline-lg text-primary">Badges Earned</h2>
          </div>
          <div className="bg-tertiary-fixed/20 border border-tertiary-container/30 rounded-2xl p-8 sm:p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed/40 flex items-center justify-center mb-6">
              <MaterialIcon name="workspace_premium" className="text-tertiary-container text-[32px]" filled />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Badges coming soon</h3>
            <p className="text-body-lg text-on-surface-variant max-w-md leading-relaxed">
              Your behavior-based badges across Discovery and Objection Handling will appear here in
              the next update.
            </p>
            <span className="mt-4 text-label-sm text-on-surface-variant/60">
              12 badges available in this simulation
            </span>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MaterialIcon name="leaderboard" className="text-primary text-[28px]" />
            <h2 className="font-headline-lg text-headline-lg text-primary">Class Leaderboard</h2>
          </div>
          <p className="text-on-surface-variant text-body-md mb-8">
            Tempo Simulation — Summit Dental Group
          </p>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-[60px_1fr_120px_80px_140px] bg-surface-container border-b border-outline-variant px-6 py-3">
              {["Rank", "Student", "Score", "Grade", "Completed"].map((col) => (
                <span
                  key={col}
                  className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
                >
                  {col}
                </span>
              ))}
            </div>

            {topRows.map((entry) => {
              const isCurrentStudent = entry.student_id === studentId;
              const entryGrade = tempoResultsGradeFromPercent(
                Math.round(((entry.total_score ?? 0) / TEMPO_RESULTS_MAX_SCORE) * 100)
              );

              return (
                <div
                  key={entry.attempt_id}
                  className={`grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_80px_140px] px-6 py-4 border-b border-outline-variant items-center gap-2 sm:gap-0 ${
                    entry.rank === 1
                      ? "bg-tertiary-fixed/10 border-l-4 border-l-tertiary-container"
                      : isCurrentStudent
                        ? "bg-secondary-fixed/20 border-l-4 border-l-secondary"
                        : "hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {entry.rank <= 3 ? (
                      <MaterialIcon
                        name="workspace_premium"
                        className={`text-[20px] ${
                          entry.rank === 1
                            ? "text-tertiary-container"
                            : entry.rank === 2
                              ? "text-outline-variant"
                              : "text-amber-600"
                        }`}
                        filled
                      />
                    ) : (
                      <span className="font-code-md text-on-surface-variant text-body-md w-6 text-center">
                        {entry.rank.toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs">
                      {entry.student_name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`font-body-md ${
                        isCurrentStudent ? "font-bold text-secondary" : "text-on-surface"
                      }`}
                    >
                      {entry.student_name}
                    </span>
                    {isCurrentStudent && (
                      <span className="text-[10px] bg-secondary-fixed text-secondary px-2 py-0.5 rounded-full font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <span className="font-code-md text-on-surface sm:block">
                    {entry.total_score ?? 0} / {TEMPO_RESULTS_MAX_SCORE}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${tempoResultsGradeColor(entryGrade)}`}
                  >
                    {entryGrade}
                  </div>
                  <span className="text-on-surface-variant text-label-sm">
                    {formatCompletedDate(entry.completed_at)}
                  </span>
                </div>
              );
            })}

            {showSeparator && currentRow && (
              <>
                <div className="px-6 py-2 flex items-center gap-3">
                  <div className="flex-1 border-t border-dashed border-outline-variant" />
                  <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">
                    {currentRow.rank - 5} more
                  </span>
                  <div className="flex-1 border-t border-dashed border-outline-variant" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_80px_140px] px-6 py-4 border-b border-outline-variant items-center gap-2 sm:gap-0 bg-secondary-fixed/20 border-l-4 border-l-secondary">
                  <span className="font-code-md text-secondary font-bold">
                    {currentRow.rank.toString().padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-secondary">{displayName}</span>
                    <span className="text-[10px] bg-secondary-fixed text-secondary px-2 py-0.5 rounded-full font-bold">
                      You
                    </span>
                  </div>
                  <span className="font-code-md text-on-surface">
                    {totalScore} / {TEMPO_RESULTS_MAX_SCORE}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${tempoResultsGradeColor(grade)}`}
                  >
                    {grade}
                  </div>
                  <span className="text-on-surface-variant text-label-sm">
                    {formatCompletedDate(completedAt)}
                  </span>
                </div>
              </>
            )}

            <div className="px-6 py-4 bg-surface-container-low">
              <p className="text-label-sm text-on-surface-variant">
                {leaderboard.length} students have completed this simulation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom actions */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-surface-container-lowest border-t border-outline-variant">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
            <div className="flex flex-col items-center gap-2">
              <Link
                href={`/student/simulation/${simulationId}/entry?classId=${classId}&new=1`}
                className="flex items-center gap-3 px-8 py-4 bg-primary-container text-on-primary font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                <MaterialIcon name="replay" />
                Start New Attempt
              </Link>
              <span className="text-label-sm text-on-surface-variant">
                Same buyer, fresh details each time
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/student/dashboard"
                className="flex items-center gap-3 px-8 py-4 border-2 border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container active:scale-95 transition-all"
              >
                <MaterialIcon name="home" />
                Back to Dashboard
              </Link>
              <span className="text-label-sm text-on-surface-variant">
                Return to your simulations
              </span>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant/50 mt-4">
            Tempo simulation · Summit Dental Group · Powered by Rehearse
          </p>
          <p className="text-label-sm text-on-surface-variant/40 mt-2">
            Your highest score ({totalScore}) has been saved · Completed in{" "}
            {tempoResultsDurationLabel(startedAt, completedAt)}
          </p>
        </div>
      </section>
    </div>
  );
}
