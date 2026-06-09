/**
 * BackButton.tsx
 * Subtle back navigation — uses browser history when possible, with optional fallback.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  label: string;
  href?: string;
  /** Navigate via router.back(); falls back to fallbackHref when history is empty. */
  useHistory?: boolean;
  fallbackHref?: string;
  className?: string;
  /** Circular icon-only button (professor form/results headers). */
  iconOnly?: boolean;
  /** Use Material Symbols arrow instead of text ← */
  materialIcon?: boolean;
};

const DEFAULT_CLASS =
  "inline-flex items-center gap-1.5 text-sm text-text-secondary hover:underline mb-6 transition-colors";

/**
 * Renders back navigation; prefers browser history when useHistory is set.
 */
export function BackButton({
  label,
  href,
  useHistory = false,
  fallbackHref,
  className = DEFAULT_CLASS,
  iconOnly = false,
  materialIcon = false,
}: BackButtonProps): React.ReactElement {
  const router = useRouter();

  const goBack = (): void => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fallbackHref) {
      router.push(fallbackHref);
      return;
    }
    router.back();
  };

  const handleClick = (): void => {
    if (useHistory || !href) {
      goBack();
    } else {
      router.push(href);
    }
  };

  const iconOnlyClass =
    "flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors text-primary";

  const arrow = materialIcon ? (
    <span className="material-symbols-outlined text-[18px]" aria-hidden>
      arrow_back
    </span>
  ) : (
    <span aria-hidden>←</span>
  );

  if (href && !useHistory) {
    if (iconOnly) {
      return (
        <Link href={href} className={className || iconOnlyClass} aria-label={label}>
          {arrow}
        </Link>
      );
    }
    return (
      <Link href={href} className={className}>
        {arrow}
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={iconOnly ? className || iconOnlyClass : className}
      aria-label={iconOnly ? label : undefined}
    >
      {arrow}
      {!iconOnly && label}
    </button>
  );
}
