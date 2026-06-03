/**
 * leaderboard.ts
 * Builds ranked leaderboard entries from attempts and profiles.
 */

import { scoreToGrade } from "@/lib/grades";
import type { LeaderboardEntry } from "@/types";

export type LeaderboardAttemptRow = {
  id: string;
  student_id: string;
  total_score: number;
  completed_at?: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

/**
 * Medal prefix for ranks 1–3.
 */
export function formatRankDisplay(rank: number): string {
  if (rank === 1) return "🥇 1";
  if (rank === 2) return "🥈 2";
  if (rank === 3) return "🥉 3";
  return String(rank);
}

/**
 * Maps Supabase join rows to sorted leaderboard entries.
 */
export function buildLeaderboard(attempts: LeaderboardAttemptRow[]): LeaderboardEntry[] {
  const sorted = [...attempts].sort((a, b) => b.total_score - a.total_score);
  return sorted.map((row, index) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: index + 1,
      student_id: row.student_id,
      student_name: profile?.full_name?.trim() || "Student",
      total_score: row.total_score,
      grade: scoreToGrade(row.total_score),
      attempt_id: row.id,
      completed_at: row.completed_at ?? null,
    };
  });
}

/**
 * Top N entries plus current student row if outside top N.
 */
export function buildStudentLeaderboardRows(
  entries: LeaderboardEntry[],
  highlightStudentId: string,
  topN: number
): { topRows: LeaderboardEntry[]; showSeparator: boolean; currentRow: LeaderboardEntry | null } {
  const topRows = entries.slice(0, topN);
  const inTop = topRows.some((e) => e.student_id === highlightStudentId);
  if (inTop) {
    return { topRows, showSeparator: false, currentRow: null };
  }
  const currentRow = entries.find((e) => e.student_id === highlightStudentId) ?? null;
  return { topRows, showSeparator: currentRow !== null, currentRow };
}
