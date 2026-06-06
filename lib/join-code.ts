/**
 * join-code.ts
 * Generates unique human-readable 6-character join codes for classes.
 * Excludes visually confusable characters (0, O, 1, I, L).
 */

import { JOIN_CODE_LENGTH } from "@/lib/constants";

const JOIN_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Returns a random join code of JOIN_CODE_LENGTH characters.
 */
export function generateJoinCode(): string {
  return Array.from(
    { length: JOIN_CODE_LENGTH },
    () => JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)]
  ).join("");
}
