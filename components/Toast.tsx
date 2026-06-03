/**
 * Toast.tsx
 * Renders active toast notifications (Stitch — top right, auto-dismiss).
 */

"use client";

import { useToast } from "@/hooks/useToast";

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
          className={`pointer-events-auto px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${
            toast.variant === "success"
              ? "bg-page border-success/40 text-text-primary"
              : toast.variant === "error"
                ? "bg-page border-error/40 text-error"
                : "bg-page border-border text-text-primary"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-text-secondary hover:text-text-primary shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
