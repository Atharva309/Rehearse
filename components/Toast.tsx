/**
 * Toast.tsx
 * Animated toast notification component.
 * Slides in from top right, auto-dismisses after 3 seconds.
 */

"use client";

import { useToast } from "@/hooks/useToast";
import type { ToastVariant } from "@/hooks/useToast";

const BORDER_COLOR: Record<ToastVariant, string> = {
  success: "#22c55e",
  error: "#ba1a1a",
  info: "#005bbf",
};

/**
 * Fixed toast stack mounted once per app shell.
 */
export function ToastContainer(): React.ReactElement {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return <></>;

  return (
    <div
      className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-surface-container-lowest border border-outline-variant shadow-lg rounded-xl px-5 py-4 flex items-center gap-3 text-sm font-medium text-on-surface animate-toast-in"
          style={{ borderLeft: `4px solid ${BORDER_COLOR[toast.variant]}` }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-on-surface-variant hover:text-on-surface shrink-0 transition-colors duration-150"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
