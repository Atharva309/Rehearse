/**
 * tempo-results.ts
 * Helpers for Tempo simulation results — grades, stage config, deal outcome parsing.
 * Used on the student complete page (default class only).
 */

import type { SimulationStage, StageScore } from "@/types";

export const TEMPO_RESULTS_MAX_SCORE = 500;
export const TEMPO_RESULTS_STAGE_MAX = 100;

export type TempoResultsStageConfig = {
  id: SimulationStage;
  label: string;
  icon: string;
  modality: string;
  modalityColor: string;
  borderColor: string;
};

export const TEMPO_RESULTS_STAGE_CONFIG: TempoResultsStageConfig[] = [
  {
    id: "prospecting",
    label: "Prospecting",
    icon: "search",
    modality: "Structured Submission",
    modalityColor: "bg-surface-container text-on-surface-variant",
    borderColor: "border-l-secondary",
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: "record_voice_over",
    modality: "Live Voice Call",
    modalityColor: "bg-secondary-fixed text-secondary",
    borderColor: "border-l-tertiary-container",
  },
  {
    id: "presentation",
    label: "Presentation",
    icon: "present_to_all",
    modality: "Structured Submission",
    modalityColor: "bg-surface-container text-on-surface-variant",
    borderColor: "border-l-secondary",
  },
  {
    id: "objections",
    label: "Objection Handling",
    icon: "shield",
    modality: "Live Voice Call",
    modalityColor: "bg-secondary-fixed text-secondary",
    borderColor: "border-l-tertiary",
  },
  {
    id: "close",
    label: "Negotiation",
    icon: "handshake",
    modality: "Written Scenarios",
    modalityColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    borderColor: "border-l-tertiary-container",
  },
];

type NegotiationTranscriptPayload = {
  scenarioA?: { outcome?: { status?: string } | null };
  scenarioB?: { outcome?: { status?: string } | null };
};

/**
 * Letter grade from percentage (0–100) on Tempo results scale.
 */
export function tempoResultsGradeFromPercent(pct: number): string {
  if (pct >= 90) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 55) return "C";
  if (pct >= 50) return "C-";
  if (pct >= 45) return "D+";
  if (pct >= 40) return "D";
  return "F";
}

/**
 * Tailwind classes for grade badge backgrounds.
 */
export function tempoResultsGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-tertiary-fixed text-on-tertiary-fixed";
  if (grade.startsWith("B")) return "bg-secondary-fixed text-secondary";
  if (grade.startsWith("C")) return "bg-surface-container text-on-surface-variant";
  return "bg-error-container text-error";
}

/**
 * Splits a stage score into substance/style placeholder bars (60/40).
 */
export function tempoResultsSubstanceStyle(score: number): {
  substance: number;
  style: number;
  substanceMax: number;
  styleMax: number;
} {
  return {
    substance: Math.round(score * 0.6),
    style: Math.round(score * 0.4),
    substanceMax: 60,
    styleMax: 40,
  };
}

/**
 * Parses negotiation (close) stage transcript for deal won/lost.
 */
export function tempoResultsDealWon(closeStageScore: StageScore | undefined): boolean {
  if (!closeStageScore?.transcript?.trim()) {
    return true;
  }
  try {
    const data = JSON.parse(closeStageScore.transcript) as NegotiationTranscriptPayload;
    const scenarioB = data.scenarioB?.outcome?.status;
    return scenarioB === "deal_agreed" || scenarioB === "partial_close";
  } catch {
    return true;
  }
}

/**
 * Sums Tempo stage scores (5 playable stages).
 */
export function tempoResultsTotalScore(stageScores: StageScore[]): number {
  const stageIds = new Set(TEMPO_RESULTS_STAGE_CONFIG.map((s) => s.id));
  return stageScores
    .filter((s) => stageIds.has(s.stage))
    .reduce((sum, s) => sum + (s.score ?? 0), 0);
}

/**
 * Formats elapsed time between attempt start and completion.
 */
export function tempoResultsDurationLabel(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined
): string {
  if (!startedAt || !completedAt) {
    return "—";
  }
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) {
    return "—";
  }
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const TEMPO_MANAGER_NOTE_WON =
  '"Good work closing Summit Dental.\n\nYou identified the right business issue and built a credible ROI case — Dana responded well to that. Your objection handling showed composure under pressure from Dr. Kim, and you protected the deal value in negotiation without giving away margin unnecessarily.\n\nWork to improve: Surface the personal driver earlier in discovery. Dana\'s staff burnout concern was there to find — and students who find it outscore those who don\'t.\n\nOverall: a solid first close. Summit Dental is on the books."';

export const TEMPO_MANAGER_NOTE_LOST =
  '"Summit Dental walked away at the negotiation stage.\n\nThe numbers were there — you found the business issue and built a reasonable case. What broke down was the negotiation: caving on price before defending value lost Dr. Kim\'s respect and the deal.\n\nNext time: hold your ground. Re-anchor on the ROI before you discuss discounting. Kim respects confidence more than flexibility.\n\nA deal lost is a deal to learn from. Come back stronger."';
