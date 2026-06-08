/**
 * FormSkeleton.tsx
 * Skeleton for create/edit simulation form sections.
 */

/**
 * Placeholder form section cards with input shapes.
 */
export function FormSkeleton(): React.ReactElement {
  return (
    <div className="max-w-container-max mx-auto px-margin-desktop py-lg space-y-lg">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm space-y-4"
        >
          <div className="h-6 w-32 bg-surface-container rounded animate-pulse" />
          <div className="h-10 bg-surface-container rounded-lg animate-pulse" />
          <div className="h-24 bg-surface-container rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}
