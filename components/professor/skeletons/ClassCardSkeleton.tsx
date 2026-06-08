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
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md h-full animate-fade-in-up ${delayClass}`}
    >
      <div className="h-5 w-16 bg-surface-container rounded animate-pulse mb-4" />
      <div className="h-6 bg-surface-container rounded animate-pulse w-3/4 mb-2" />
      <div className="h-4 bg-surface-container rounded animate-pulse w-full mb-1" />
      <div className="h-4 bg-surface-container rounded animate-pulse w-2/3 mb-6" />
      <div className="flex gap-4 mb-4">
        <div className="h-4 w-20 bg-surface-container rounded animate-pulse" />
        <div className="h-4 w-24 bg-surface-container rounded animate-pulse" />
      </div>
      <div className="h-12 bg-surface-container rounded-lg animate-pulse mb-3" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-surface-container rounded animate-pulse" />
        <div className="h-10 flex-1 bg-surface-container rounded animate-pulse" />
      </div>
    </div>
  );
}
