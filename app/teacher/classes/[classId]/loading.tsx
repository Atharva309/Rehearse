import { ProfessorLoadingShell } from "@/components/professor/ProfessorLoadingShell";
import { ClassPageSkeleton } from "@/components/professor/skeletons/ClassPageSkeleton";

/**
 * Manage class route loading UI.
 */
export default function ClassManagementLoading(): React.ReactElement {
  return (
    <ProfessorLoadingShell>
      <ClassPageSkeleton />
    </ProfessorLoadingShell>
  );
}
