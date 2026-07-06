import type { Config } from "tailwindcss";
import { COLORS, FONT } from "./lib/design-tokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: COLORS.primary,
        "primary-container": COLORS.primaryContainer,
        "on-primary-container": COLORS.onPrimaryContainer,
        "on-primary": COLORS.onPrimary,
        secondary: COLORS.secondary,
        "secondary-container": COLORS.secondaryContainer,
        "secondary-fixed": COLORS.secondaryFixed,
        "on-secondary-fixed": COLORS.onSecondaryFixed,
        "on-secondary-container": COLORS.onSecondaryContainer,
        "tertiary-container": COLORS.tertiaryContainer,
        "tertiary-fixed": COLORS.tertiaryFixed,
        "on-tertiary-fixed": COLORS.onTertiaryFixed,
        surface: COLORS.surface,
        "surface-bright": COLORS.surfaceBright,
        "surface-container-low": COLORS.surfaceContainerLow,
        "surface-container": COLORS.surfaceContainer,
        "surface-container-high": COLORS.surfaceContainerHigh,
        "surface-container-highest": COLORS.surfaceContainerHighest,
        "surface-container-lowest": COLORS.surfaceContainerLowest,
        "on-surface": COLORS.onSurface,
        "on-surface-variant": COLORS.onSurfaceVariant,
        outline: COLORS.outline,
        "outline-variant": COLORS.outlineVariant,
        error: COLORS.error,
        "error-container": COLORS.errorContainer,
        "on-error-container": COLORS.onErrorContainer,
        background: COLORS.background,
        // Legacy aliases — student / untouched components
        accent: COLORS.secondary,
        gold: COLORS.tertiaryContainer,
        success: "#22c55e",
        page: COLORS.surfaceContainerLowest,
        border: COLORS.outlineVariant,
        "text-primary": COLORS.onSurface,
        "text-secondary": COLORS.onSurfaceVariant,
        "call-background": "#0a0a0a",
        "pipeline-complete": COLORS.tertiaryContainer,
        "pipeline-active": COLORS.secondary,
        "pipeline-inactive": "#94a3b8",
        "tempo-results-partial": COLORS.tempoResultsPartialHero,
        "tempo-results-lost": COLORS.tempoResultsLostHero,
        "tempo-results-lost-bar": COLORS.tempoResultsLostBar,
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "body-lg": ["Inter", "system-ui", "sans-serif"],
        "code-md": ["JetBrains Mono", "monospace"],
        "code-lg": ["JetBrains Mono", "monospace"],
        "headline-lg": ["Inter", "system-ui", "sans-serif"],
        "headline-md": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"],
        "label-md": ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: [
          FONT.display.size,
          {
            lineHeight: FONT.display.lineHeight,
            letterSpacing: FONT.display.letterSpacing,
            fontWeight: FONT.display.weight,
          },
        ],
        "headline-lg": [
          FONT.headlineLg.size,
          {
            lineHeight: FONT.headlineLg.lineHeight,
            letterSpacing: FONT.headlineLg.letterSpacing,
            fontWeight: FONT.headlineLg.weight,
          },
        ],
        "headline-md": [
          FONT.headlineMd.size,
          {
            lineHeight: FONT.headlineMd.lineHeight,
            fontWeight: FONT.headlineMd.weight,
          },
        ],
        "body-lg": [
          FONT.bodyLg.size,
          {
            lineHeight: FONT.bodyLg.lineHeight,
            fontWeight: FONT.bodyLg.weight,
          },
        ],
        "body-md": [
          FONT.bodyMd.size,
          {
            lineHeight: FONT.bodyMd.lineHeight,
            fontWeight: FONT.bodyMd.weight,
          },
        ],
        "label-md": [
          FONT.labelMd.size,
          {
            lineHeight: FONT.labelMd.lineHeight,
            fontWeight: FONT.labelMd.weight,
          },
        ],
        "label-sm": [
          FONT.labelSm.size,
          {
            lineHeight: FONT.labelSm.lineHeight,
            letterSpacing: FONT.labelSm.letterSpacing,
            fontWeight: FONT.labelSm.weight,
          },
        ],
        "code-md": [
          FONT.codeMd.size,
          {
            lineHeight: FONT.codeMd.lineHeight,
            fontWeight: FONT.codeMd.weight,
          },
        ],
        "code-lg": [
          FONT.codeLg.size,
          {
            lineHeight: FONT.codeLg.lineHeight,
            letterSpacing: FONT.codeLg.letterSpacing,
            fontWeight: FONT.codeLg.weight,
          },
        ],
      },
      spacing: {
        "margin-mobile": "16px",
        "margin-desktop": "32px",
        gutter: "24px",
        xs: "4px",
        sm: "8px",
        base: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      maxWidth: {
        "container-max": "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
