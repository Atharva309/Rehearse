/**
 * StudentClassCard.tsx
 * Clickable class card on the student dashboard — matches professor appearance settings.
 */

import Link from "next/link";
import { DEFAULT_CLASS_DESCRIPTION, DEFAULT_CLASS_NAME } from "@/lib/constants";
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
  const displayName = isSystemDefault ? DEFAULT_CLASS_NAME : className;

  return (
    <Link
      href={`/student/classes/${classId}`}
      className={`flex h-full flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150 group ${
        isSystemDefault
          ? "border border-white/10 bg-[#0a0a0a]"
          : "border border-border bg-page"
      }`}
    >
      <div
        className="relative min-h-[140px] shrink-0 flex items-end px-5 py-5"
        style={
          isSystemDefault
            ? { background: "linear-gradient(135deg, #000000, #1a1a1a)" }
            : {
                background: image
                  ? `linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.2)), url(${image}) center/cover`
                  : `linear-gradient(135deg, ${scheme.gradientFrom}, ${scheme.gradientTo})`,
              }
        }
      >
        <h2 className="text-xl font-bold text-white drop-shadow-sm group-hover:underline decoration-white/80">
          {displayName}
        </h2>
      </div>
      <div
        className={`flex flex-1 flex-col px-5 py-4 border-l-4 ${
          isSystemDefault ? "bg-[#111111] border-l-white/30" : "bg-surface"
        }`}
        style={isSystemDefault ? undefined : { borderLeftColor: scheme.accent }}
      >
        {isSystemDefault && (
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-white/80 text-[18px]" aria-hidden>
              auto_awesome
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-white font-bold text-[10px] uppercase rounded">
              Available to all students
            </span>
          </div>
        )}
        {(isSystemDefault || description) && (
          <p
            className={`text-sm line-clamp-2 mb-2 ${
              isSystemDefault ? "text-white/70" : "text-text-secondary"
            }`}
          >
            {isSystemDefault ? DEFAULT_CLASS_DESCRIPTION : description}
          </p>
        )}
        <div className="mt-auto pt-2">
          <p
            className="text-sm font-medium"
            style={isSystemDefault ? { color: "#ffffff" } : { color: scheme.accent }}
          >
            {simulationCount === 0
              ? "No simulations yet"
              : `${simulationCount} simulation${simulationCount === 1 ? "" : "s"}`}
          </p>
          <p
            className={`text-xs mt-2 transition-colors ${
              isSystemDefault
                ? "text-white/50 group-hover:text-white/80"
                : "text-text-secondary group-hover:text-text-primary"
            }`}
          >
            Open class →
          </p>
        </div>
      </div>
    </Link>
  );
}
