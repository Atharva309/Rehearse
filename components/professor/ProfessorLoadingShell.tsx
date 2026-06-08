/**
 * ProfessorLoadingShell.tsx
 * Full-viewport shell shown while professor pages load (loading.tsx).
 */

type ProfessorLoadingShellProps = {
  children: React.ReactNode;
};

/**
 * Mimics the professor portal layout with pulse placeholders in the chrome.
 */
export function ProfessorLoadingShell({
  children,
}: ProfessorLoadingShellProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background overflow-hidden font-body-md text-on-surface">
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-12">
            <div className="h-6 w-24 bg-surface-container rounded animate-pulse" />
            <div className="hidden md:flex gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-16 bg-surface-container rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block h-10 w-32 bg-surface-container rounded animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
          </div>
        </div>
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden md:flex flex-col h-full w-64 bg-surface-container-low border-r border-outline-variant p-4 gap-2 shrink-0">
          <div className="h-5 w-36 bg-surface-container rounded animate-pulse mb-6" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 bg-surface-container rounded-lg animate-pulse" />
          ))}
        </aside>
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-surface-bright">
          {children}
        </main>
      </div>
    </div>
  );
}
