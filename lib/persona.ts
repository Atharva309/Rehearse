/**
 * persona.ts
 * Generic persona prompt helpers for teacher forms and voice fallbacks.
 * Simulation-specific prompts live in the simulations table.
 */

/**
 * Generic fallback when no persona_system_prompt is provided (legacy /api/chat default).
 */
export const CHAT_SYSTEM_PROMPT = `You are a business persona in a sales training simulation.
You speak in short, realistic sentences — no more than 2-3 sentences per response.
You are NOT a chatbot. You are a real person on a quick call. Never break character.
Stay practical, slightly skeptical of vague pitches, and protect your own business interests.`;

/**
 * Builds a default opening line using the simulation persona name when available.
 */
export function buildDefaultOpeningGreeting(personaName?: string): string {
  const name = personaName?.trim();
  if (name) {
    return `Yeah? I'm ${name} — what do you need?`;
  }
  return "Yeah? I've got customers—what do you need?";
}
