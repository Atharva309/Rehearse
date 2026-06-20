/**
 * tempo-prospecting.ts
 * Constants and helpers for the Tempo Stage 1 Prospecting wizard
 * (Rehearse Essentials default class only).
 */

import type { ChatMessage } from "@/types";

export type ProspectingStepId =
  | "icp"
  | "research"
  | "qualification"
  | "trigger"
  | "opening";

export type ProspectingStepDefinition = {
  id: ProspectingStepId;
  label: string;
  description: string;
};

export const PROSPECTING_STEPS: readonly ProspectingStepDefinition[] = [
  { id: "icp", label: "ICP Definition", description: "Who does Tempo sell to?" },
  { id: "research", label: "AI Research", description: "Research Summit Dental" },
  { id: "qualification", label: "Qualification", description: "Does this account fit?" },
  { id: "trigger", label: "Trigger Event", description: "Why reach out now?" },
  { id: "opening", label: "Opening Message", description: "Write your outreach" },
] as const;

export const TEMPO_HANDOFF_MESSAGES = {
  prospecting: `Your outreach landed. Dana Reyes, Director of Operations at Summit Dental Group, has agreed to a 20-minute discovery call after seeing your message about their recent expansion. Before that call — I need you to put together your prospecting brief. Show me you've done your homework: who Tempo sells to, why Summit Dental fits, what triggered your outreach, and your opening message. No pitching yet. Just research and qualification. Good luck.`,

  discovery: `Your outreach landed. Dana Reyes has agreed to a 20-minute discovery call next Tuesday. You are not pitching yet — you are here to understand their world and find out whether there is a business issue worth solving. Be curious. Ask good questions. Listen more than you talk. Good luck.`,

  presentation: `Nice work — Dana wants you back to present to her and Dr. Kim next week. Here is what the team knows about Summit Dental: 8 dental practices, just opened their 8th, straining a manual phone-based scheduling setup. Front desk is overloaded, no-shows run about 1 in 6, they capture no after-hours demand, and Dana is under pressure from Dr. Kim to get operations right as they scale. Build them a pitch that connects to that business issue.`,

  objections: `You sent the proposal — Dr. Kim wants a call before he signs off. He has got concerns. Dana will be on, but Kim is the one to win over: he built this from one chair to eight locations and he is careful with money. Do not expect an easy yes, and do not fold the moment he pushes on price.`,

  negotiation: `You earned it — Kim is ready to talk terms. Dana will work the details with you. They want Pro across all 8 locations, Kim wants confidence it will deliver before committing, and price is on the table. Now build the mutual plan and close it.`,
} as const;

export type TempoHandoffStageKey = keyof typeof TEMPO_HANDOFF_MESSAGES;

export const TEMPO_HANDOFF_STAGE_META: Record<
  TempoHandoffStageKey,
  { stageNumber: number; stageName: string; stageIcon: string; hasAIRestriction: boolean }
> = {
  prospecting: {
    stageNumber: 1,
    stageName: "Prospecting",
    stageIcon: "search",
    hasAIRestriction: false,
  },
  discovery: {
    stageNumber: 2,
    stageName: "Discovery",
    stageIcon: "record_voice_over",
    hasAIRestriction: true,
  },
  presentation: {
    stageNumber: 3,
    stageName: "Presentation",
    stageIcon: "present_to_all",
    hasAIRestriction: false,
  },
  objections: {
    stageNumber: 4,
    stageName: "Objection Handling",
    stageIcon: "shield",
    hasAIRestriction: true,
  },
  negotiation: {
    stageNumber: 5,
    stageName: "Negotiation",
    stageIcon: "handshake",
    hasAIRestriction: false,
  },
};

export const TEMPO_RESEARCH_SYSTEM_PROMPT = `You are an AI research assistant helping a sales student research Summit Dental Group for a Tempo sales simulation. You have access to the following context:

ABOUT TEMPO: Scheduling software for appointment-based businesses. Key value: cut no-shows, free the front desk, capture after-hours demand, drive repeat visits. Pricing: Starter $99/location/month, Pro $179/location/month. Proof points: 35% drop in no-shows in 90 days, 6 hours/week saved per location, 20% of bookings happen outside hours.

ABOUT SUMMIT DENTAL: 8 dental practices in Colorado Front Range. Founded by Dr. Saul Kim. Just opened 8th location 3 months ago. Scheduling by phone. Director of Operations is Dana Reyes who reports to Dr. Kim.

Answer the student's questions about Summit Dental and the dental scheduling market. If you don't have verified information, say so clearly — flag uncertainty rather than fabricate. Keep responses concise and useful for sales research.`;

export const AUTO_RESEARCH_CARDS = [
  {
    id: "industry",
    icon: "factory",
    title: "Industry Context",
    content:
      "Dental practices average 15-20% no-show rates. Front desk staff spend 40-60% of time on phone scheduling. ~20% of appointment demand occurs outside business hours.",
  },
  {
    id: "account",
    icon: "account_balance",
    title: "Account Profile",
    content:
      "Summit Dental Group: 8 practices across Colorado Front Range. Founded by Dr. Saul Kim. Scheduling by phone via shared calendar. Opened 8th location 3 months ago.",
  },
  {
    id: "dm",
    icon: "person_search",
    title: "Decision Maker",
    content:
      "Dana Reyes, Director of Operations. Reports to Dr. Kim. Responsible for scheduling, staffing, and operational tools. 2 years in role — hired to get operations under control.",
  },
  {
    id: "competitors",
    icon: "swords",
    title: "Competitors",
    content:
      "SlotEasy (~$59/location, reminders only), status quo (phone/paper), BookSuite Enterprise (too complex). Tempo differentiation: rebooking engine + multi-location fit.",
  },
] as const;

export const SELF_CHECK_ITEMS = [
  { id: "wordCount", label: "Under 120 words" },
  { id: "trigger", label: "Mentioned specific trigger event" },
  { id: "businessIssue", label: "Led with their business issue, not product" },
  { id: "cta", label: "Clear and soft call to action" },
  { id: "professional", label: "Professional and specific tone" },
] as const;

export type ProspectingWizardState = {
  currentStep: number;
  icpField1: string;
  icpField2: string;
  chatMessages: ChatMessage[];
  researchNotes: string;
  fitJustification: string;
  dmName: string;
  dmRole: string;
  fitRating: string;
  confidence: string;
  triggerEvent: string;
  openingMessage: string;
  selfCheck: Record<string, boolean>;
  stretchOpen: boolean;
  agentDesign: string;
  agentCorrections: string;
  prospectingHandoffSeen: boolean;
};

export const DEFAULT_PROSPECTING_WIZARD_STATE: ProspectingWizardState = {
  currentStep: 0,
  icpField1: "",
  icpField2: "",
  chatMessages: [],
  researchNotes: "",
  fitJustification: "",
  dmName: "",
  dmRole: "",
  fitRating: "",
  confidence: "",
  triggerEvent: "",
  openingMessage: "",
  selfCheck: {},
  stretchOpen: false,
  agentDesign: "",
  agentCorrections: "",
  prospectingHandoffSeen: false,
};

const STORAGE_PREFIX = "rehearse-prospecting-wizard-";

/**
 * Reads wizard draft state from browser localStorage (fallback when DB column absent).
 */
export function loadProspectingWizardFromStorage(
  attemptId: string
): ProspectingWizardState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${attemptId}`);
    if (!raw) {
      return null;
    }
    return { ...DEFAULT_PROSPECTING_WIZARD_STATE, ...(JSON.parse(raw) as ProspectingWizardState) };
  } catch {
    return null;
  }
}

/**
 * Persists wizard draft state to browser localStorage.
 */
export function saveProspectingWizardToStorage(
  attemptId: string,
  state: ProspectingWizardState
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(`${STORAGE_PREFIX}${attemptId}`, JSON.stringify(state));
}

/**
 * Removes wizard draft state from browser localStorage (e.g. on simulation restart).
 */
export function clearProspectingWizardFromStorage(attemptId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(`${STORAGE_PREFIX}${attemptId}`);
}

/**
 * Counts words in the opening message draft.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/**
 * Returns whether the student can advance from the current wizard step.
 */
export function canAdvanceProspectingStep(
  stepIndex: number,
  state: ProspectingWizardState
): boolean {
  const minLen = 10;
  switch (stepIndex) {
    case 0:
      return state.icpField1.trim().length >= minLen && state.icpField2.trim().length >= minLen;
    case 1:
      return state.researchNotes.trim().length >= 20;
    case 2:
      return (
        state.fitJustification.trim().length >= minLen &&
        state.dmName.trim().length >= 2 &&
        state.dmRole.trim().length >= 2 &&
        Boolean(state.fitRating) &&
        Boolean(state.confidence)
      );
    case 3:
      return state.triggerEvent.trim().length >= 20;
    case 4:
      return canSubmitProspectingBrief(state);
    default:
      return false;
  }
}

/**
 * Returns whether Step 5 submit is enabled.
 */
export function canSubmitProspectingBrief(state: ProspectingWizardState): boolean {
  const words = countWords(state.openingMessage);
  if (words < 20 || words > 120) {
    return false;
  }
  const requiredChecks = SELF_CHECK_ITEMS.filter((item) => item.id !== "wordCount");
  return requiredChecks.every((item) => state.selfCheck[item.id]);
}
