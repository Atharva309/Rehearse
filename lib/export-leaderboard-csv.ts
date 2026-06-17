/**
 * export-leaderboard-csv.ts
 * Builds and downloads teacher leaderboard CSV export.
 */

import { STAGE_LABELS, SCORED_STAGES } from "@/lib/constants";
import type { StageScore } from "@/types";
import type { LeaderboardEntry } from "@/types";

export type CsvExportRow = LeaderboardEntry & {
  stage_scores: StageScore[];
};

/**
 * Escapes a CSV cell value.
 */
function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers browser download of leaderboard CSV.
 */
export function downloadLeaderboardCsv(rows: CsvExportRow[]): void {
  const stageHeaders = SCORED_STAGES.map((s) => STAGE_LABELS[s]);
  const headers = ["Rank", "Name", "Score", "Grade", ...stageHeaders];
  const lines = [headers.map(escapeCell).join(",")];

  rows.forEach((row) => {
    const stageCells = SCORED_STAGES.map((stage) => {
      const sc = row.stage_scores.find((s) => s.stage === stage);
      return sc ? sc.score : "";
    });
    lines.push(
      [
        row.rank,
        row.student_name,
        row.total_score,
        row.grade,
        ...stageCells,
      ]
        .map(escapeCell)
        .join(",")
    );
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rehearse-leaderboard.csv";
  link.click();
  URL.revokeObjectURL(url);
}
