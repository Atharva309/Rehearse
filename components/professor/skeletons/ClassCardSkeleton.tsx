/**
 * ClassCardSkeleton.tsx
 * Single skeleton class card for professor grids.
 */

type ClassCardSkeletonProps = {
  delay?: 0 | 1 | 2 | 3 | 4;
};

/**
 * Placeholder matching professor class card dimensions.
 */
export function ClassCardSkeleton({ delay = 0 }: ClassCardSkeletonProps): React.ReactElement {
  const delayClass =
    delay === 1
      ? "animate-fade-in-up-delay-1"
      : delay === 2
        ? "animate-fade-in-up-delay-2"
        : delay === 3
          ? "animate-fade-in-up-delay-3"
          : delay === 4
            ? "animate-fade-in-up-delay-4"
            : "";

  return (
    <div
      className={`rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest h-full animate-fade-in-up ${delayClass}`}
    >
      <div className="h-[140px] bg-surface-container animate-pulse" />
      <div className="p-5 space-y-3 border-l-4 border-surface-container">
        <div className="h-4 bg-surface-container rounded animate-pulse w-1/2" />
        <div className="h-12 bg-surface-container rounded-lg animate-pulse" />
        <div className="flex gap-2 pt-2">
          <div className="h-10 flex-1 bg-surface-container rounded-lg animate-pulse" />
          <div className="h-10 flex-1 bg-surface-container rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
