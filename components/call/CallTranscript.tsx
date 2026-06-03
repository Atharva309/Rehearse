/**
 * CallTranscript.tsx
 * Bottom transcript strip for active calls (Stitch design).
 */

"use client";

import { useEffect, useRef } from "react";
import { CALL_TRANSCRIPT_MAX_HEIGHT_PX } from "@/lib/constants";

type CallTranscriptProps = {
  userText: string;
  personaText: string;
  personaLabel?: string;
  /** Shorter max height for video call bottom dock. */
  compact?: boolean;
};

/**
 * Scrollable transcript bubbles inside the bottom call strip.
 */
export function CallTranscript({
  userText,
  personaText,
  personaLabel = "Persona",
  compact = false,
}: CallTranscriptProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [userText, personaText]);

  const hasContent = userText.length > 0 || personaText.length > 0;

  const maxHeight = compact ? 96 : CALL_TRANSCRIPT_MAX_HEIGHT_PX;

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto rounded-lg bg-black/50 border border-white/10 px-4 py-3"
      style={{ maxHeight }}
    >
      <div className="flex flex-col gap-2 text-sm">
        {userText.length > 0 && (
          <div className="flex justify-start">
            <span className="text-white/90 bg-white/10 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%]">
              <span className="text-[10px] uppercase text-white/40 block mb-0.5">You</span>
              {userText}
            </span>
          </div>
        )}
        {personaText.length > 0 && (
          <div className="flex justify-end">
            <span className="text-white bg-accent/30 border border-accent/40 px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%]">
              <span className="text-[10px] uppercase text-white/50 block mb-0.5">
                {personaLabel}
              </span>
              {personaText}
            </span>
          </div>
        )}
        {!hasContent && (
          <p className="text-center text-white/40 text-xs italic">
            Live transcript will appear here…
          </p>
        )}
      </div>
    </div>
  );
}
