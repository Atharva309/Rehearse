/**
 * StageScoreReveal.tsx
 * Post-stage score card with grade pill, feedback, and next CTA.
 */

"use client";

import { stageScoreToLetter } from "@/lib/grades";
import { letterGradePillClass } from "@/lib/score-display";

type StageScoreRevealProps = {
  score: number;
  feedback: string;
  advanceLabel?: string;
  onAdvance?: () => void;
};

/**
 * Displays large score, letter grade, feedback, and optional next-stage button.
 */
export function StageScoreReveal({
  score,
  feedback,
  advanceLabel = "Next Stage →",
  onAdvance,
}: StageScoreRevealProps): React.ReactElement {
  const grade = stageScoreToLetter(score);

  return (
    <div className="space-y-6 pt-6 border-t border-border">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-primary">{score}</span>
          <span className="text-lg text-text-secondary">/ 100</span>
        </div>
        <span
          className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${letterGradePillClass(grade)}`}
        >
          Grade {grade}
        </span>
      </div>

      <div className="card-surface p-4 border-l-4 border-l-gold bg-surface">
        <p className="text-sm text-text-secondary leading-relaxed">{feedback}</p>
      </div>

      {onAdvance && (
        <button type="button" onClick={onAdvance} className="w-full btn-primary py-3">
          {advanceLabel}
        </button>
      )}
    </div>
  );
}
