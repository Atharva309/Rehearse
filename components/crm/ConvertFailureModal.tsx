/**
 * ConvertFailureModal.tsx
 * Manager-feedback dialog when Lead selection fails.
 * Matches HandoffModal visual language — dimmed backdrop + centered card.
 */

"use client";

import { useEffect, useState } from "react";

type ConvertFailureModalProps = {
  managerNote: string;
  onDismiss: () => void;
};

/**
 * Centered manager-note modal for failed Lead selection.
 */
export function ConvertFailureModal({
  managerNote,
  onDismiss,
}: ConvertFailureModalProps): React.ReactElement {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 modal-overlay animate-overlay-in"
      onClick={onDismiss}
      role="presentation"
    >
      <div
        className={`bg-surface-container-lowest w-full max-w-[560px] rounded-xl shadow-xl overflow-hidden border border-outline-variant transition-all duration-300 ${
          entered ? "animate-modal-in" : "opacity-0 scale-95 translate-y-2"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-failure-title"
      >
        <div className="px-4 py-2 flex justify-between items-center bg-primary-container">
          <span className="font-code-md text-[10px] tracking-widest text-on-primary uppercase">
            MESSAGE FROM YOUR MANAGER
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-headline-md bg-secondary-fixed text-on-secondary-fixed">
              AT
            </div>
            <div>
              <h2 id="convert-failure-title" className="font-headline-md text-on-surface">
                Alex Torres
              </h2>
              <p className="font-label-sm text-on-surface-variant">Senior Sales Manager</p>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-r-lg border-l-4 border-tertiary-container">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6c3a00] mb-2">
              A note from your manager
            </p>
            <p className="font-body-lg text-on-surface leading-relaxed italic">{managerNote}</p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full h-12 rounded-lg font-headline-md flex items-center justify-center gap-2 bg-primary-container text-white font-bold hover:bg-primary transition-all active:scale-[0.98]"
          >
            Got it
          </button>
        </div>

        <div className="h-1 bg-gradient-to-r from-tertiary-container via-secondary-fixed to-secondary-container opacity-50" />
      </div>
    </div>
  );
}
