/**
 * ConfirmModal.tsx
 * Reusable confirmation dialog with open/close animations.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfessorButtonContent } from "@/components/professor/ProfessorSpinner";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
  confirmingLabel?: string;
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
  isConfirming = false,
  confirmingLabel = "Deleting...",
  onConfirm,
  onCancel,
}: ConfirmModalProps): React.ReactElement {
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = useCallback((): void => {
    if (isConfirming) return;
    setIsClosing(true);
    window.setTimeout(onCancel, 150);
  }, [isConfirming, onCancel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 ${
        isClosing ? "animate-overlay-out" : "animate-overlay-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className={`card-surface p-6 max-w-md w-full shadow-xl ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-text-primary">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={requestClose}
            disabled={isConfirming}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md text-text-primary hover:bg-surface transition-colors duration-150 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 text-sm font-semibold rounded-md text-white transition-opacity duration-150 disabled:opacity-70 disabled:cursor-not-allowed ${
              isDestructive ? "bg-error hover:opacity-90" : "bg-primary hover:opacity-90"
            }`}
          >
            <ProfessorButtonContent isLoading={isConfirming} loadingText={confirmingLabel}>
              {confirmLabel}
            </ProfessorButtonContent>
          </button>
        </div>
      </div>
    </div>
  );
}
