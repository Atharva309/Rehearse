import { ProfessorLoadingShell } from "@/components/professor/ProfessorLoadingShell";

/**
 * Analytics route loading UI.
 */
export default function TeacherAnalyticsLoading(): React.ReactElement {
  return (
    <ProfessorLoadingShell>
      <div className="max-w-container-max mx-auto px-margin-desktop py-lg space-y-xl">
        <div className="h-8 w-40 bg-surface-container rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </ProfessorLoadingShell>
  );
}
