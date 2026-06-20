/**
 * RestartSimulationButton.tsx
 * Always-visible restart button shown in the top right of all
 * simulation stage pages. Shows a confirmation modal before
 * clearing progress and resetting to stage 1.
 * Used across all simulations, not just the Tempo simulation.
 */

"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/useToast";
import { buildRestartRedirectHref } from "@/lib/simulation-restart";
import type { RestartSimulationResponse } from "@/types";

type RestartSimulationButtonProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  /** Light styling for dark hero backgrounds (e.g. Tempo entry page). */
  variant?: "default" | "onDark" | "tempoBlack";
  /**
   * Where to redirect after restart.
   * Defaults to entry page for Tempo/default class, else simulation runner.
   */
  redirectHref?: string;
};

/**
 * Restarts the simulation after confirmation — clears scores and resets via API.
 */
export function RestartSimulationButton({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  variant = "default",
  redirectHref,
}: RestartSimulationButtonProps): React.ReactElement {
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = async (): Promise<void> => {
    setIsRestarting(true);

    const res = await fetch("/api/student/simulation/restart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, simulationId, classId }),
    });

    if (!res.ok) {
      let message = "Could not restart simulation. Please try again.";
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) {
          message = body.error;
        }
      } catch {
        /* ignore parse errors */
      }
      showToast(message, "error");
      setIsRestarting(false);
      setShowConfirm(false);
      return;
    }

    const data = (await res.json()) as RestartSimulationResponse;
    const href =
      redirectHref ??
      buildRestartRedirectHref(simulationId, classId, simulationTitle, data.newAttemptId);

    // Full navigation so stage state reloads from the server (same attempt id after reset).
    window.location.assign(href);
  };

  const buttonClass =
    variant === "tempoBlack"
      ? "flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-label-sm text-tertiary-container bg-black border border-tertiary-container rounded-md hover:bg-tertiary-container hover:text-black transition-all duration-150 shrink-0"
      : variant === "onDark"
        ? "flex items-center gap-1.5 px-3 py-1.5 text-white font-label-sm text-label-sm border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/60 transition-all duration-150 shrink-0"
        : "flex items-center gap-1.5 px-3 py-1.5 text-text-secondary font-label-sm text-label-sm border border-border rounded-lg bg-page hover:bg-surface hover:text-error hover:border-error transition-all duration-150 shrink-0";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={buttonClass}
      >
        <MaterialIcon name="restart_alt" className={variant === "tempoBlack" ? "text-[13px]" : "text-[16px]"} />
        Restart
      </button>

      {showConfirm && (
        <ConfirmModal
          title="Restart simulation?"
          message="This will abandon your current progress and scores. You'll start from the beginning with a fresh attempt."
          confirmLabel="Restart"
          isDestructive
          isConfirming={isRestarting}
          confirmingLabel="Restarting..."
          onConfirm={() => void handleRestart()}
          onCancel={() => {
            if (!isRestarting) {
              setShowConfirm(false);
            }
          }}
        />
      )}
    </>
  );
}
