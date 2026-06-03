/**
 * CallControlPill.tsx
 * Floating pill control bar for video and phone calls (Stitch design).
 */

"use client";

import { CameraIcon, MicIcon, MicMutedIcon, PhoneEndIcon } from "@/components/ui/CallIcons";

const ICON_CLASS = "w-[18px] h-[18px] shrink-0";

type CallControlPillProps = {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  showCamera?: boolean;
  isCameraOff?: boolean;
  isCameraDisabled?: boolean;
  onToggleCamera?: () => void;
};

/**
 * Renders mute, optional camera, and end-call controls in a centered floating pill.
 */
export function CallControlPill({
  isMuted,
  onToggleMute,
  onEndCall,
  showCamera = false,
  isCameraOff = false,
  isCameraDisabled = false,
  onToggleCamera,
}: CallControlPillProps): React.ReactElement {
  return (
    <div className="call-control-pill pointer-events-auto">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        className={`call-control-btn flex items-center justify-center ${isMuted ? "call-control-btn-muted" : "call-control-btn-default"}`}
      >
        {isMuted ? <MicMutedIcon className={ICON_CLASS} /> : <MicIcon className={ICON_CLASS} />}
      </button>

      {showCamera && onToggleCamera && (
        <button
          type="button"
          onClick={onToggleCamera}
          disabled={isCameraDisabled}
          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
          className="call-control-btn call-control-btn-default flex items-center justify-center disabled:opacity-40"
        >
          <CameraIcon className={ICON_CLASS} />
        </button>
      )}

      <button
        type="button"
        onClick={onEndCall}
        aria-label="End call"
        className="call-control-btn-end"
      >
        <PhoneEndIcon className={ICON_CLASS} />
        <span>End</span>
      </button>
    </div>
  );
}
