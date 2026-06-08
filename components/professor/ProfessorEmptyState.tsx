/**
 * ProfessorEmptyState.tsx
 * Consistent animated empty state for professor pages.
 */

import { FadeIn } from "@/components/professor/FadeIn";

type ProfessorEmptyStateProps = {
  icon: string;
  heading: string;
  description: string;
  action?: React.ReactNode;
};

/**
 * Centered empty state with Material icon and optional CTA.
 */
export function ProfessorEmptyState({
  icon,
  heading,
  description,
  action,
}: ProfessorEmptyStateProps): React.ReactElement {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-20 text-center">
      <span className="material-symbols-outlined text-5xl text-outline-variant mb-4" aria-hidden>
        {icon}
      </span>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{heading}</h3>
      <p className="text-on-surface-variant font-body-md max-w-xs mb-6">{description}</p>
      {action}
    </FadeIn>
  );
}
