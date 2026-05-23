/**
 * CallLayout.tsx
 * Active Simli video-call overlay — absolute layers over full-screen persona video.
 */

"use client";

import { CallControlPill } from "@/components/ui/CallControlPill";
import { CallTranscript } from "@/components/call/CallTranscript";
import {
  CALL_CONTROL_BAR_BOTTOM_PX,
  CALL_OVERLAY_INSET_PX,
  PIP_BORDER_RADIUS_PX,
  PIP_HEIGHT_PX,
  PIP_WIDTH_PX,
} from "@/lib/constants";

type CallLayoutProps = {
  stageLabel: string;
  formattedTimer: string;
  personaName: string;
  studentVideoRef: React.RefCallback<HTMLVideoElement | null>;
  showStudentPip: boolean;
  cameraUnavailable: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  userTranscripts: string;
  personaTranscripts: string;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
};

const callStyle = {
  "--call-inset": `${CALL_OVERLAY_INSET_PX}px`,
  "--call-controls-bottom": `${CALL_CONTROL_BAR_BOTTOM_PX}px`,
  "--pip-width": `${PIP_WIDTH_PX}px`,
  "--pip-height": `${PIP_HEIGHT_PX}px`,
  "--pip-radius": `${PIP_BORDER_RADIUS_PX}px`,
} as React.CSSProperties;

/**
 * Stitch video-call chrome: badge, timer, PiP, floating controls, bottom transcript.
 */
export function CallLayout({
  stageLabel,
  formattedTimer,
  personaName,
  studentVideoRef,
  showStudentPip,
  cameraUnavailable,
  isMuted,
  isCameraOff,
  userTranscripts,
  personaTranscripts,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: CallLayoutProps): React.ReactElement {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={callStyle}>
      <span className="call-stage-badge pointer-events-auto">{stageLabel}</span>
      <span className="call-timer-badge pointer-events-auto">{formattedTimer}</span>

      {showStudentPip && (
        <div className="call-pip pointer-events-auto">
          <video
            ref={studentVideoRef}
            className={`w-full h-full object-cover scale-x-[-1] ${isCameraOff ? "opacity-0" : "opacity-100"}`}
            autoPlay
            playsInline
            muted
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-call-background text-xs text-white/50">
              Camera off
            </div>
          )}
        </div>
      )}

      {cameraUnavailable && !showStudentPip && (
        <div
          className="call-pip flex items-center justify-center text-xs text-white/50 pointer-events-auto"
          style={{ width: PIP_WIDTH_PX, height: PIP_HEIGHT_PX }}
        >
          Camera unavailable
        </div>
      )}

      <CallControlPill
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onEndCall={onEndCall}
        showCamera
        isCameraOff={isCameraOff}
        isCameraDisabled={cameraUnavailable}
        onToggleCamera={onToggleCamera}
      />

      <div className="call-transcript-strip pointer-events-auto">
        <CallTranscript
          userText={userTranscripts}
          personaText={personaTranscripts}
          personaLabel={personaName}
        />
      </div>
    </div>
  );
}
