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

/**
 * Returns true when a trimmed string has content.
 */
function filled(value: string): boolean {
  return value.trim().length > 0;
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
      return filled(form.businessIssue);
    case 2:
      return (
        filled(form.valueDriverNoShows) &&
        filled(form.valueDriverFrontDesk) &&
        filled(form.valueDriverAfterHours) &&
        filled(form.valueDriverRepeat)
      );
    case 3:
      return filled(form.roiCalculation);
    case 4:
      return filled(form.proofPoint);
    case 5:
      return filled(form.nextStep);
    case 6:
      return filled(form.bothStakeholders);
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
    form.aiPrompts.trim().length > 20 &&
    form.aiRefinement.trim().length > 20
  );
}

/**
 * True when AI work section meets submission requirements.
 */
export function isPresentationAiWorkComplete(form: PresentationForm): boolean {
  return form.aiPrompts.trim().length > 20 && form.aiRefinement.trim().length > 20;
}

/**
 * Parses Discovery stage score payload into summary fields for the reference panel.
 */
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
