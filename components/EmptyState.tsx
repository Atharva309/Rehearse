/**
 * EmptyState.tsx
 * Centered empty list placeholder (Stitch QoL).
 */

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

/**
 * Renders emoji/icon, title, optional description and CTA.
 */
export function EmptyState({
  icon = "📋",
  title,
  description,
  action,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="card-surface py-16 px-6 text-center mt-8">
      <p className="text-4xl mb-4" aria-hidden>
        {icon}
      </p>
      <p className="font-semibold text-text-primary">{title}</p>
      {description && <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
