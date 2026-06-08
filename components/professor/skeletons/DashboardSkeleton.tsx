/**
 * DashboardSkeleton.tsx
 * Skeleton loader for the professor dashboard.
 */

import { ClassCardSkeleton } from "@/components/professor/skeletons/ClassCardSkeleton";
import { SimulationTableSkeleton } from "@/components/professor/skeletons/SimulationTableSkeleton";

/**
 * Animated placeholders for dashboard class cards and simulation table.
 */
export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="max-w-container-max mx-auto px-margin-desktop py-lg space-y-xl">
      <section className="space-y-2">
        <div className="h-8 bg-surface-container rounded animate-pulse w-64" />
        <div className="h-4 bg-surface-container rounded animate-pulse w-96 max-w-full" />
      </section>

      <section className="space-y-lg">
        <div className="flex items-center justify-between border-b border-outline-variant pb-md">
          <div className="h-6 bg-surface-container rounded animate-pulse w-32" />
          <div className="h-10 w-36 bg-surface-container rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          <ClassCardSkeleton delay={1} />
          <ClassCardSkeleton delay={2} />
          <ClassCardSkeleton delay={3} />
        </div>
      </section>

      <section className="space-y-lg">
        <div className="flex items-center justify-between border-b border-outline-variant pb-md">
          <div className="h-6 bg-surface-container rounded animate-pulse w-40" />
          <div className="h-10 w-44 bg-surface-container rounded-lg animate-pulse" />
        </div>
        <SimulationTableSkeleton rows={3} />
      </section>
    </div>
  );
}
