/**
 * tempo-badges.ts
 * Badge definitions and GPT-based detection for Tempo stages.
 * Wired from POST /api/student/complete-stage; results stored in stage_scores.badges_earned.
 */

import OpenAI from "openai";

// ── Badge definitions (professor spec — IDs/names are final) ───

export const DISCOVERY_BADGES = [
  {
    id: "disc_business_issue",
    name: "Found the Business Issue",
    description: "Got to a measurable issue, not just a complaint",
  },
  {
    id: "disc_value_buyer",
    name: "Value from the Buyer",
    description: "Quantified value came from Dana, not the rep",
  },
  {
    id: "disc_personal_value",
    name: "Heard What She Didn't Say",
    description: "Surfaced Personal Value",
  },
  {
    id: "disc_opc",
    name: "Ran the OPC Play",
    description: "Visible Open-Probe-Confirm cadence",
  },
  {
    id: "disc_earned_right",
    name: "Earned the Right",
    description: "Opened with credibility, not a pitch",
  },
  {
    id: "disc_held_line",
    name: "Held the Discovery Line",
    description: "Didn't pitch early",
  },
] as const;

export const OBJECTION_BADGES = [
  {
    id: "obj_business_issue",
    name: "Back to the Business Issue",
    description: "Reconnected objections to the measurable issue",
  },
  {
    id: "obj_cost_value",
    name: "Cost into Value",
    description: "Re-anchored price on ROI",
  },
  {
    id: "obj_differentiated",
    name: "Made it Differentiated",
    description: "Defended on uniqueness, not discount",
  },
  {
    id: "obj_real_concern",
    name: "Found the Real Concern",
    description: "OPC to the root concern",
  },
  {
    id: "obj_acknowledged",
    name: "Acknowledged First",
    description: "Validated before responding",
  },
  {
    id: "obj_held_line",
    name: "Held the Line",
    description: "Didn't cave under pressure",
  },
] as const;

export const PROSPECTING_BADGES = [
  {
    id: "pros_guardrails",
    name: "Built Guardrails",
    description: "Built guardrails against AI fabrication",
  },
  {
    id: "pros_reusable_system",
    name: "Reusable System",
    description: "Designed a reusable system, not a one-off",
  },
  {
    id: "pros_directed_agent",
    name: "Directed the Agent",
    description: "Critiqued the AI's output rather than accepting it blindly",
  },
  {
    id: "pros_real_trigger",
    name: "Found a Real Trigger",
    description: "Found a credible, specific trigger event",
  },
  {
    id: "pros_business_issue_led",
    name: "Led with the Business Issue",
    description: "Led with a business issue, not features",
  },
] as const;

export const PRESENTATION_BADGES = [
  {
    id: "pres_tailored",
    name: "Tailored to Their Issues",
    description: "Tailored the pitch to specific uncovered issues",
  },
  {
    id: "pres_value_led",
    name: "Led with Value",
    description: "Led with value, not a feature dump",
  },
  {
    id: "pres_roi_quantified",
    name: "Quantified the ROI",
    description: "Quantified the ROI with real math",
  },
  {
    id: "pres_proof_point",
    name: "Used a Proof Point",
    description: "Used a relevant proof point",
  },
  {
    id: "pres_next_step",
    name: "Clear Next Step",
    description: "Made a clear next-step ask",
  },
  {
    id: "pres_ai_copilot",
    name: "Directed the AI Copilot",
    description: "Directed the AI copilot well, showed real critique",
  },
] as const;

export const NEGOTIATION_BADGES = [
  {
    id: "neg_defended_value",
    name: "Defended Value Before Price",
    description: "Defended value before discussing price",
  },
  {
    id: "neg_traded",
    name: "Traded, Didn't Concede",
    description: "Traded rather than caved on concessions",
  },
  {
    id: "neg_true_priority",
    name: "Found Their True Priority",
    description: "Identified Kim's real priority beyond price",
  },
  {
    id: "neg_protected_value",
    name: "Protected the Value",
    description: "Protected deal value/margin",
  },
  {
    id: "neg_closed_deal",
    name: "Closed the Deal",
    description: "Reached an agreed or partial close",
  },
] as const;

export type DiscoveryBadgeId = (typeof DISCOVERY_BADGES)[number]["id"];
export type ObjectionBadgeId = (typeof OBJECTION_BADGES)[number]["id"];
export type ProspectingBadgeId = (typeof PROSPECTING_BADGES)[number]["id"];
export type PresentationBadgeId = (typeof PRESENTATION_BADGES)[number]["id"];
export type NegotiationBadgeId = (typeof NEGOTIATION_BADGES)[number]["id"];

export type TempoBadgeStage =
  | "discovery"
  | "objections"
  | "prospecting"
  | "presentation"
  | "close";

/** Negotiation badges judged by GPT (neg_closed_deal is deterministic). */
const NEGOTIATION_GPT_BADGE_IDS = [
  "neg_defended_value",
  "neg_traded",
  "neg_true_priority",
  "neg_protected_value",
] as const;

const MAX_BADGE_DETECTION_TOKENS = 400;

const DISCOVERY_BADGE_IDS: ReadonlySet<string> = new Set(
  DISCOVERY_BADGES.map((badge) => badge.id)
);

const OBJECTION_BADGE_IDS: ReadonlySet<string> = new Set(
  OBJECTION_BADGES.map((badge) => badge.id)
);

const PROSPECTING_BADGE_IDS: ReadonlySet<string> = new Set(
  PROSPECTING_BADGES.map((badge) => badge.id)
);

const PRESENTATION_BADGE_IDS: ReadonlySet<string> = new Set(
  PRESENTATION_BADGES.map((badge) => badge.id)
);

const NEGOTIATION_BADGE_IDS: ReadonlySet<string> = new Set(
  NEGOTIATION_BADGES.map((badge) => badge.id)
);

const NEGOTIATION_GPT_ALLOWED_IDS: ReadonlySet<string> = new Set(NEGOTIATION_GPT_BADGE_IDS);

// ── Prompt builders ───

/**
 * Builds the Discovery badge-detection system prompt with full earn criteria.
 */
function buildDiscoveryBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Discovery call transcript between a student (rep) and Dana (buyer at Summit Dental).

Award a badge ONLY when the transcript clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
- disc_business_issue: the call reached a time-bound, measurable business issue (e.g. revenue lost to no-show rate at a specific scale) — not just a vague complaint
- disc_value_buyer: quantified numbers (no-show %, appointment value, hours lost) came from Dana being asked, not asserted by the rep
- disc_personal_value: the rep surfaced Dana's personal stake — not wanting to look bad to Dr. Kim, protecting staff from burnout
- disc_opc: visible Open -> Probe -> Confirm question cadence, not a flat checklist of closed questions
- disc_earned_right: the rep opened with brief credibility/framing rather than diving straight into questions or a pitch
- disc_held_line: the rep held off pitching Tempo features until the issue and value were understood

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["disc_business_issue","disc_opc"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Objection Handling badge-detection system prompt with full earn criteria.
 */
function buildObjectionBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Objection Handling call transcript between a student (rep) and Kim (buyer / decision-maker at Summit Dental).

Award a badge ONLY when the transcript clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
- obj_business_issue: the rep brought each objection back to Kim's measurable business issue rather than staying stuck on the surface complaint
- obj_cost_value: price pushback was reframed via ROI/value, not argued on price alone
- obj_differentiated: the rep showed why Tempo specifically (vs. SlotEasy/status quo) addresses the issue, not just asserted quality
- obj_real_concern: the rep used questions to find the ROOT concern behind a surface objection (e.g. "too expensive" -> ROI doubt) instead of rebutting immediately
- obj_acknowledged: the rep validated/acknowledged each concern before responding to it
- obj_held_line: the rep stayed composed and did not reflexively discount to make an objection go away

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["obj_acknowledged","obj_held_line"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Prospecting badge-detection system prompt with full earn criteria.
 */
function buildProspectingBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Prospecting stage submission (ICP fields, research notes, agent design, chatMessages with an AI research agent, trigger event, and draft opening message) for Summit Dental / Tempo.

Award a badge ONLY when the submission clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
- pros_guardrails: the submission (research notes / agent description) explicitly describes steps to verify claims or flag unverified AI output, not blind trust of whatever the AI produced
- pros_reusable_system: the described tool/approach is generalized (reusable for future prospects), not a one-off hardcoded lookup for this account only
- pros_directed_agent: the chatMessages log shows the student pushing back, correcting, or refining the AI's output — not just accepting the first response
- pros_real_trigger: the submitted trigger event is specific and credible (a real timing reason), not generic filler
- pros_business_issue_led: the draft opening message leads with a plausible business issue/pain, not a feature pitch

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["pros_real_trigger","pros_business_issue_led"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Presentation badge-detection system prompt with full earn criteria.
 */
function buildPresentationBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Presentation stage submission (JSON with a pitch form: businessIssue, value drivers, roiCalculation, proofPoint, nextStep, bothStakeholders, and AI work fields aiPrompts / aiOutput / aiRefinement) for Summit Dental / Tempo.

Award a badge ONLY when the submission clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Badge criteria (award the ID only if earned):
- pres_tailored: pitch content references specific details plausibly tied to discovery findings, not a generic templated pitch
- pres_value_led: value/outcome framing comes before or instead of a feature list
- pres_roi_quantified: actual ROI math/numbers appear, not just vague value claims
- pres_proof_point: a specific, relevant proof point (stat or case study) is used correctly
- pres_next_step: the pitch ends with one clear, specific next-step ask
- pres_ai_copilot: the AI Work section shows real prompts AND meaningful critique/editing of AI output — not blank or perfunctory ("used AI, it was fine")

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["pres_roi_quantified","pres_proof_point"]}

Use only the badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Builds the Negotiation GPT-judged badge prompt (excludes deterministic neg_closed_deal).
 */
function buildNegotiationGptBadgePrompt(): string {
  return `You are a sales coach evaluating a Tempo Negotiation (close) stage submission. The JSON includes scenarioA and scenarioB turn transcripts with Kim (buyer), plus optional aiWork.

Award a badge ONLY when the material clearly shows the criterion was met. Be strict — do not award on weak or ambiguous evidence. Prefer an empty list over false positives.

Do NOT judge whether a deal closed — that is handled separately. Only evaluate these four badges:

Badge criteria (award the ID only if earned):
- neg_defended_value: in Scenario A, the student resisted immediate discounting and reframed on ROI/value before any concession
- neg_traded: in Scenario B, the student proposed trades (gave something specific to get something specific) rather than pure concessions
- neg_true_priority: the student identified and addressed Kim's underlying priority (certainty the solution will work) rather than only negotiating surface price/terms
- neg_protected_value: the final agreed terms preserve real deal value/margin rather than reflexive full discounting

Return ONLY valid JSON in this exact shape, nothing else:
{"badgesEarned":["neg_defended_value","neg_traded"]}

Use only the four badge IDs listed above. If none were earned, return {"badgesEarned":[]}.`;
}

/**
 * Returns the allowed badge ID set for a Tempo badge stage.
 */
function allowedBadgeIdsForStage(stage: TempoBadgeStage): ReadonlySet<string> {
  switch (stage) {
    case "discovery":
      return DISCOVERY_BADGE_IDS;
    case "objections":
      return OBJECTION_BADGE_IDS;
    case "prospecting":
      return PROSPECTING_BADGE_IDS;
    case "presentation":
      return PRESENTATION_BADGE_IDS;
    case "close":
      return NEGOTIATION_BADGE_IDS;
  }
}

/**
 * Returns the GPT system prompt for stages judged entirely by the model.
 */
function systemPromptForStage(stage: Exclude<TempoBadgeStage, "close">): string {
  switch (stage) {
    case "discovery":
      return buildDiscoveryBadgePrompt();
    case "objections":
      return buildObjectionBadgePrompt();
    case "prospecting":
      return buildProspectingBadgePrompt();
    case "presentation":
      return buildPresentationBadgePrompt();
  }
}

// ── Parse / validate ───

/**
 * Parses GPT JSON for badgesEarned. Returns null if shape is invalid.
 */
function parseBadgesResponse(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw) as { badgesEarned?: unknown };
    if (!Array.isArray(parsed.badgesEarned)) {
      return null;
    }
    const ids: string[] = [];
    for (const item of parsed.badgesEarned) {
      if (typeof item === "string" && item.trim().length > 0) {
        ids.push(item.trim());
      }
    }
    return ids;
  } catch {
    return null;
  }
}

/**
 * Keeps only IDs present in allowed; drops duplicates and unknowns.
 */
function filterBadgeIds(allowed: ReadonlySet<string>, ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!allowed.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Keeps only known badge IDs for the stage; drops duplicates and unknowns.
 */
function filterKnownBadgeIds(stage: TempoBadgeStage, ids: string[]): string[] {
  return filterBadgeIds(allowedBadgeIdsForStage(stage), ids);
}

/**
 * True when Scenario B outcome is deal_agreed or partial_close
 * (same condition as tempoResultsDealWon success path; false on parse failure).
 */
function isNegotiationDealClosed(transcript: string): boolean {
  try {
    const data = JSON.parse(transcript) as {
      scenarioB?: { outcome?: { status?: string } };
    };
    const status = data.scenarioB?.outcome?.status;
    return status === "deal_agreed" || status === "partial_close";
  } catch {
    return false;
  }
}

// ── OpenAI call ───

/**
 * Creates OpenAI client at call time (build-safe without env at compile).
 */
function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * Requests one badge-detection completion from gpt-4o-mini.
 */
async function requestBadgeDetection(
  openai: OpenAI,
  systemPrompt: string,
  material: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: MAX_BADGE_DETECTION_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Evaluate the following material:\n\n${material}`,
      },
    ],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

/**
 * Runs GPT badge detection with retry-once parse and ID filtering.
 * Returns [] on any failure.
 */
async function runGptBadgeDetection(
  systemPrompt: string,
  material: string,
  allowedIds: ReadonlySet<string>
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[tempo-badges] OPENAI_API_KEY not configured.");
    return [];
  }

  try {
    const openai = createOpenAiClient(apiKey);

    let raw = await requestBadgeDetection(openai, systemPrompt, material);
    let parsed = parseBadgesResponse(raw);

    if (!parsed) {
      raw = await requestBadgeDetection(openai, systemPrompt, material);
      parsed = parseBadgesResponse(raw);
    }

    if (!parsed) {
      console.error("[tempo-badges] Failed to parse badge response after retry.");
      return [];
    }

    return filterBadgeIds(allowedIds, parsed);
  } catch (error) {
    console.error("[tempo-badges] Detection failed:", error);
    return [];
  }
}

/**
 * Negotiation: GPT-judges four behavioral badges; neg_closed_deal is deterministic.
 */
async function detectNegotiationBadges(transcript: string): Promise<string[]> {
  const gptBadges = await runGptBadgeDetection(
    buildNegotiationGptBadgePrompt(),
    transcript,
    NEGOTIATION_GPT_ALLOWED_IDS
  );

  const closed = isNegotiationDealClosed(transcript);
  if (!closed) {
    return filterKnownBadgeIds("close", gptBadges);
  }

  return filterKnownBadgeIds("close", [...gptBadges, "neg_closed_deal"]);
}

/**
 * Detects which Tempo badges were earned from a stage transcript/submission.
 * Returns validated badge IDs, or [] on any failure (API error, bad JSON, empty material).
 *
 * @param stage - discovery | objections | prospecting | presentation | close
 * @param transcript - stage transcript or JSON submission payload
 */
export async function detectTempoBadges(
  stage: TempoBadgeStage,
  transcript: string
): Promise<string[]> {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (stage === "close") {
    return detectNegotiationBadges(trimmed);
  }

  return runGptBadgeDetection(
    systemPromptForStage(stage),
    trimmed,
    allowedBadgeIdsForStage(stage)
  );
}
