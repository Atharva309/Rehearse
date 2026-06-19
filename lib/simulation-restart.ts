/**
 * simulation-restart.ts
 * Helpers for restart redirect targets after resetting an attempt.
 */

import { DEFAULT_CLASS_ID } from "@/lib/constants";
import { isTempoDefaultSimulation } from "@/lib/tempo-simulation";

/**
 * Builds the post-restart URL — entry page for Tempo/default class, else stage runner.
 */
export function buildRestartRedirectHref(
  simulationId: string,
  classId: string,
  simulationTitle: string,
  newAttemptId: string
): string {
  if (classId === DEFAULT_CLASS_ID && isTempoDefaultSimulation(simulationId, simulationTitle)) {
    return `/student/simulation/${simulationId}/entry?classId=${classId}`;
  }
  return `/student/simulation/${simulationId}?classId=${classId}&attempt=${newAttemptId}`;
}
