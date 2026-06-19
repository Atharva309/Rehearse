/**
 * design-tokens.ts
 * Single source of truth for Stitch design tokens — colors and typography.
 * Consumed by tailwind.config.ts and professor portal pages.
 */

export const COLORS = {
  primary: "#00000b",
  primaryContainer: "#1a1a2e",
  onPrimaryContainer: "#83829b",
  secondary: "#005bbf",
  secondaryContainer: "#5694fe",
  secondaryFixed: "#d7e2ff",
  tertiaryContainer: "#c9a84c",
  tertiaryFixed: "#ffe08f",
  surface: "#f7f9fb",
  surfaceBright: "#f7f9fb",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainer: "#eceef0",
  surfaceContainerHigh: "#e6e8ea",
  surfaceContainerHighest: "#e0e3e5",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#191c1e",
  onSurfaceVariant: "#47464c",
  outline: "#78767d",
  outlineVariant: "#c8c5cd",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onPrimary: "#ffffff",
  onSecondaryFixed: "#001a40",
  onTertiaryFixed: "#241a00",
  onErrorContainer: "#93000a",
  onSecondaryContainer: "#002d64",
  background: "#f7f9fb",
  /** Darker than primary-container — CRM card depth on Tempo entry hero */
  crmCardDepth: "#0f172a",
  /** Gold CTA hover on Tempo entry page (10% darker than tertiary-container) */
  tertiaryGoldHover: "#b8943d",
} as const;

export const FONT = {
  display: {
    size: "32px",
    lineHeight: "40px",
    weight: "600",
    letterSpacing: "-0.02em",
  },
  headlineLg: {
    size: "24px",
    lineHeight: "32px",
    weight: "600",
    letterSpacing: "-0.01em",
  },
  headlineMd: {
    size: "20px",
    lineHeight: "28px",
    weight: "600",
  },
  bodyLg: {
    size: "16px",
    lineHeight: "24px",
    weight: "400",
  },
  bodyMd: {
    size: "14px",
    lineHeight: "20px",
    weight: "400",
  },
  labelMd: {
    size: "13px",
    lineHeight: "18px",
    weight: "500",
  },
  labelSm: {
    size: "12px",
    lineHeight: "16px",
    weight: "500",
    letterSpacing: "0.02em",
  },
  codeMd: {
    size: "14px",
    lineHeight: "20px",
    weight: "500",
    family: "JetBrains Mono",
  },
  codeLg: {
    size: "18px",
    lineHeight: "24px",
    weight: "600",
    letterSpacing: "0.05em",
    family: "JetBrains Mono",
  },
} as const;
