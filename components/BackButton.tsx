/**
 * BackButton.tsx
 * Subtle back navigation with left arrow (Stitch QoL).
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  label: string;
  href?: string;
  useHistory?: boolean;
};

/**
 * Renders ← label; uses explicit href or router.back().
 */
export function BackButton({
  label,
  href,
  useHistory = false,
}: BackButtonProps): React.ReactElement {
  const router = useRouter();
  const className =
    "inline-flex items-center gap-1.5 text-sm text-text-secondary hover:underline mb-6 transition-colors";

  if (href && !useHistory) {
    return (
      <Link href={href} className={className}>
        <span aria-hidden>←</span>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (useHistory ? router.back() : href ? router.push(href) : router.back())}
      className={className}
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
