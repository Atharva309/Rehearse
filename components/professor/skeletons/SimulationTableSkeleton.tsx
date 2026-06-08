/**
 * SimulationTableSkeleton.tsx
 * Skeleton rows for professor simulation tables.
 */

type SimulationTableSkeletonProps = {
  rows?: number;
};

/**
 * Placeholder table rows for simulation lists.
 */
export function SimulationTableSkeleton({
  rows = 5,
}: SimulationTableSkeletonProps): React.ReactElement {
  return (
    <div className="overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
      <div className="bg-surface-container-low px-lg py-md border-b border-outline-variant">
        <div className="flex gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 w-16 bg-surface-container rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-outline-variant">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`px-lg py-md flex items-center gap-6 animate-fade-in-up ${
              i === 0
                ? "animate-fade-in-up-delay-1"
                : i === 1
                  ? "animate-fade-in-up-delay-2"
                  : i === 2
                    ? "animate-fade-in-up-delay-3"
                    : ""
            }`}
          >
            <div className="h-4 bg-surface-container rounded animate-pulse flex-1 max-w-[200px]" />
            <div className="h-4 bg-surface-container rounded animate-pulse w-24" />
            <div className="h-5 w-16 bg-surface-container rounded animate-pulse" />
            <div className="h-4 bg-surface-container rounded animate-pulse w-12" />
            <div className="h-4 bg-surface-container rounded animate-pulse w-10 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
