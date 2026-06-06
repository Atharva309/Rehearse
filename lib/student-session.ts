/**
 * student-session.ts
 * JWT cookie-based session for students.
 * Students do not use Supabase auth.
 * Session lasts 7 days, stored in an httpOnly cookie.
 */

import { cookies } from "next/headers";
import { STUDENT_SESSION_COOKIE } from "@/lib/constants";
import {
  signStudentSessionToken,
  verifyStudentSessionToken,
} from "@/lib/student-session-crypto";
import type { StudentSession } from "@/types";

export { verifyStudentSessionToken } from "@/lib/student-session-crypto";

/**
 * Signs and stores the student session in an httpOnly cookie.
 */
export async function createStudentSession(data: StudentSession): Promise<void> {
  const token = await signStudentSessionToken(data);

  cookies().set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

/**
 * Reads and verifies the student session cookie, or null if absent/invalid.
 */
export async function getStudentSession(): Promise<StudentSession | null> {
  const cookie = cookies().get(STUDENT_SESSION_COOKIE);
  if (!cookie) {
    return null;
  }
  return verifyStudentSessionToken(cookie.value);
}

/**
 * Clears the student session cookie.
 */
export async function clearStudentSession(): Promise<void> {
  cookies().delete(STUDENT_SESSION_COOKIE);
}
