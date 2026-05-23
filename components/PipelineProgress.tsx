/**
 * PipelineProgress.tsx
 * Full-width 2×3 chevron pipeline (Stitch design) — gold / blue / grey states.
 */

"use client";

import {
  PIPELINE_CELL_MIN_HEIGHT_PX,
  PIPELINE_GRID_MIN_WIDTH_PX,
  PIPELINE_LABEL_INSET_LEFT_PX,
} from "@/lib/constants";
import type { StageProgressItem } from "@/types";

type PipelineProgressProps = {
  items: StageProgressItem[];
  allComplete?: boolean;
};

const labelInsetStyle = {
  paddingLeft: PIPELINE_LABEL_INSET_LEFT_PX,
  paddingRight: 28,
} as React.CSSProperties;

function statusSurfaceClass(
  status: StageProgressItem["status"],
  allComplete: boolean
): string {
  const effective = allComplete ? "completed" : status;
  if (effective === "completed") {
    return "bg-gold/20 border border-pipeline-complete/50";
  }
  if (effective === "current") {
    return "bg-accent/20 border border-pipeline-active ring-2 ring-pipeline-active/40";
  }
  return "bg-surface border border-border";
}

/**
 * Chevron pipeline grid at the top of simulation and results pages.
 */
export function PipelineProgress({
  items,
  allComplete = false,
}: PipelineProgressProps): React.ReactElement {
  return (
    <section className="w-full mb-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
        Simulation pipeline
      </p>
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          className="grid grid-cols-3 gap-2 w-full"
          style={{ minWidth: PIPELINE_GRID_MIN_WIDTH_PX }}
        >
          {items.map((item, index) => {
            const effective = allComplete ? "completed" : item.status;
            const isLocked = effective === "locked";

            return (
              <div
                key={item.stage}
                className="relative"
                style={{ minHeight: PIPELINE_CELL_MIN_HEIGHT_PX }}
                aria-current={!allComplete && item.status === "current" ? "step" : undefined}
              >
                <div
                  className={`absolute inset-0 pipeline-chevron transition-colors ${statusSurfaceClass(item.status, allComplete)}`}
                  aria-hidden
                />
                <div
                  className={`relative z-10 flex flex-col justify-center py-3.5 text-left ${isLocked ? "text-text-secondary" : "text-text-primary"}`}
                  style={labelInsetStyle}
                >
                  <span className="text-[10px] uppercase tracking-wide text-text-secondary">
                    Stage {index + 1}
                  </span>
                  <span className="text-sm font-semibold leading-tight mt-0.5">{item.label}</span>
                  {(item.score !== undefined || allComplete) && item.score !== undefined && (
                    <span className="text-xs font-semibold text-gold mt-1">{item.score}/100</span>
                  )}
                  {!allComplete && item.status === "current" && item.score === undefined && (
                    <span className="text-xs text-pipeline-active mt-1 font-medium">
                      In progress
                    </span>
                  )}
                  {!allComplete && item.status === "locked" && (
                    <span className="text-xs text-pipeline-inactive mt-1">Not started</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
