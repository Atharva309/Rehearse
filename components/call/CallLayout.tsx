/**
 * CallLayout.tsx
 * Active Simli video-call overlay — badge, PiP, controls, transcript.
 * Also exports shared call-stage layout class names used by Avatar and stages.
 */

"use client";

import { CallControlPill } from "@/components/ui/CallControlPill";
import { CallTranscript } from "@/components/call/CallTranscript";
import {
  CALL_CONTROL_BAR_BOTTOM_PX,
  CALL_OVERLAY_INSET_PX,
} from "@/lib/constants";

/** Minimum height for phone and video call containers (pipeline stays visible above). */
export const CALL_STAGE_MIN_HEIGHT_CLASS = "call-stage-min-h";

/** Viewport height fraction for call containers — must stay below 100vh. */
export const CALL_STAGE_MIN_HEIGHT_VH = 85;

/** Centered persona video frame — 75% × 85% with dark border around it. */
export const CALL_PERSONA_VIDEO_FRAME_CLASS = "call-persona-video-frame";

/** Persona WebRTC video inside the frame. */
export const CALL_PERSONA_VIDEO_CLASS = "call-persona-video";

/** Bottom gradient on the persona video for transcript blend. */
export const CALL_PERSONA_VIDEO_GRADIENT_CLASS = "call-persona-video-gradient";

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
} as React.CSSProperties;

const pipVideoClass =
  "absolute bottom-6 right-6 z-20 w-48 h-36 rounded-xl object-cover border-2 border-white/20 shadow-lg pointer-events-auto scale-x-[-1]";

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
    <div
      className={`absolute inset-0 z-10 pointer-events-none flex flex-col ${CALL_STAGE_MIN_HEIGHT_CLASS}`}
      style={{ ...callStyle, minHeight: `${CALL_STAGE_MIN_HEIGHT_VH}vh` }}
    >
      <span className="call-stage-badge pointer-events-auto">{stageLabel}</span>
      <span className="call-timer-badge pointer-events-auto">{formattedTimer}</span>

      {showStudentPip && (
        <>
          <video
            ref={studentVideoRef}
            autoPlay
            muted
            playsInline
            className={`${pipVideoClass} ${isCameraOff ? "opacity-0" : "opacity-100"}`}
          />
          {isCameraOff && (
            <div
              className={`${pipVideoClass} flex items-center justify-center bg-call-background text-xs text-white/50 opacity-100`}
            >
              Camera off
            </div>
          )}
        </>
      )}

      {cameraUnavailable && !showStudentPip && (
        <div
          className={`${pipVideoClass} flex items-center justify-center text-xs text-white/50 opacity-100`}
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

      <div className="call-transcript-strip pointer-events-auto mt-auto">
        <CallTranscript
          userText={userTranscripts}
          personaText={personaTranscripts}
          personaLabel={personaName}
        />
      </div>
    </div>
  );
}
