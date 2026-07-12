/**
 * tempo-crm-fields.ts
 * Single source of truth for Tempo CRM opportunity log field schemas.
 * Gate logic uses stageRequiresCrmLog() — stages with no schema are never gated.
 */

export type CrmStageFieldDef = {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  prefix?: string;
};

export const CRM_STAGE_FIELD_SCHEMA: Record<
  "prospecting" | "discovery" | "presentation" | "objections" | "close",
  CrmStageFieldDef[]
> = {
  prospecting: [
    {
      key: "accountName",
      label: "Account Name",
      placeholder: "e.g. Summit Dental Group",
    },
    {
      key: "primaryContact",
      label: "Primary Contact",
      placeholder: "e.g. Dana Reyes, Practice Manager",
    },
    {
      key: "whyFit",
      label: "Why This Account Is a Fit",
      placeholder: "Why does Summit Dental match your ICP?",
      multiline: true,
    },
    {
      key: "trigger",
      label: "Trigger Event",
      placeholder: "e.g. Opening an 8th location next quarter",
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "e.g. Book discovery call with Dana",
    },
  ],
  discovery: [
    {
      key: "businessIssue",
      label: "Business Issue Identified",
      placeholder: "e.g. Inefficient scheduling workflow",
    },
    {
      key: "quantifiedValue",
      label: "Quantified Value, if known",
      placeholder: "0.00",
      prefix: "$",
    },
    {
      key: "painPoints",
      label: "Key Pain Points",
      placeholder:
        "Describe the specific technical or operational hurdles the client is facing...",
      multiline: true,
    },
    {
      key: "stakeholders",
      label: "Other Stakeholders Involved",
      placeholder: "Comma separated names...",
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "Schedule follow-up demo",
    },
  ],
  presentation: [
    {
      key: "whatProposed",
      label: "What You Proposed",
      placeholder: "Summarize the Tempo offer you presented...",
      multiline: true,
    },
    {
      key: "stakeholderReaction",
      label: "Stakeholder Reaction",
      placeholder: "How did Dana / the team respond?",
      multiline: true,
    },
    {
      key: "anticipatedObjections",
      label: "Anticipated Objections",
      placeholder: "What pushback do you expect next?",
      multiline: true,
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "e.g. Objection-handling call with Dr. Kim",
    },
  ],
  objections: [
    {
      key: "objectionsRaised",
      label: "Objections Raised",
      placeholder: "List the objections Dr. Kim raised...",
      multiline: true,
    },
    {
      key: "howResolved",
      label: "How You Resolved Them",
      placeholder: "Describe how you handled each concern...",
      multiline: true,
    },
    {
      key: "remainingConcerns",
      label: "Remaining Concerns",
      placeholder: "Anything still open?",
      multiline: true,
    },
    {
      key: "nextStep",
      label: "Next Step",
      placeholder: "e.g. Move to commercial negotiation",
    },
  ],
  close: [
    {
      key: "termsDiscussed",
      label: "Terms Discussed",
      placeholder: "Pricing, seats, billing, onboarding...",
      multiline: true,
    },
    {
      key: "outcome",
      label: "Outcome",
      placeholder: "e.g. Deal agreed / Partial close / Walked",
    },
    {
      key: "closeNotes",
      label: "Close Notes",
      placeholder: "Final notes on the negotiation...",
      multiline: true,
    },
  ],
};

/** Field keys per stage — used by gate checks and badge/CRM consumers. */
export const CRM_STAGE_FIELDS: Record<string, string[]> = {
  prospecting: CRM_STAGE_FIELD_SCHEMA.prospecting.map((f) => f.key),
  discovery: CRM_STAGE_FIELD_SCHEMA.discovery.map((f) => f.key),
  presentation: CRM_STAGE_FIELD_SCHEMA.presentation.map((f) => f.key),
  objections: CRM_STAGE_FIELD_SCHEMA.objections.map((f) => f.key),
  close: CRM_STAGE_FIELD_SCHEMA.close.map((f) => f.key),
};

/** Ordered Tempo CRM stages for “most recently completed” gate checks. */
export const CRM_TEMPO_STAGE_ORDER = [
  "prospecting",
  "discovery",
  "presentation",
  "objections",
  "close",
] as const;

/**
 * True when this stage has a non-empty CRM field schema (must be logged before advancing).
 */
export function stageRequiresCrmLog(stage: string): boolean {
  return stage in CRM_STAGE_FIELDS && CRM_STAGE_FIELDS[stage].length > 0;
}

/**
 * Maps HandoffModal “up next” stage number (1–5) to the just-completed stage that may need a CRM log.
 * Stage 1 (Prospecting intro) has no prior stage → null (no gate).
 */
export function justCompletedStageForHandoff(stageNumber: number): string | null {
  const idx = stageNumber - 2;
  if (idx < 0 || idx >= CRM_TEMPO_STAGE_ORDER.length) {
    return null;
  }
  return CRM_TEMPO_STAGE_ORDER[idx];
}

/**
 * Most recent completed schema stage that still lacks a CRM log row, or null.
 */
export function findStageNeedingCrmLog(
  completedStages: readonly string[],
  loggedStages: ReadonlySet<string>
): string | null {
  let needing: string | null = null;
  for (const stage of CRM_TEMPO_STAGE_ORDER) {
    if (
      completedStages.includes(stage) &&
      stageRequiresCrmLog(stage) &&
      !loggedStages.has(stage)
    ) {
      needing = stage;
    }
  }
  return needing;
}
