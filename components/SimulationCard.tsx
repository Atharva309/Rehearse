/**
 * SimulationCard.tsx
 * Student dashboard card with gold accent, progress bar, and CTA.
 */

"use client";

import { SimulationStartLink } from "@/components/SimulationStartLink";
import { TOTAL_STAGES_COUNT } from "@/lib/constants";
import type { Simulation } from "@/types";

type SimulationCardProps = {
  simulation: Simulation;
  actionLabel: string;
  href: string;
  stagesCompleted?: number;
};

/**
 * Displays simulation summary with optional in-progress progress bar.
 */
export function SimulationCard({
  simulation,
  actionLabel,
  href,
  stagesCompleted = 0,
}: SimulationCardProps): React.ReactElement {
  const hasProgress = stagesCompleted > 0;
  const progressPercent = Math.min(
    100,
    Math.round((stagesCompleted / TOTAL_STAGES_COUNT) * 100)
  );

  return (
    <article className="card-surface border-l-4 border-l-gold p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-text-primary">{simulation.title}</h3>
      <p className="text-sm text-text-secondary">
        {simulation.persona_name} · {simulation.persona_role}
      </p>
      <p className="text-sm text-text-secondary line-clamp-2">{simulation.product_context}</p>

      {hasProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Progress</span>
            <span>
              {stagesCompleted}/{TOTAL_STAGES_COUNT} stages
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface border border-border overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <SimulationStartLink
        href={href}
        label={actionLabel}
        simulationTitle={simulation.title}
      />
    </article>
  );
}
