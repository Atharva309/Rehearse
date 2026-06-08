/**
 * ProfessorSpinner.tsx
 * Inline loading spinner for professor action buttons.
 */

type ProfessorButtonContentProps = {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
};

/**
 * Shows a spinner + loading label while an async action runs.
 */
export function ProfessorButtonContent({
  isLoading,
  loadingText,
  children,
}: ProfessorButtonContentProps): React.ReactElement {
  if (isLoading) {
    return (
      <span className="flex items-center justify-center gap-2">
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden
        />
        {loadingText}
      </span>
    );
  }
  return <>{children}</>;
}
