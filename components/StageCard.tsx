/**
 * StageCard.tsx
 * White card wrapper for non-call simulation stages (Stitch layout).
 */

type StageCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

/**
 * Renders stage header and content inside a consistent white card.
 */
export function StageCard({ title, subtitle, children }: StageCardProps): React.ReactElement {
  return (
    <div className="stage-content-card">
      <header className="pb-6 mb-6 border-b border-border">
        <h2 className="text-2xl font-bold text-primary">{title}</h2>
        <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}
