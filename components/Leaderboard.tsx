/**
 * Leaderboard.tsx
 * Ranked table of student attempts for a simulation.
 */

"use client";

import type { LeaderboardEntry } from "@/types";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightStudentId?: string;
  emptyMessage?: string;
};

/**
 * Renders simulation leaderboard rows.
 */
export function Leaderboard({
  entries,
  highlightStudentId,
  emptyMessage = "No completed attempts yet.",
}: LeaderboardProps): React.ReactElement {
  if (entries.length === 0) {
    return <p className="text-text-secondary text-sm py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-sm card-surface overflow-hidden stitch-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Student</th>
          <th>Score</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((row) => {
          const isHighlight = row.student_id === highlightStudentId;
          return (
            <tr
              key={row.attempt_id}
              className={isHighlight ? "bg-accent/10" : "border-t border-border"}
            >
              <td className="px-4 py-3">{row.rank}</td>
              <td className="px-4 py-3 font-medium">{row.student_name}</td>
              <td className="px-4 py-3">{row.total_score}/600</td>
              <td className="px-4 py-3">{row.grade}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
