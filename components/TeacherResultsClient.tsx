/**
 * TeacherResultsClient.tsx
 * Expandable attempt rows and leaderboard tab (Stitch table styling).
 */

"use client";

import { Fragment, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { TeacherLeaderboard } from "@/components/TeacherLeaderboard";
import { STAGE_LABELS, SCORED_STAGES } from "@/lib/constants";
import { scoreToGrade } from "@/lib/grades";
import { stageScoreTone, toneTextClass } from "@/lib/score-display";
import type { LeaderboardEntry, StageScore } from "@/types";

type AttemptRow = {
  id: string;
  student_id: string;
  total_score: number;
  status: string;
  started_at: string;
  profiles: { full_name: string } | null;
  stage_scores: StageScore[];
};

type TeacherResultsClientProps = {
  attempts: AttemptRow[];
  leaderboard: LeaderboardEntry[];
  stageScoresByAttempt: Record<string, StageScore[]>;
};

/**
 * Teacher results table with expandable stage detail and leaderboard tab.
 */
export function TeacherResultsClient({
  attempts,
  leaderboard,
  stageScoresByAttempt,
}: TeacherResultsClientProps): React.ReactElement {
  const [tab, setTab] = useState<"attempts" | "leaderboard">("attempts");
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedAttempts = attempts.filter((a) => a.status === "completed");

  return (
    <div>
      <div className="flex gap-8 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setTab("attempts")}
          className={`pb-3 text-sm ${tab === "attempts" ? "stitch-tab-active" : "stitch-tab-inactive"}`}
        >
          Student Attempts
        </button>
        <button
          type="button"
          onClick={() => setTab("leaderboard")}
          className={`pb-3 text-sm ${tab === "leaderboard" ? "stitch-tab-active" : "stitch-tab-inactive"}`}
        >
          Leaderboard
        </button>
      </div>

      {tab === "leaderboard" ? (
        <TeacherLeaderboard
          entries={leaderboard}
          stageScoresByAttempt={stageScoresByAttempt}
          emptyMessage="No students have completed this simulation yet."
        />
      ) : completedAttempts.length === 0 && attempts.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No students have attempted this simulation yet."
          description="Share the published simulation with your class to see attempts here."
        />
      ) : attempts.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No students have attempted this simulation yet."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm stitch-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Started</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    className="border-t border-border cursor-pointer hover:bg-surface/80"
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  >
                    <td className="font-medium text-text-primary">
                      {row.profiles?.full_name ?? "—"}
                    </td>
                    <td className="text-text-secondary">
                      {new Date(row.started_at).toLocaleDateString()}
                    </td>
                    <td>{row.total_score}/600</td>
                    <td className="font-medium text-gold">{scoreToGrade(row.total_score)}</td>
                    <td className="capitalize text-text-secondary">
                      {row.status.replace("_", " ")}
                    </td>
                  </tr>
                  {expanded === row.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 bg-surface">
                        <div className="space-y-3">
                          {SCORED_STAGES.map((stage) => {
                            const sc = row.stage_scores.find((s) => s.stage === stage);
                            const tone = sc ? stageScoreTone(sc.score) : null;
                            return (
                              <div key={stage} className="text-xs">
                                <strong className="text-text-primary">
                                  {STAGE_LABELS[stage]}
                                </strong>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
