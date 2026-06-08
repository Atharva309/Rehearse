import { ResultsSkeleton } from "@/components/professor/skeletons/ResultsSkeleton";

/**
 * Simulation results route loading UI.
 */
export default function SimulationResultsLoading(): React.ReactElement {
  return (
    <div className="fixed inset-0 z-40 flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block w-64 bg-surface-container-low border-r border-outline-variant shrink-0" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-outline-variant bg-surface px-margin-desktop flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
          <div className="h-6 w-48 bg-surface-container rounded animate-pulse" />
        </div>
        <ResultsSkeleton />
      </main>
    </div>
  );
}
