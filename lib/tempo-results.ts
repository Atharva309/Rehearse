/**
 * tempo-results.ts
 * Helpers for Tempo simulation results — grades, stage config, deal outcome parsing.
 * Used on the student complete page (default class only).
 */

import type { LeaderboardEntry, SimulationStage, StageScore } from "@/types";

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

export const TEMPO_MANAGER_NOTE_PARTIAL =
  '"You got Summit Dental to a partial agreement — that is progress, but not a clean close.\n\nYou held value better in Scenario A than many students, but Scenario B left terms open: billing structure and onboarding scope still need alignment. Dr. Kim will come back to the table only if the next proposal feels decisive.\n\nWork to improve: Trade with confidence — every concession should buy a clear commitment. Kim respects structured packages over open-ended discounts.\n\nOverall: partial win. Tighten the final offer and push for signature next attempt."';

export type TempoTestResultsOutcome = "deal_agreed" | "partial_close" | "kim_walked";

export const TEMPO_TEST_RESULTS_OUTCOMES: {
  id: TempoTestResultsOutcome;
  label: string;
}[] = [
  { id: "deal_agreed", label: "Deal Agreed (strong win)" },
  { id: "partial_close", label: "Partial Close (mixed)" },
  { id: "kim_walked", label: "Kim Walked (deal lost)" },
];

function buildCloseTranscript(outcome: TempoTestResultsOutcome): string {
  const messages: Record<TempoTestResultsOutcome, string> = {
    deal_agreed:
      "Deal closed on Pro across 8 locations with annual billing and standard onboarding.",
    partial_close:
      "Partial agreement — annual billing accepted; onboarding scope and 9th location still open.",
    kim_walked: "Kim ended talks after early discounting without a structured trade package.",
  };

  return JSON.stringify({
    scenarioA: {
      outcome: {
        status: outcome === "kim_walked" ? "partial_close" : "deal_agreed",
        message: "Scenario A completed.",
      },
    },
    scenarioB: {
      outcome: { status: outcome, message: messages[outcome] },
    },
    aiWork: { prompts: "Test preview", corrections: "Test preview" },
    submittedAt: new Date().toISOString(),
  });
}

function mockStageScore(
  attemptId: string,
  stage: SimulationStage,
  score: number,
  feedback: string,
  transcript?: string
): StageScore {
  return {
    id: `test-${stage}`,
    attempt_id: attemptId,
    stage,
    score,
    feedback,
    transcript: transcript ?? null,
    completed_at: new Date().toISOString(),
  };
}

export type TempoTestResultsMock = {
  stageScores: StageScore[];
  dealWon: boolean;
  negotiationOutcome: TempoTestResultsOutcome;
  totalScore: number;
  grade: string;
  startedAt: string;
  completedAt: string;
};

/**
 * Prefilled Tempo results data for dashboard test preview links.
 */
export function buildTempoTestResultsMock(outcome: TempoTestResultsOutcome): TempoTestResultsMock {
  const attemptId = "test-results-preview";
  const completedAt = new Date().toISOString();
  const startedAt = new Date(Date.now() - 2 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString();

  const profiles: Record<
    TempoTestResultsOutcome,
    { scores: [number, number, number, number, number]; feedback: string[] }
  > = {
    deal_agreed: {
      scores: [98, 88, 94, 86, 96],
      feedback: [
        "Strong ICP fit and personalized outreach to Summit Dental.",
        "Uncovered no-show pain and front desk overload; could probe personal driver earlier.",
        "Clear ROI reframe tied to 8-location expansion.",
        "Acknowledged price concerns and held value without immediate discounting.",
        "Defended price in Scenario A; traded levers cleanly in Scenario B.",
      ],
    },
    partial_close: {
      scores: [78, 72, 80, 74, 68],
      feedback: [
        "Solid research but opening could be tighter on why-now.",
        "Found business issues but missed quantifying after-hours demand.",
        "Pitch connected to operations strain; ROI math was approximate.",
        "Handled adoption objection; price defense wavered late in the call.",
        "Partial terms agreed — onboarding and billing still unresolved.",
      ],
    },
    kim_walked: {
      scores: [62, 55, 48, 41, 28],
      feedback: [
        "Generic outreach — weak trigger event for the 8th location.",
        "Closed questions; did not surface Dana's staff burnout concern.",
        "Feature-heavy pitch without enough Summit-specific proof.",
        "Caved on discount request before reframing ROI.",
        "Kim walked after unstructured concessions in Scenario B.",
      ],
    },
  };

  const profile = profiles[outcome];
  const stages = TEMPO_RESULTS_STAGE_CONFIG.map((s) => s.id);
  const stageScores = stages.map((stage, i) =>
    mockStageScore(
      attemptId,
      stage,
      profile.scores[i],
      profile.feedback[i],
      stage === "close" ? buildCloseTranscript(outcome) : undefined
    )
  );

  const totalScore = tempoResultsTotalScore(stageScores);
  const grade = tempoResultsGradeFromPercent(
    Math.round((totalScore / TEMPO_RESULTS_MAX_SCORE) * 100)
  );

  return {
    stageScores,
    dealWon: outcome !== "kim_walked",
    negotiationOutcome: outcome,
    totalScore,
    grade,
    startedAt,
    completedAt,
  };
}

/**
 * Sample cohort leaderboard for results test preview.
 */
export function buildTempoTestLeaderboard(
  displayName: string,
  studentId: string,
  totalScore: number
): LeaderboardEntry[] {
  const peers = [
    { name: "Sarah Jenkins", score: 498 },
    { name: "Jordan Blake", score: 491 },
    { name: "Elena Rodriguez", score: 476 },
    { name: "David Kim", score: 451 },
    { name: "Sophie Chen", score: 440 },
  ];

  const all = [
    ...peers.map((p, i) => ({
      rank: i + 1,
      student_id: `peer-${i}`,
      student_name: p.name,
      total_score: p.score,
      grade: tempoResultsGradeFromPercent(Math.round((p.score / TEMPO_RESULTS_MAX_SCORE) * 100)),
      attempt_id: `peer-attempt-${i}`,
      completed_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    })),
    {
      rank: 0,
      student_id: studentId,
      student_name: displayName,
      total_score: totalScore,
      grade: tempoResultsGradeFromPercent(Math.round((totalScore / TEMPO_RESULTS_MAX_SCORE) * 100)),
      attempt_id: "test-results-preview",
      completed_at: new Date().toISOString(),
    },
  ]
    .sort((a, b) => b.total_score - a.total_score)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return all;
}

export function tempoResultsHeroSubtitle(outcome: TempoTestResultsOutcome | null, dealWon: boolean): string {
  if (outcome === "partial_close") {
    return "Partial terms agreed — some items still open before signature.";
  }
  if (dealWon) {
    return "Summit Dental Group is now a Tempo customer.";
  }
  return "Summit Dental Group did not sign the contract.";
}

export function tempoResultsManagerNote(
  outcome: TempoTestResultsOutcome | null,
  dealWon: boolean
): string {
  if (outcome === "partial_close") {
    return TEMPO_MANAGER_NOTE_PARTIAL;
  }
  return dealWon ? TEMPO_MANAGER_NOTE_WON : TEMPO_MANAGER_NOTE_LOST;
}
