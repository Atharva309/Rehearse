/**
 * scoring.ts
 * Stage-specific GPT-4o scoring prompts and response parsing.
 */

import type { LeadGenAnswers, ScoringContext, SimulationStage } from "@/types";

export type ScoringResult = {
  score: number;
  feedback: string;
};

/**
 * Formats lead gen answers into a single block for the scoring prompt.
 */
export function formatLeadGenAnswers(answers: LeadGenAnswers): string {
  return `1. Is this prospect a good fit? Why?
${answers.fit}

2. What pain points do they likely have?
${answers.painPoints}

3. What is their opening approach?
${answers.openingApproach}`;
}

/**
 * Builds a stage-specific scoring prompt for GPT-4o.
 */
export function buildScoringPrompt(stage: SimulationStage, context: ScoringContext): string {
  const productName = context.productName?.trim() || "the product";
  const base = `You are an expert sales coach evaluating a student's sales training performance.
You must score strictly and honestly. Do not give high scores for poor performance.
A student who says nothing, talks nonsense, or is completely off-topic must score below 20.
A student who makes a genuine but weak attempt should score 40-60.
A student who performs well should score 70-85.
An exceptional performance scores 86-100.
Never default to 60. Score what you actually observe.

Return ONLY valid JSON in this exact format, nothing else:
{"score": <number 0-100>, "feedback": "<2-3 sentences of specific, actionable feedback>"}

Simulation context:
- Persona: ${context.personaName}, ${context.personaRole}
- Product being sold: ${productName}
- Product context: ${context.productContext}`;

  const studentAnswers =
    context.studentAnswers ??
    (context.leadGenAnswers ? formatLeadGenAnswers(context.leadGenAnswers) : "");

  const stages: Partial<Record<SimulationStage, string>> = {
    lead_gen: `
Stage: Lead Generation
The student was asked to qualify a prospect by answering three questions:
1. Is this prospect a good fit? Why?
2. What pain points do they likely have?
3. What is their opening approach?

Student's answers:
${studentAnswers}

Score based on:
- Accuracy of qualification (does the reasoning make sense for this persona?) — 40 points
- Quality of pain point identification (are the pain points realistic and specific?) — 30 points
- Strength of opening approach (is it relevant, personalised, not generic?) — 30 points

If answers are blank, one word, or nonsense: score 0-15.`,

    prospecting: `
Stage: Prospecting (Cold Call)
The student made a cold call to ${context.personaName}. Here is the full transcript:

${context.transcript ?? "(empty)"}

Score based on:
- Opening hook quality (did they grab attention in first 30 seconds?) — 25 points
- Clear value proposition (did they explain why they are calling?) — 25 points
- Handling brush-offs (did they handle resistance professionally?) — 25 points
- Securing a next step (did they try to book a follow-up or keep the conversation going?) — 25 points

If the transcript is empty or shows the student said nothing meaningful: score 0-10.
If the student talked but made no attempt to sell or qualify: score 10-30.`,

    discovery: `
Stage: Discovery
The student had a discovery conversation with ${context.personaName}. Full transcript:

${context.transcript ?? "(empty)"}

Score based on:
- Quality of questions asked (open-ended, specific, relevant?) — 30 points
- Did they uncover at least one genuine pain point? — 30 points
- Active listening (did they follow up on what ${context.personaName} said?) — 20 points
- Did they avoid pitching too early? — 20 points

If the transcript is empty or student said nothing: score 0-10.
If student only asked generic questions without digging deeper: score 20-40.`,

    presentation: `
Stage: Presentation / Pitch
The student wrote a pitch to ${context.personaName} for ${productName}. Here is the pitch:

${context.pitchText ?? "(empty)"}

Score based on:
- Did the pitch directly address pain points discovered in the discovery stage? — 30 points
- Clarity and structure (is it easy to follow?) — 25 points
- Specific product benefits mentioned (not generic claims) — 25 points
- Appropriate length and professionalism — 20 points

If the pitch is blank or fewer than 20 words: score 0.
If the pitch is generic and does not reference ${context.personaName}'s situation: score 15-35.`,

    objections: `
Stage: Objections
${context.personaName} raised objections and the student responded. Full transcript:

${context.transcript ?? "(empty)"}

Score based on:
- Empathy shown before responding (did they acknowledge the objection?) — 25 points
- Quality of reframe (did they turn the objection into a reason to buy?) — 30 points
- Use of evidence or specifics (did they back up their response?) — 25 points
- Did they keep the sale moving forward after each objection? — 20 points

If the transcript is empty or student said nothing: score 0-10.
If student only repeated their pitch without addressing the objection: score 15-30.`,

    close: `
Stage: Close
The student attempted to close the sale with ${context.personaName}. Full transcript:

${context.transcript ?? "(empty)"}

Score based on:
- Confidence and directness of the closing ask (did they actually ask for the sale?) — 30 points
- Handling of final hesitation (did they address last-minute concerns?) — 25 points
- Appropriate timing (did they close at the right moment?) — 25 points
- Professionalism and tone — 20 points

If the transcript is empty or student said nothing: score 0-10.
If student never actually asked for the sale: score 10-30.
If student asked clearly but handled objections poorly: score 40-60.`,
  };

  const stageBlock = stages[stage] ?? "";
  const prior =
    context.priorStagesSummary && context.priorStagesSummary.length > 0
      ? `\nPrior stages summary:\n${context.priorStagesSummary}`
      : "";

  return `${base}\n\n${stageBlock}${prior}`;
}

/**
 * Parses GPT JSON scoring output; clamps score to 0–100.
 */
export function parseScoringResponse(raw: string): ScoringResult | null {
  try {
    const parsed = JSON.parse(raw) as { score?: unknown; feedback?: unknown };
    if (typeof parsed.score !== "number" || typeof parsed.feedback !== "string") {
      return null;
    }
    const score = Math.min(100, Math.max(0, Math.round(parsed.score)));
    const feedback = parsed.feedback.trim();
    if (feedback.length === 0) {
      return null;
    }
    return { score, feedback };
  } catch {
    return null;
  }
}
