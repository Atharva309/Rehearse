/**
 * CallControlPill.tsx
 * Floating pill control bar for video and phone calls (Stitch design).
 */

"use client";

import { CameraIcon, MicIcon, MicMutedIcon, PhoneEndIcon } from "@/components/ui/CallIcons";

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
        className={`call-control-btn ${isMuted ? "call-control-btn-muted" : "call-control-btn-default"}`}
      >
        {isMuted ? <MicMutedIcon /> : <MicIcon />}
      </button>

      {showCamera && onToggleCamera && (
        <button
          type="button"
          onClick={onToggleCamera}
          disabled={isCameraDisabled}
          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
          className="call-control-btn call-control-btn-default disabled:opacity-40"
        >
          <CameraIcon />
        </button>
      )}

      <button
        type="button"
        onClick={onEndCall}
        aria-label="End call"
        className="call-control-btn call-control-btn-end gap-2"
      >
        <PhoneEndIcon />
        <span>End</span>
      </button>
    </div>
  );
}
