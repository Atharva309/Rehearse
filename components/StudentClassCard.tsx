/**
 * StudentClassCard.tsx
 * Clickable class card on the student dashboard — matches professor appearance settings.
 */

import Link from "next/link";
import { resolveClassColorScheme } from "@/lib/class-appearance";
import type { ClassColorSchemeId } from "@/types";

type StudentClassCardProps = {
  classId: string;
  className: string;
  description?: string | null;
  cardImageUrl?: string | null;
  cardColorScheme?: ClassColorSchemeId | null;
  simulationCount: number;
  isSystemDefault?: boolean;
};

/**
 * Student-facing class card; links to the class simulations page.
 */
export function StudentClassCard({
  classId,
  className,
  description,
  cardImageUrl,
  cardColorScheme,
  simulationCount,
  isSystemDefault = false,
}: StudentClassCardProps): React.ReactElement {
  const scheme = resolveClassColorScheme(cardColorScheme);
  const image = cardImageUrl?.trim() || null;

  return (
    <Link
      href={`/student/classes/${classId}`}
      className="flex h-full flex-col rounded-xl overflow-hidden border border-border bg-page shadow-sm hover:shadow-md transition-shadow duration-150 group"
    >
      <div
        className="relative min-h-[140px] shrink-0 flex items-end px-5 py-5"
        style={{
          background: image
            ? `linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.2)), url(${image}) center/cover`
            : `linear-gradient(135deg, ${scheme.gradientFrom}, ${scheme.gradientTo})`,
        }}
      >
        <h2 className="text-xl font-bold text-white drop-shadow-sm group-hover:underline decoration-white/80">
          {className}
        </h2>
      </div>
      <div
        className="flex flex-1 flex-col px-5 py-4 border-l-4 bg-surface"
        style={{ borderLeftColor: scheme.accent }}
      >
        {isSystemDefault && (
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-accent text-[18px]" aria-hidden>
              auto_awesome
            </span>
            <span className="px-2 py-0.5 bg-accent/10 text-accent font-bold text-[10px] uppercase rounded">
              Available to all students
            </span>
          </div>
        )}
        {description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">{description}</p>
        )}
        <div className="mt-auto pt-2">
          <p className="text-sm font-medium" style={{ color: scheme.accent }}>
            {simulationCount === 0
              ? "No simulations yet"
              : `${simulationCount} simulation${simulationCount === 1 ? "" : "s"}`}
          </p>
          <p className="text-xs text-text-secondary mt-2 group-hover:text-text-primary transition-colors">
            Open class →
          </p>
        </div>
      </div>
    </Link>
  );
}
