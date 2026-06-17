/**
 * AuthSplitLayout.tsx
 * Stitch split-screen auth shell — brand panel left, form panel right.
 */

import {
  AUTH_BRAND_PANEL_PERCENT,
} from "@/lib/constants";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  accent?: "accent" | "gold";
  title?: string;
  subtitle?: string;
};

/**
 * Renders the two-column Rehearse auth layout from the Stitch export.
 */
export function AuthSplitLayout({
  children,
  accent = "accent",
  title = "Rehearse",
  subtitle = "AI-powered sales training for students and teachers.",
}: AuthSplitLayoutProps): React.ReactElement {
  const borderClass = accent === "gold" ? "border-t-gold" : "border-t-accent";

  return (
    <main
      className="auth-split-root"
      style={
        {
          "--auth-brand-width": `${AUTH_BRAND_PANEL_PERCENT}%`,
        } as React.CSSProperties
      }
    >
      <div className="auth-split-brand">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-4">
          Sales training platform
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{title}</h1>
        <p className="mt-4 text-sm lg:text-base text-white/70 max-w-sm leading-relaxed">
          {subtitle}
        </p>
        <ul className="mt-10 space-y-3 text-sm text-white/60">
          <li>6-stage simulation pipeline</li>
          <li>Live voice & video calls with AI personas</li>
          <li>GPT scoring and class leaderboards</li>
        </ul>
      </div>
      <div className="auth-split-form">
        <div className={`auth-split-card ${borderClass}`}>{children}</div>
      </div>
    </main>
  );
}
