import { ProfessorLoadingShell } from "@/components/professor/ProfessorLoadingShell";
import { DashboardSkeleton } from "@/components/professor/skeletons/DashboardSkeleton";

/**
 * Dashboard route loading UI.
 */
export default function TeacherDashboardLoading(): React.ReactElement {
  return (
    <ProfessorLoadingShell>
      <DashboardSkeleton />
    </ProfessorLoadingShell>
  );
}
