/**
 * CallLayout.tsx
 * Active Simli video-call overlay — badge, PiP, controls, transcript.
 * Also exports shared call-stage layout class names used by Avatar and stages.
 */

"use client";

import { CallTranscript } from "@/components/call/CallTranscript";
import { PhoneEndIcon } from "@/components/ui/CallIcons";
import { CALL_OVERLAY_INSET_PX } from "@/lib/constants";

/** Minimum height for phone and video call containers (pipeline stays visible above). */
export const CALL_STAGE_MIN_HEIGHT_CLASS = "call-stage-min-h";

/** Viewport height fraction for call containers — must stay below 100vh. */
export const CALL_STAGE_MIN_HEIGHT_VH = 92;

/** Centered persona video frame — sized to keep face visible above bottom chrome. */
export const CALL_PERSONA_VIDEO_FRAME_CLASS = "call-persona-video-frame";

/** Persona WebRTC video inside the frame. */
export const CALL_PERSONA_VIDEO_CLASS = "call-persona-video";

/** Bottom gradient on the persona video for transcript blend. */
export const CALL_PERSONA_VIDEO_GRADIENT_CLASS = "call-persona-video-gradient";

/** Height reserved at bottom for video-call controls + transcript dock. */
export const CALL_VIDEO_BOTTOM_DOCK_PX = 118;

type CallLayoutProps = {
  stageLabel: string;
  formattedTimer: string;
  personaName: string;
  statusText?: string;
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
  "--call-video-dock-h": `${CALL_VIDEO_BOTTOM_DOCK_PX}px`,
} as React.CSSProperties;

const END_CALL_ICON_CLASS = "block h-[18px] w-[18px] shrink-0";

function MicIcon(): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicMutedIcon(): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CameraIcon(): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 2.5V8l-4 2.5z" />
    </svg>
  );
}

type VideoCallControlPillProps = {
  isMuted: boolean;
  isCameraOff: boolean;
  cameraUnavailable: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
};

/**
 * Video-call-only control bar with inline SVG icons (inline flow — not absolute).
 */
function VideoCallControlPill({
  isMuted,
  isCameraOff,
  cameraUnavailable,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: VideoCallControlPillProps): React.ReactElement {
  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-2 overflow-visible rounded-full border border-white/10 bg-black/70 px-2.5 py-1.5 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 transition-colors ${isMuted ? "border-error bg-error/90 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
      >
        {isMuted ? <MicMutedIcon /> : <MicIcon />}
      </button>

      <button
        type="button"
        onClick={onToggleCamera}
        disabled={cameraUnavailable}
        aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
      >
        <CameraIcon />
      </button>

      <button
        type="button"
        onClick={onEndCall}
        aria-label="End call"
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-visible rounded-full bg-red-600 p-0 leading-[0] text-white transition-colors hover:bg-red-700"
      >
        <PhoneEndIcon className={END_CALL_ICON_CLASS} />
      </button>
    </div>
  );
}

/**
 * Stitch video-call chrome: badge, timer, PiP, floating controls, bottom transcript.
 */
export function CallLayout({
  stageLabel,
  formattedTimer,
  personaName,
  statusText = "",
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
  const pipClass =
    "pointer-events-auto absolute right-4 top-[4.5rem] z-[25] h-24 w-32 rounded-xl border-2 border-white/20 object-cover shadow-lg scale-x-[-1]";

  return (
    <div
      className="absolute inset-0 z-10 overflow-visible pointer-events-none"
      style={callStyle}
    >
      {/* Top-left: stage badge + status stacked — no overlap */}
      <div className="pointer-events-none absolute left-6 top-4 z-20 flex max-w-[min(100%,420px)] flex-col items-start gap-2">
        <span className="call-stage-badge static pointer-events-auto">{stageLabel}</span>
        {statusText.length > 0 && (
          <p className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
            {statusText}
          </p>
        )}
      </div>

      <span className="call-timer-badge pointer-events-auto">{formattedTimer}</span>

      {showStudentPip && (
        <>
          <video
            ref={studentVideoRef}
            autoPlay
            muted
            playsInline
            className={`${pipClass} ${isCameraOff ? "opacity-0" : "opacity-100"}`}
          />
          {isCameraOff && (
            <div
              className={`${pipClass} flex items-center justify-center bg-call-background text-xs text-white/50 opacity-100`}
            >
              Camera off
            </div>
          )}
        </>
      )}

      {cameraUnavailable && !showStudentPip && (
        <div
          className={`${pipClass} flex items-center justify-center text-xs text-white/50 opacity-100`}
        >
          Camera unavailable
        </div>
      )}

      {/* Bottom dock: controls above transcript — never overlap */}
      <div className="call-video-bottom-dock pointer-events-none">
        <VideoCallControlPill
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          cameraUnavailable={cameraUnavailable}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onEndCall={onEndCall}
        />
        <div className="pointer-events-auto w-full max-w-3xl">
          <CallTranscript
            userText={userTranscripts}
            personaText={personaTranscripts}
            personaLabel={personaName}
            compact
          />
        </div>
      </div>
    </div>
  );
}
