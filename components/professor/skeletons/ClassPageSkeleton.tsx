/**
 * ClassPageSkeleton.tsx
 * Skeleton for the Manage Class page layout.
 */

import { SimulationTableSkeleton } from "@/components/professor/skeletons/SimulationTableSkeleton";

/**
 * Placeholder for class management — share box, students, simulations.
 */
export function ClassPageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-container-max mx-auto px-margin-desktop py-8 space-y-8">
      <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
      <div className="h-8 bg-surface-container rounded animate-pulse w-64 mb-10" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-7 space-y-8">
          <div className="bg-secondary-fixed/20 border border-secondary-fixed rounded-xl p-lg space-y-4">
            <div className="h-6 w-40 bg-surface-container rounded animate-pulse" />
            <div className="h-10 bg-surface-container rounded-lg animate-pulse" />
            <div className="h-10 bg-surface-container rounded-lg animate-pulse w-3/4" />
          </div>

          <div className="space-y-4">
            <div className="h-6 w-48 bg-surface-container rounded animate-pulse" />
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-lg py-4 flex gap-4 border-b border-outline-variant last:border-0">
                  <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse" />
                  <div className="h-4 flex-1 bg-surface-container rounded animate-pulse" />
                  <div className="h-4 w-24 bg-surface-container rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 space-y-4">
          <div className="h-6 w-40 bg-surface-container rounded animate-pulse" />
          <SimulationTableSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}
