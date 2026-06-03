/**
 * StageShell.tsx
 * Shared layout for stage score + feedback + next-stage CTA (Stitch styling).
 */

"use client";

import { useEffect, useRef } from "react";
import { StageScoreReveal } from "@/components/StageScoreReveal";
import { useToast } from "@/hooks/useToast";

type StageShellProps = {
  children: React.ReactNode;
  score?: number;
  feedback?: string;
  isLoading?: boolean;
  error?: string;
  canAdvance?: boolean;
  advanceLabel?: string;
  onAdvance?: () => void;
};

/**
 * Wraps stage content with scoring panel and next button.
 */
export function StageShell({
  children,
  score,
  feedback,
  isLoading = false,
  error,
  canAdvance = false,
  advanceLabel = "Next Stage →",
  onAdvance,
}: StageShellProps): React.ReactElement {
  const { showToast } = useToast();
  const hadScoreRef = useRef(false);

  useEffect(() => {
    if (score !== undefined && feedback && !hadScoreRef.current) {
      hadScoreRef.current = true;
      showToast("Stage complete — score saved", "success");
    }
  }, [score, feedback, showToast]);

  useEffect(() => {
    if (error && error.length > 0) {
      showToast("Something went wrong. Please try again.", "error");
    }
  }, [error, showToast]);

  return (
    <>
      {children}
      {isLoading && (
        <p className="text-sm text-text-secondary animate-pulse mt-6">Scoring your work…</p>
      )}
      {error && (
        <p className="text-sm text-error border border-error/30 bg-error/5 rounded-md p-3 mt-4">
          {error}
        </p>
      )}
      {score !== undefined && feedback && (
        <StageScoreReveal
          score={score}
          feedback={feedback}
          advanceLabel={advanceLabel}
          onAdvance={canAdvance && onAdvance ? onAdvance : undefined}
        />
      )}
    </>
  );
}
