import { ProfessorLoadingShell } from "@/components/professor/ProfessorLoadingShell";
import { ClassCardSkeleton } from "@/components/professor/skeletons/ClassCardSkeleton";

/**
 * My Classes route loading UI.
 */
export default function TeacherClassesLoading(): React.ReactElement {
  return (
    <ProfessorLoadingShell>
      <div className="max-w-container-max mx-auto px-margin-desktop py-lg space-y-lg">
        <div className="h-8 w-48 bg-surface-container rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          <ClassCardSkeleton delay={1} />
          <ClassCardSkeleton delay={2} />
          <ClassCardSkeleton delay={3} />
        </div>
      </div>
    </ProfessorLoadingShell>
  );
}
