/**
 * RestartSimulationButton.tsx
 * Always-visible restart button shown in the top right of all
 * simulation stage pages. Shows a confirmation modal before
 * abandoning the current attempt and starting fresh.
 * Used across all simulations, not just the Tempo simulation.
 */

"use client";

import { useRouter } from "next/navigation";
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
  /**
   * Where to redirect after restart.
   * Defaults to entry page for Tempo/default class, else simulation runner.
   */
  redirectHref?: string;
};

/**
 * Restarts the simulation after confirmation — abandons current attempt via API.
 */
export function RestartSimulationButton({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  redirectHref,
}: RestartSimulationButtonProps): React.ReactElement {
  const router = useRouter();
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
      showToast("Could not restart simulation. Please try again.", "error");
      setIsRestarting(false);
      return;
    }

    const data = (await res.json()) as RestartSimulationResponse;
    const href =
      redirectHref ??
      buildRestartRedirectHref(simulationId, classId, simulationTitle, data.newAttemptId);

    router.push(href);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-on-surface-variant font-label-sm text-label-sm border border-outline-variant rounded-lg hover:bg-surface-container hover:text-error hover:border-error transition-all duration-150"
      >
        <MaterialIcon name="restart_alt" className="text-[16px]" />
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
