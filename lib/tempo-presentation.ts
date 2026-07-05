/**
 * tempo-presentation.ts
 * Types, copy, and helpers for Tempo Stage 3 Presentation (default class only).
 */

import type { DiscoverySummaryForm } from "@/lib/tempo-discovery";

export type PresentationForm = {
  businessIssue: string;
  valueDriverNoShows: string;
  valueDriverFrontDesk: string;
  valueDriverAfterHours: string;
  valueDriverRepeat: string;
  roiCalculation: string;
  proofPoint: string;
  nextStep: string;
  bothStakeholders: string;
  aiPrompts: string;
  aiOutput: string;
  aiRefinement: string;
};

export const EMPTY_PRESENTATION_FORM: PresentationForm = {
  businessIssue: "",
  valueDriverNoShows: "",
  valueDriverFrontDesk: "",
  valueDriverAfterHours: "",
  valueDriverRepeat: "",
  roiCalculation: "",
  proofPoint: "",
  nextStep: "",
  bothStakeholders: "",
  aiPrompts: "",
  aiOutput: "",
  aiRefinement: "",
};

export type PresentationStageData = {
  presentation?: PresentationForm;
};

export const PRESENTATION_SECTIONS = [
  { number: 1, title: "Restate the Business Issue", field: "businessIssue" as const },
  { number: 2, title: "Map Value Drivers", field: "valueDrivers" as const },
  { number: 3, title: "Quantify the ROI", field: "roiCalculation" as const },
  { number: 4, title: "Include a Proof Point", field: "proofPoint" as const },
  { number: 5, title: "Next Step Ask", field: "nextStep" as const },
  { number: 6, title: "Speak to Both Stakeholders", field: "bothStakeholders" as const },
] as const;

export const VALUE_DRIVER_CARDS = [
  {
    field: "valueDriverNoShows" as const,
    color: "border-l-tertiary-container",
    labelColor: "text-tertiary-container",
    label: "Efficiency",
    title: "Cut No-Shows",
  },
  {
    field: "valueDriverFrontDesk" as const,
    color: "border-l-primary-container",
    labelColor: "text-primary-container",
    label: "Productivity",
    title: "Free Front Desk",
  },
  {
    field: "valueDriverAfterHours" as const,
    color: "border-l-green-600",
    labelColor: "text-green-600",
    label: "Availability",
    title: "After-Hours",
  },
  {
    field: "valueDriverRepeat" as const,
    color: "border-l-amber-600",
    labelColor: "text-amber-600",
    label: "Retention",
    title: "Repeat Visits",
  },
] as const;

export const TEMPO_REFERENCE_SECTIONS = [
  {
    label: "Proof Points",
    content: [
      "~35% drop in no-shows within 90 days",
      "~6 hours/week saved per front desk location",
      "Front Range Vet Partners: 19% → 11% no-shows",
    ],
  },
  {
    label: "Pricing Model",
    content: [
      "Starter: $99/location/month",
      "Pro: $179/location/month",
      "Annual: ~15% off",
      "Onboarding: $500/location",
    ],
  },
  {
    label: "Competitor Matrix",
    content: [
      "SlotEasy: $59, reminders only",
      "Status quo: hides true cost",
      "BookSuite: too complex",
    ],
  },
] as const;

const STORAGE_PREFIX = "tempo-presentation-";
const MIN_FIELD_LENGTH = 6;
const MIN_AI_FIELD_LENGTH = 6;

/**
 * Returns true when a trimmed string meets the minimum length.
 */
function minFilled(value: string, minLen = MIN_FIELD_LENGTH): boolean {
  return value.trim().length >= minLen;
}

/**
 * Returns true when section N has required content filled.
 */
export function isPresentationSectionComplete(
  sectionNumber: number,
  form: PresentationForm
): boolean {
  switch (sectionNumber) {
    case 1:
      return minFilled(form.businessIssue);
    case 2:
      return (
        minFilled(form.valueDriverNoShows) &&
        minFilled(form.valueDriverFrontDesk) &&
        minFilled(form.valueDriverAfterHours) &&
        minFilled(form.valueDriverRepeat)
      );
    case 3:
      return minFilled(form.roiCalculation);
    case 4:
      return minFilled(form.proofPoint);
    case 5:
      return minFilled(form.nextStep);
    case 6:
      return minFilled(form.bothStakeholders);
    default:
      return false;
  }
}

/**
 * Counts how many of the six main sections are complete.
 */
export function countCompletedPresentationSections(form: PresentationForm): number {
  return PRESENTATION_SECTIONS.filter((s) =>
    isPresentationSectionComplete(s.number, form)
  ).length;
}

/**
 * True when all six sections and required AI work fields are filled.
 */
export function canSubmitPresentation(form: PresentationForm): boolean {
  return (
    countCompletedPresentationSections(form) === 6 &&
    minFilled(form.aiPrompts, MIN_AI_FIELD_LENGTH) &&
    minFilled(form.aiRefinement, MIN_AI_FIELD_LENGTH)
  );
}

/**
 * True when AI work section meets submission requirements.
 */
export function isPresentationAiWorkComplete(form: PresentationForm): boolean {
  return (
    minFilled(form.aiPrompts, MIN_AI_FIELD_LENGTH) &&
    minFilled(form.aiRefinement, MIN_AI_FIELD_LENGTH)
  );
}

/**
 * Short footer hint explaining what still blocks submission.
 */
export function getPresentationSubmitHint(form: PresentationForm): string {
  const completed = countCompletedPresentationSections(form);
  if (completed < 6) {
    return `${completed} of 6 sections complete — finish all sections to submit.`;
  }
  if (!isPresentationAiWorkComplete(form)) {
    return "All 6 sections done — expand “Show Your AI Work” and fill in your prompt and refinement.";
  }
  return "Great! You're ready to submit.";
}

/**
 * Parses Stage 3 presentation form from a stage_scores transcript JSON blob.
 */
export function parsePresentationFormFromTranscript(
  transcript: string | null | undefined
): PresentationForm | null {
  if (!transcript?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(transcript) as { form?: PresentationForm };
    return parsed.form ?? null;
  } catch {
    return null;
  }
}

export function parseDiscoverySummaryFromTranscript(
  transcript: string | null | undefined
): Partial<DiscoverySummaryForm> {
  if (!transcript?.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(transcript) as { postCallSummary?: Partial<DiscoverySummaryForm> };
    return parsed.postCallSummary ?? {};
  } catch {
    return {};
  }
}

/**
 * Saves presentation draft to localStorage.
 */
export function savePresentationToStorage(attemptId: string, form: PresentationForm): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${attemptId}`, JSON.stringify(form));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Loads presentation draft from localStorage.
 */
export function loadPresentationFromStorage(attemptId: string): PresentationForm | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${attemptId}`);
    if (!raw) {
      return null;
    }
    return { ...EMPTY_PRESENTATION_FORM, ...JSON.parse(raw) } as PresentationForm;
  } catch {
    return null;
  }
}

/**
 * Clears presentation draft from localStorage (e.g. on simulation restart).
 */
export function clearPresentationFromStorage(attemptId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${attemptId}`);
  } catch {
    /* ignore */
  }
}
