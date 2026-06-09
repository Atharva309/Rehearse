/**
 * StudentClassHeader.tsx
 * Styled class banner shown on the student dashboard per enrolled class.
 */

import { resolveClassColorScheme } from "@/lib/class-appearance";
import type { ClassColorSchemeId } from "@/types";

type StudentClassHeaderProps = {
  className: string;
  cardImageUrl?: string | null;
  cardColorScheme?: ClassColorSchemeId | null;
};

/**
 * Gradient or image header reflecting professor-configured class appearance.
 */
export function StudentClassHeader({
  className,
  cardImageUrl,
  cardColorScheme,
}: StudentClassHeaderProps): React.ReactElement {
  const scheme = resolveClassColorScheme(cardColorScheme);
  const image = cardImageUrl?.trim() || null;

  return (
    <div
      className="relative rounded-xl overflow-hidden mb-4 min-h-[88px] flex items-end px-5 py-4"
      style={{
        background: image
          ? `linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.25)), url(${image}) center/cover`
          : `linear-gradient(135deg, ${scheme.gradientFrom}, ${scheme.gradientTo})`,
      }}
    >
      <h2 className="text-lg font-semibold text-white drop-shadow-sm">{className}</h2>
    </div>
  );
}
