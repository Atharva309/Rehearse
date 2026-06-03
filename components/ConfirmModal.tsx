/**
 * ConfirmModal.tsx
 * Reusable confirmation dialog for destructive actions.
 */

"use client";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centered modal with Cancel and confirm actions.
 */
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="card-surface p-6 max-w-md w-full shadow-xl">
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-text-primary">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md text-text-primary hover:bg-surface"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-md text-white ${
              isDestructive ? "bg-error hover:opacity-90" : "bg-primary hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
