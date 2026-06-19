/**
 * entry/loading.tsx
 * Skeleton for the Tempo simulation entry page while data loads.
 */

/**
 * Placeholder layout matching the Tempo entry hero and content sections.
 */
export default function TempoEntryLoading(): React.ReactElement {
  return (
    <div className="-mx-4 sm:-mx-6 animate-pulse">
      <div className="bg-primary-container h-72 lg:h-80" />
      <div className="bg-surface py-12 px-4 sm:px-6 space-y-8 max-w-[1100px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-48 bg-surface-container rounded-xl" />
          <div className="h-48 bg-surface-container rounded-xl" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 bg-surface-container rounded-xl" />
          ))}
        </div>
      </div>
      <div className="bg-primary-container h-48" />
    </div>
  );
}
