/**
 * route.ts — /api/score
 * GPT-4o sales coach scoring for each simulation stage.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MAX_SCORE_TOKENS } from "@/lib/constants";
import {
  buildScoringPrompt,
  formatLeadGenAnswers,
  parseScoringResponse,
} from "@/lib/scoring";
import type { ScoreRequestBody, ScoreResponseBody, ScoringContext } from "@/types";

/**
 * Creates OpenAI client at request time (build-safe without env at compile).
 */
function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * Maps API request body to ScoringContext for prompt building.
 */
function toScoringContext(body: ScoreRequestBody): ScoringContext {
  const { simulationContext, stage } = body;
  return {
    stage,
    personaName: simulationContext.personaName,
    personaRole: simulationContext.personaRole,
    productName: simulationContext.productName?.trim() || "the product",
    productContext: simulationContext.productContext,
    transcript: body.transcript,
    pitchText: body.pitchText,
    studentAnswers: body.studentAnswers
      ? formatLeadGenAnswers(body.studentAnswers)
      : undefined,
    priorStagesSummary: body.priorStagesSummary,
  };
}

/**
 * Calls GPT-4o once with the scoring prompt.
 */
async function requestScore(
  openai: OpenAI,
  prompt: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: MAX_SCORE_TOKENS,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

/**
 * POST /api/score — returns numeric score and written feedback.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured." }, { status: 500 });
    }

    const body = (await req.json()) as ScoreRequestBody;
    const { stage, simulationContext } = body;

    if (!stage || !simulationContext) {
      return NextResponse.json({ error: "stage and simulationContext are required." }, { status: 400 });
    }

    console.log("[/api/score] scoring stage:", stage);

    const openai = createOpenAiClient(apiKey);
    const context = toScoringContext(body);
    const prompt = buildScoringPrompt(stage, context);

    let raw = await requestScore(openai, prompt);
    let parsed = parseScoringResponse(raw);

    if (!parsed) {
      raw = await requestScore(openai, prompt);
      parsed = parseScoringResponse(raw);
    }

    if (!parsed) {
      const fallback: ScoreResponseBody = {
        score: 0,
        feedback: "Scoring failed. Please try again.",
      };
      return NextResponse.json(fallback);
    }

    const payload: ScoreResponseBody = {
      score: parsed.score,
      feedback: parsed.feedback,
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Score route error:", error);
    const message = error instanceof Error ? error.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
