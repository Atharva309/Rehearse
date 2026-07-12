/**
 * GoToCrmButton.tsx
 * Fixed floating control — opens Rehearse CRM from any Tempo stage (including full-screen calls).
 */

"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

type GoToCrmButtonProps = {
  onClick: () => void;
  /** When true, pulse to prompt the student to fill the pending CRM log. */
  needsLogging?: boolean;
};

/**
 * Persistent “Go to CRM” button visible above Tempo stage UIs.
 */
export function GoToCrmButton({
  onClick,
  needsLogging = false,
}: GoToCrmButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-xl bg-[#0f4c4c] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:brightness-110 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
        needsLogging ? "crm-needs-logging-pulse" : ""
      }`}
      aria-label={needsLogging ? "Go to CRM — fill out CRM to proceed" : "Go to CRM"}
      title={needsLogging ? "Fill out CRM to proceed" : undefined}
    >
      <MaterialIcon name="hub" className="text-[18px]" />
      {needsLogging ? "Fill out CRM to proceed" : "Go to CRM"}
    </button>
  );
}
