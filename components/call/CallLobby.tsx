/**
 * CallLobby.tsx
 * Stitch pre-call lobby — two-column layout before a Simli video call.
 */

"use client";

import { PersonaInitials } from "@/components/ui/PersonaInitials";

type CallLobbyProps = {
  personaName: string;
  personaRole: string;
  permissionError: string;
  canJoin: boolean;
  isPermissionPending: boolean;
  studentVideoRef: React.RefCallback<HTMLVideoElement | null>;
  showStudentPip: boolean;
  cameraUnavailable: boolean;
  micReady: boolean;
  cameraReady: boolean;
  onJoinCall: () => void;
};

function DeviceStatusIcon({
  label,
  ready,
  children,
}: {
  label: string;
  ready: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm ${ready ? "text-success" : "text-error"}`}
      title={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Full-screen dark lobby with persona panel and device check column.
 */
export function CallLobby({
  personaName,
  personaRole,
  permissionError,
  canJoin,
  isPermissionPending,
  studentVideoRef,
  showStudentPip,
  cameraUnavailable,
  micReady,
  cameraReady,
  onJoinCall,
}: CallLobbyProps): React.ReactElement {
  return (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center p-6 lg:p-10">
      <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-[45%_55%] lg:gap-10">
        {/* Left — persona waiting card */}
        <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-call-background to-call-background" />
          <div className="relative z-10 flex flex-col items-center">
            <PersonaInitials name={personaName} />
            <p className="mt-6 text-xl font-semibold">{personaName}</p>
            <p className="mt-1 text-sm text-white/60">{personaRole}</p>
            <p className="mt-4 text-xs uppercase tracking-wider text-white/40">Waiting to join</p>
          </div>
        </div>

        {/* Right — heading, camera preview, device status, join */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold">Ready to meet {personaName}?</h2>
            <p className="mt-1 text-sm text-white/60">{personaRole}</p>
          </div>

          <div className="relative h-[200px] w-full max-w-[320px] overflow-hidden rounded-xl border border-white/20 bg-black/40">
            {showStudentPip ? (
              <video
                ref={studentVideoRef}
                className="h-full w-full object-cover scale-x-[-1]"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                {cameraUnavailable ? "Camera unavailable" : "Camera preview…"}
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
              You
            </span>
          </div>

          <div className="flex items-center gap-6">
            <DeviceStatusIcon label="Camera" ready={cameraReady && !cameraUnavailable}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 2.5V8l-4 2.5z" />
              </svg>
            </DeviceStatusIcon>
            <DeviceStatusIcon label="Microphone" ready={micReady}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </DeviceStatusIcon>
          </div>

          {permissionError.length > 0 && (
            <p className="text-sm text-error">{permissionError}</p>
          )}

          {isPermissionPending && (
            <p className="text-sm text-white/50">Requesting camera and microphone…</p>
          )}

          <button
            type="button"
            onClick={onJoinCall}
            disabled={!canJoin || isPermissionPending}
            className="btn-call-join mt-2 w-auto self-start px-8"
          >
            Join Call
          </button>
        </div>
      </div>
    </div>
  );
}
