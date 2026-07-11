/**
 * tempo-badges.ts
 * Badge definitions and GPT-based detection for Tempo Discovery and Objection Handling.
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

export type DiscoveryBadgeId = (typeof DISCOVERY_BADGES)[number]["id"];
export type ObjectionBadgeId = (typeof OBJECTION_BADGES)[number]["id"];

export type TempoBadgeStage = "discovery" | "objections";

const MAX_BADGE_DETECTION_TOKENS = 400;

const DISCOVERY_BADGE_IDS: ReadonlySet<string> = new Set(
  DISCOVERY_BADGES.map((badge) => badge.id)
);

const OBJECTION_BADGE_IDS: ReadonlySet<string> = new Set(
  OBJECTION_BADGES.map((badge) => badge.id)
);

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
 * Returns the allowed badge ID set for a Tempo badge stage.
 */
function allowedBadgeIdsForStage(stage: TempoBadgeStage): ReadonlySet<string> {
  return stage === "discovery" ? DISCOVERY_BADGE_IDS : OBJECTION_BADGE_IDS;
}

/**
 * Returns the system prompt for a Tempo badge stage.
 */
function systemPromptForStage(stage: TempoBadgeStage): string {
  return stage === "discovery" ? buildDiscoveryBadgePrompt() : buildObjectionBadgePrompt();
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
 * Keeps only known badge IDs for the stage; drops duplicates and unknowns.
 */
function filterKnownBadgeIds(stage: TempoBadgeStage, ids: string[]): string[] {
  const allowed = allowedBadgeIdsForStage(stage);
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
  transcript: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: MAX_BADGE_DETECTION_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Call transcript:\n\n${transcript}`,
      },
    ],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

/**
 * Detects which Tempo badges were earned from a stage transcript.
 * Returns validated badge IDs, or [] on any failure (API error, bad JSON, empty transcript).
 *
 * @param stage - "discovery" or "objections"
 * @param transcript - full stage transcript text
 */
export async function detectTempoBadges(
  stage: TempoBadgeStage,
  transcript: string
): Promise<string[]> {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[tempo-badges] OPENAI_API_KEY not configured.");
    return [];
  }

  try {
    const openai = createOpenAiClient(apiKey);
    const systemPrompt = systemPromptForStage(stage);

    let raw = await requestBadgeDetection(openai, systemPrompt, trimmed);
    let parsed = parseBadgesResponse(raw);

    if (!parsed) {
      raw = await requestBadgeDetection(openai, systemPrompt, trimmed);
      parsed = parseBadgesResponse(raw);
    }

    if (!parsed) {
      console.error("[tempo-badges] Failed to parse badge response after retry.");
      return [];
    }

    return filterKnownBadgeIds(stage, parsed);
  } catch (error) {
    console.error("[tempo-badges] Detection failed:", error);
    return [];
  }
}
