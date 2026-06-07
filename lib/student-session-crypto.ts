/**
 * student-session-crypto.ts
 * JWT sign/verify helpers for student sessions (edge-safe — no next/headers).
 */

import { SignJWT, jwtVerify } from "jose";
import { STUDENT_SESSION_DAYS } from "@/lib/constants";
import type { StudentSession } from "@/types";

function getSessionSecret(): Uint8Array {
  const secret = process.env.STUDENT_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing STUDENT_SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a student session payload into a JWT string.
 */
export async function signStudentSessionToken(data: StudentSession): Promise<string> {
  return new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${STUDENT_SESSION_DAYS}d`)
    .sign(getSessionSecret());
}

/**
 * Verifies a JWT token string and returns the session payload.
 */
function parseStudentSessionPayload(payload: Record<string, unknown>): StudentSession | null {
  const { studentId, username, displayName } = payload;
  if (
    typeof studentId !== "string" ||
    typeof username !== "string" ||
    typeof displayName !== "string"
  ) {
    return null;
  }
  return { studentId, username, displayName };
}

export async function verifyStudentSessionToken(token: string): Promise<StudentSession | null> {
  if (!process.env.STUDENT_SESSION_SECRET) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return parseStudentSessionPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}
