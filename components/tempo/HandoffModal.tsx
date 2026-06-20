/**
 * HandoffModal.tsx
 * Manager handoff modal for Tempo simulation stages.
 * Overlays the page with blur backdrop; student must click Begin Stage to proceed.
 * Tempo / Rehearse Essentials only.
 */

"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export type HandoffModalProps = {
  stageNumber: number;
  stageName: string;
  stageIcon: string;
  message: string;
  hasAIRestriction: boolean;
  onBegin: () => void;
  onDismiss: () => void;
};

/**
 * Renders the manager handoff overlay with entry animation.
 */
export function HandoffModal({
  stageNumber,
  stageName,
  stageIcon,
  message,
  hasAIRestriction,
  onBegin,
  onDismiss,
}: HandoffModalProps): React.ReactElement {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onDismiss}
      role="presentation"
    >
      <div
        className={`bg-white w-full max-w-[560px] rounded-xl shadow-2xl overflow-hidden border border-outline-variant transition-all duration-500 ${
          entered ? "translate-y-0 opacity-100 scale-100" : "translate-y-5 opacity-0 scale-100"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-modal-title"
      >
        <div className="px-md py-xs flex justify-between items-center bg-black">
          <span className="font-code-md text-[10px] tracking-widest text-white/80 uppercase">
            MESSAGE FROM YOUR MANAGER
          </span>
          <span className="font-code-md text-[10px] tracking-widest text-white/80 uppercase">
            Stage {stageNumber} of 5
          </span>
        </div>

        <div className="p-lg space-y-lg">
          <div className="flex items-center gap-md">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-headline-md"
              style={{ backgroundColor: "#c6c4df", color: "#1a1a2e" }}
            >
              AT
            </div>
            <div>
              <h2 id="handoff-modal-title" className="font-headline-md text-on-surface">
                Alex Torres
              </h2>
              <p className="font-label-sm text-on-surface-variant">Senior Sales Manager</p>
            </div>
          </div>

          <div
            className="bg-surface-container-low p-md rounded-r-lg"
            style={{ borderLeft: "4px solid #c9a84c" }}
          >
            <p className="font-body-lg text-on-surface leading-relaxed italic">{message}</p>
          </div>

          <div className="bg-secondary-fixed/10 border border-secondary-fixed/20 p-md rounded-lg flex items-center justify-between gap-md">
            <div className="flex items-center gap-sm min-w-0">
              <div className="w-10 h-10 bg-secondary-fixed/20 rounded-lg flex items-center justify-center shrink-0">
                <MaterialIcon name={stageIcon} className="text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="font-label-sm text-secondary uppercase tracking-tight">Up next</p>
                <h3 className="font-headline-md text-on-surface">
                  Stage {stageNumber} — {stageName}
                </h3>
              </div>
            </div>
            {!hasAIRestriction ? (
              <div className="flex items-center gap-xs px-sm py-1 bg-green-100 rounded-full shrink-0">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                <span className="text-[11px] font-bold text-green-700 uppercase">
                  No AI restrictions
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-xs px-sm py-1 bg-amber-100 rounded-full shrink-0">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                <span className="text-[11px] font-bold text-amber-800 uppercase">No AI on call</span>
              </div>
            )}
          </div>

          <div className="pt-md">
            <button
              type="button"
              onClick={onBegin}
              className="w-full py-md rounded-lg font-headline-md flex items-center justify-center gap-sm hover:bg-primary transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#45455b", color: "#ffffff" }}
            >
              Begin Stage {stageNumber}
              <MaterialIcon name="arrow_forward" />
            </button>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-tertiary-container via-[#c6c4df] to-secondary-container opacity-50" />
      </div>
    </div>
  );
}
