/**
 * MaterialIcon.tsx
 * Google Material Symbols Outlined icon for shared UI surfaces.
 */

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

/**
 * Renders a Material Symbols Outlined glyph by name.
 */
export function MaterialIcon({
  name,
  className = "",
  filled = false,
}: MaterialIconProps): React.ReactElement {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
