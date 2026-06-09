/**
 * ProfessorClassCard.tsx
 * Professor-facing class card — same look as the student dashboard card, with join code and manage actions.
 */

"use client";

import Link from "next/link";
import { resolveClassColorScheme } from "@/lib/class-appearance";
import type { ClassColorSchemeId } from "@/types";

type ProfessorClassCardProps = {
  classId: string;
  className: string;
  description?: string | null;
  joinCode: string;
  cardImageUrl?: string | null;
  cardColorScheme?: ClassColorSchemeId | null;
  simulationCount: number;
  onCopyJoinCode: () => void;
  onCopyJoinLink: () => void;
};

function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}): React.ReactElement {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

/**
 * Styled class card for professor dashboard and My Classes — mirrors StudentClassCard with manage actions.
 */
export function ProfessorClassCard({
  classId,
  className,
  description,
  joinCode,
  cardImageUrl,
  cardColorScheme,
  simulationCount,
  onCopyJoinCode,
  onCopyJoinLink,
}: ProfessorClassCardProps): React.ReactElement {
  const scheme = resolveClassColorScheme(cardColorScheme);
  const image = cardImageUrl?.trim() || null;

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border bg-page shadow-sm hover:shadow-md transition-shadow duration-150">
      <div
        className="relative min-h-[140px] flex items-end px-5 py-5 shrink-0"
        style={{
          background: image
            ? `linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.2)), url(${image}) center/cover`
            : `linear-gradient(135deg, ${scheme.gradientFrom}, ${scheme.gradientTo})`,
        }}
      >
        <h2 className="text-xl font-bold text-white drop-shadow-sm line-clamp-2">{className}</h2>
      </div>

      <div
        className="px-5 py-4 border-l-4 bg-surface flex flex-col flex-1"
        style={{ borderLeftColor: scheme.accent }}
      >
        {description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">{description}</p>
        )}
        <p className="text-sm font-medium" style={{ color: scheme.accent }}>
          {simulationCount === 0
            ? "No simulations yet"
            : `${simulationCount} simulation${simulationCount === 1 ? "" : "s"}`}
        </p>

        <div className="mt-4 bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-dashed border-outline-variant">
          <code className="font-code-lg text-primary tracking-[0.15em] uppercase">{joinCode}</code>
          <button
            type="button"
            onClick={onCopyJoinCode}
            className="text-secondary font-label-sm flex items-center gap-1 hover:underline shrink-0"
          >
            <MaterialIcon name="content_copy" className="text-[18px]" />
            Copy
          </button>
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          <button
            type="button"
            onClick={onCopyJoinLink}
            className="flex-1 py-2 border border-outline-variant text-primary font-label-md rounded-lg hover:bg-surface-container-high transition-colors"
          >
            Copy Join Link
          </button>
          <Link
            href={`/teacher/classes/${classId}`}
            className="flex-1 py-2 bg-primary text-white font-label-md rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
          >
            Manage
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
