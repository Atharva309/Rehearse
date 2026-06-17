/**
 * class-appearance.ts
 * Preset color schemes and helpers for student-facing class cards.
 */

export type ClassColorSchemeId =
  | "default"
  | "ocean"
  | "forest"
  | "sunset"
  | "violet"
  | "rose";

export type ClassColorScheme = {
  id: ClassColorSchemeId;
  label: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
};

export const CLASS_COLOR_SCHEMES: ClassColorScheme[] = [
  { id: "default", label: "Rehearse Blue", accent: "#005bbf", gradientFrom: "#005bbf", gradientTo: "#003d80" },
  { id: "ocean", label: "Ocean", accent: "#0891b2", gradientFrom: "#06b6d4", gradientTo: "#0e7490" },
  { id: "forest", label: "Forest", accent: "#16a34a", gradientFrom: "#22c55e", gradientTo: "#15803d" },
  { id: "sunset", label: "Sunset", accent: "#ea580c", gradientFrom: "#f97316", gradientTo: "#c2410c" },
  { id: "violet", label: "Violet", accent: "#7c3aed", gradientFrom: "#8b5cf6", gradientTo: "#6d28d9" },
  { id: "rose", label: "Rose", accent: "#e11d48", gradientFrom: "#f43f5e", gradientTo: "#be123c" },
];

const SCHEME_BY_ID = Object.fromEntries(
  CLASS_COLOR_SCHEMES.map((s) => [s.id, s])
) as Record<ClassColorSchemeId, ClassColorScheme>;

/**
 * Resolves a stored scheme id to its preset, falling back to default.
 */
export function resolveClassColorScheme(id: string | null | undefined): ClassColorScheme {
  if (id && id in SCHEME_BY_ID) {
    return SCHEME_BY_ID[id as ClassColorSchemeId];
  }
  return SCHEME_BY_ID.default;
}

export type ClassAppearance = {
  cardImageUrl: string | null;
  cardColorScheme: ClassColorSchemeId;
};

export type ClassAppearanceStatus = "ready" | "missing_columns" | "stale_schema";

export const CLASS_APPEARANCE_SETUP_SQL = `ALTER TABLE classes ADD COLUMN IF NOT EXISTS card_image_url text;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS card_color_scheme text DEFAULT 'default';
NOTIFY pgrst, 'reload schema';`;
