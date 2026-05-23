/**
 * EndCallModal.tsx
 * Confirmation dialog before ending a live call (Stitch dark modal).
 */

"use client";

type EndCallModalProps = {
  personaName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal overlay asking the student to confirm ending the call.
 */
export function EndCallModal({
  personaName,
  onConfirm,
  onCancel,
}: EndCallModalProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-call-title"
    >
      <div className="card-surface bg-call-background border-white/10 p-6 max-w-md w-full shadow-2xl text-white">
        <h2 id="end-call-title" className="text-lg font-semibold">
          End this call?
        </h2>
        <p className="text-sm text-white/60 mt-2">
          Your conversation with {personaName} will be scored. You cannot return to this call after
          ending it.
        </p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-white/80 border border-white/20 rounded-md hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-error text-white rounded-md hover:opacity-90"
          >
            End call
          </button>
        </div>
      </div>
    </div>
  );
}
