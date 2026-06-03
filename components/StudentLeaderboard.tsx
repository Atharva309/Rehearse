/**
 * StudentLeaderboard.tsx
 * Ranked table with medals, name column, and pinned current-student row.
 */

"use client";

import { LEADERBOARD_TOP_N } from "@/lib/constants";
import { buildStudentLeaderboardRows, formatRankDisplay } from "@/lib/leaderboard";
import type { LeaderboardEntry } from "@/types";

type StudentLeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightStudentId: string;
  emptyMessage?: string;
};

/**
 * Student results leaderboard — top 10 plus current user if not listed.
 */
export function StudentLeaderboard({
  entries,
  highlightStudentId,
  emptyMessage = "No students have completed this simulation yet.",
}: StudentLeaderboardProps): React.ReactElement {
  if (entries.length === 0) {
    return <p className="text-text-secondary text-sm py-8 text-center">{emptyMessage}</p>;
  }

  const { topRows, showSeparator, currentRow } = buildStudentLeaderboardRows(
    entries,
    highlightStudentId,
    LEADERBOARD_TOP_N
  );

  const renderRow = (row: LeaderboardEntry, isHighlight: boolean): React.ReactElement => (
    <tr
      key={row.attempt_id}
      className={`border-t border-border ${isHighlight ? "bg-accent/10 border-l-4 border-l-accent" : ""}`}
    >
      <td className="px-4 py-3 tabular-nums">{formatRankDisplay(row.rank)}</td>
      <td className={`px-4 py-3 ${isHighlight ? "font-bold text-text-primary" : "font-medium"}`}>
        {row.student_name}
      </td>
      <td className="px-4 py-3">{row.total_score}/600</td>
      <td className="px-4 py-3">{row.grade}</td>
    </tr>
  );

  return (
    <table className="w-full text-sm card-surface overflow-hidden stitch-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Score</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>
        {topRows.map((row) =>
          renderRow(row, row.student_id === highlightStudentId)
        )}
        {showSeparator && (
          <tr className="border-t border-border">
            <td colSpan={4} className="px-4 py-2 text-center text-text-secondary text-xs">
              …
            </td>
          </tr>
        )}
        {currentRow && renderRow(currentRow, true)}
      </tbody>
    </table>
  );
}
