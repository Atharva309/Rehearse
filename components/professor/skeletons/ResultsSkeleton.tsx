/**
 * ResultsSkeleton.tsx
 * Skeleton for simulation results page.
 */

/**
 * Placeholder for results tabs and attempt table.
 */
export function ResultsSkeleton(): React.ReactElement {
  return (
    <div className="p-margin-desktop bg-surface-bright space-y-lg">
      <div className="flex gap-4 border-b border-outline-variant pb-2">
        <div className="h-10 w-36 bg-surface-container rounded animate-pulse" />
        <div className="h-10 w-32 bg-surface-container rounded animate-pulse" />
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="bg-surface-container-low px-md py-4 flex gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-20 bg-surface-container rounded animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-md py-4 flex items-center gap-4 border-t border-outline-variant">
            <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse" />
            <div className="h-4 flex-1 max-w-[140px] bg-surface-container rounded animate-pulse" />
            <div className="h-4 w-28 bg-surface-container rounded animate-pulse" />
            <div className="h-5 w-20 bg-surface-container rounded animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-surface-container animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
