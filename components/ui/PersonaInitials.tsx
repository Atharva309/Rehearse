/**
 * PersonaInitials.tsx
 * Centered initials circle for phone-call UI (Stitch design).
 */

import { PHONE_INITIALS_SIZE_PX } from "@/lib/constants";

type PersonaInitialsProps = {
  name: string;
};

/**
 * Derives up to two initials from a persona display name.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

/**
 * Renders the large centered avatar circle on phone call screens.
 */
export function PersonaInitials({ name }: PersonaInitialsProps): React.ReactElement {
  return (
    <div
      className="phone-initials"
      style={{ "--phone-initials-size": `${PHONE_INITIALS_SIZE_PX}px` } as React.CSSProperties}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
