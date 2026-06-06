/**
 * CallLobby.tsx
 * Stitch pre-call lobby — two-column waiting room inside the call box.
 */

"use client";

type CallLobbyProps = {
  stageLabel: string;
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function MicIcon({ filled = false }: { filled?: boolean }): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
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
  );
}

function CameraIcon({ filled = false }: { filled?: boolean }): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 2.5V8l-4 2.5z" />
    </svg>
  );
}

function ArrowForwardIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-transform group-hover:translate-x-0.5"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function VerifiedIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/**
 * Stitch waiting-room card — centered inside the dark call container.
 */
export function CallLobby({
  stageLabel,
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
  const stageBadge = stageLabel.toUpperCase();

  return (
    <div className="flex h-full min-h-[600px] w-full items-center justify-center p-6 lg:p-8">
      <div className="flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#c5c5d7] bg-white/70 shadow-[0px_12px_24px_rgba(0,0,0,0.05)] backdrop-blur-md md:flex-row">
        {/* Left — interviewer profile */}
        <div className="flex w-full flex-col border-b border-[#c5c5d7]/30 bg-[#f0f3ff]/50 p-10 md:w-2/5 md:border-b-0 md:border-r">
          <div className="mb-12">
            <span className="rounded-lg bg-[#dfe8ff] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#2036bd]">
              {stageBadge}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#3e52d5] text-4xl font-bold tracking-tight text-[#d7daff] shadow-lg ring-4 ring-white">
                {getInitials(personaName)}
              </div>
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-green-500" />
            </div>
            <h2 className="mb-1 text-[32px] font-semibold leading-10 tracking-tight text-[#111c2d]">
              {personaName}
            </h2>
            <p className="mb-8 text-lg text-[#454654]">{personaRole}</p>
            <div className="flex items-center gap-3 rounded-full bg-[#dfe8ff] px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-[#2036bd]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2036bd]" />
              Waiting to join
            </div>
          </div>

          <div className="mt-auto border-t border-[#c5c5d7]/30 pt-8">
            <div className="flex items-center gap-4 text-[#454654]">
              <VerifiedIcon />
              <span className="font-mono text-xs font-medium">Identity verified by PitchLab</span>
            </div>
          </div>
        </div>

        {/* Right — camera preview and join */}
        <div className="flex w-full flex-col bg-white p-10 md:w-3/5">
          <div className="mb-8">
            <h1 className="mb-4 text-[32px] font-semibold leading-10 tracking-tight text-[#111c2d]">
              Ready to meet {personaName}?
            </h1>
            <p className="max-w-lg text-base leading-6 text-[#454654]">
              {personaName} is ready for your {personaRole.toLowerCase()} conversation. Allow
              camera and microphone access, then join when you&apos;re set.
            </p>
          </div>

          <div className="group relative mb-8 min-h-[240px] flex-1 overflow-hidden rounded-xl border border-[#c5c5d7] bg-[#111c2d] shadow-inner">
            {showStudentPip ? (
              <video
                ref={studentVideoRef}
                className="h-full min-h-[240px] w-full object-cover opacity-90 transition-opacity group-hover:opacity-100 scale-x-[-1]"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="flex h-full min-h-[240px] w-full items-center justify-center text-sm text-white/50">
                {cameraUnavailable ? "Camera unavailable" : "Camera preview…"}
              </div>
            )}

            <div className="absolute left-4 top-4">
              <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 font-mono text-xs text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                You
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/70 text-[#111c2d] backdrop-blur-md"
                title="Microphone"
              >
                <MicIcon />
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/70 text-[#111c2d] backdrop-blur-md"
                title="Camera"
              >
                <CameraIcon />
              </div>
            </div>
          </div>

          {permissionError.length > 0 && (
            <p className="mb-4 text-sm text-error">{permissionError}</p>
          )}

          {isPermissionPending && (
            <p className="mb-4 text-sm text-[#454654]">Requesting camera and microphone…</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={`flex items-center gap-2 ${micReady ? "text-[#2036bd]" : "text-error"}`}
              >
                <MicIcon filled={micReady} />
                <div className="flex h-3 items-end gap-0.5">
                  <div className="h-1 w-0.5 rounded-full bg-current" />
                  <div className="h-2 w-0.5 animate-bounce rounded-full bg-current" />
                  <div className="h-3 w-0.5 rounded-full bg-current" />
                  <div className="h-1 w-0.5 rounded-full bg-current" />
                </div>
              </div>
              <div
                className={`flex items-center gap-2 font-mono text-xs uppercase tracking-tight ${cameraReady && !cameraUnavailable ? "text-[#2036bd]" : "text-error"}`}
              >
                <CameraIcon filled={cameraReady && !cameraUnavailable} />
                <span>{cameraReady && !cameraUnavailable ? "HD Active" : "Camera off"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onJoinCall}
              disabled={!canJoin || isPermissionPending}
              className="group flex items-center gap-3 rounded-xl bg-[#2036bd] px-10 py-4 text-xl font-semibold text-white shadow-[0_4px_12px_rgba(32,54,189,0.3)] transition-all hover:bg-[#3e52d5] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join Call
              <ArrowForwardIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
