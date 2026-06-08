import { ProfessorLoadingShell } from "@/components/professor/ProfessorLoadingShell";
import { SimulationTableSkeleton } from "@/components/professor/skeletons/SimulationTableSkeleton";

/**
 * Simulation library route loading UI.
 */
export default function TeacherLibraryLoading(): React.ReactElement {
  return (
    <ProfessorLoadingShell>
      <div className="max-w-container-max mx-auto px-margin-desktop py-lg space-y-lg">
        <div className="h-8 w-56 bg-surface-container rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-surface-container rounded animate-pulse" />
        <SimulationTableSkeleton rows={5} />
      </div>
    </ProfessorLoadingShell>
  );
}
