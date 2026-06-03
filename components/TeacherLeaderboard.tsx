/**
 * TeacherLeaderboard.tsx
 * Leaderboard tab with export CSV and expandable student rows.
 */

"use client";

import { Fragment, useState } from "react";
import { STAGE_LABELS, SCORED_STAGES } from "@/lib/constants";
import { downloadLeaderboardCsv, type CsvExportRow } from "@/lib/export-leaderboard-csv";
import { formatRankDisplay } from "@/lib/leaderboard";
import { stageScoreTone, toneTextClass } from "@/lib/score-display";
import type { LeaderboardEntry, StageScore } from "@/types";

type TeacherLeaderboardProps = {
  entries: LeaderboardEntry[];
  stageScoresByAttempt: Record<string, StageScore[]>;
  emptyMessage?: string;
};

/**
 * Teacher results leaderboard with CSV export and row expansion.
 */
export function TeacherLeaderboard({
  entries,
  stageScoresByAttempt,
  emptyMessage = "No students have completed this simulation yet.",
}: TeacherLeaderboardProps): React.ReactElement {
  const [expanded, setExpanded] = useState<string | null>(null);

  const csvRows: CsvExportRow[] = entries.map((e) => ({
    ...e,
    stage_scores: stageScoresByAttempt[e.attempt_id] ?? [],
  }));

  const handleExport = (): void => {
    downloadLeaderboardCsv(csvRows);
  };

  if (entries.length === 0) {
    return <p className="text-text-secondary text-sm py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button type="button" onClick={handleExport} className="btn-accent text-sm">
          Export CSV
        </button>
      </div>
      <table className="w-full text-sm card-surface overflow-hidden stitch-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student Name</th>
            <th>Score</th>
            <th>Grade</th>
            <th>Date Completed</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => {
            const scores = stageScoresByAttempt[row.attempt_id] ?? [];
            const dateLabel = row.completed_at
              ? new Date(row.completed_at).toLocaleDateString()
              : "—";
            return (
              <Fragment key={row.attempt_id}>
                <tr
                  className="border-t border-border cursor-pointer hover:bg-surface/80"
                  onClick={() => setExpanded(expanded === row.attempt_id ? null : row.attempt_id)}
                >
                  <td className="tabular-nums">{formatRankDisplay(row.rank)}</td>
                  <td className="font-medium text-text-primary">{row.student_name}</td>
                  <td>{row.total_score}/600</td>
                  <td>{row.grade}</td>
                  <td className="text-text-secondary">{dateLabel}</td>
                </tr>
                {expanded === row.attempt_id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 bg-surface">
                      <div className="space-y-3">
                        {SCORED_STAGES.map((stage) => {
                          const sc = scores.find((s) => s.stage === stage);
                          const tone = sc ? stageScoreTone(sc.score) : null;
                          return (
                            <div key={stage} className="text-xs">
                              <strong className="text-text-primary">{STAGE_LABELS[stage]}</strong>
                              :{" "}
                              {sc ? (
                                <span className={toneTextClass(tone!)}>{sc.score}/100</span>
                              ) : (
                                "—"
                              )}
                              {sc?.feedback && (
                                <p className="text-text-secondary mt-1">{sc.feedback}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
