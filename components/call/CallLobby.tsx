/**
 * CallLobby.tsx
 * Stitch pre-call lobby — host panel + student PiP + join CTA. No Simli until join.
 */

"use client";

import { PersonaInitials } from "@/components/ui/PersonaInitials";
import {
  CALL_OVERLAY_INSET_PX,
  PIP_HEIGHT_PX,
  PIP_WIDTH_PX,
  PIP_BORDER_RADIUS_PX,
} from "@/lib/constants";

type CallLobbyProps = {
  personaName: string;
  personaRole: string;
  permissionError: string;
  canJoin: boolean;
  isPermissionPending: boolean;
  studentVideoRef: React.RefCallback<HTMLVideoElement | null>;
  showStudentPip: boolean;
  cameraUnavailable: boolean;
  onJoinCall: () => void;
};

const lobbyStyle = {
  "--call-inset": `${CALL_OVERLAY_INSET_PX}px`,
  "--pip-width": `${PIP_WIDTH_PX}px`,
  "--pip-height": `${PIP_HEIGHT_PX}px`,
  "--pip-radius": `${PIP_BORDER_RADIUS_PX}px`,
} as React.CSSProperties;

/**
 * Full-screen dark lobby with two panels before a Simli video call.
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
  onJoinCall,
}: CallLobbyProps): React.ReactElement {
  return (
    <div className="call-screen-root flex flex-col" style={lobbyStyle}>
      <div className="flex-1 grid lg:grid-cols-2 gap-6 p-6 lg:p-10 items-center max-w-6xl mx-auto w-full">
        {/* Host / persona panel */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-call-background to-call-background" />
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <PersonaInitials name={personaName} />
            <p className="mt-6 text-xl font-semibold">{personaName}</p>
            <p className="text-sm text-white/60 mt-1">{personaRole}</p>
            <p className="text-xs text-white/40 mt-4 uppercase tracking-wider">Waiting to join</p>
          </div>
        </div>

        {/* Device check panel */}
        <div className="flex flex-col justify-center px-2 lg:px-8">
          <h2 className="text-2xl font-bold">Ready to meet {personaName}?</h2>
          <p className="text-sm text-white/60 mt-2">{personaRole}</p>
          <p className="text-sm text-white/50 mt-6 leading-relaxed">
            Check your camera and microphone before joining. Simli connects only after you tap Join
            Call.
          </p>

          {permissionError.length > 0 && (
            <p className="text-sm text-error mt-4">{permissionError}</p>
          )}

          {isPermissionPending && (
            <p className="text-sm text-white/50 mt-4">Requesting camera and microphone…</p>
          )}

          <button
            type="button"
            onClick={onJoinCall}
            disabled={!canJoin || isPermissionPending}
            className="btn-call-join mt-8 w-full sm:w-auto"
          >
            Join Call
          </button>
        </div>
      </div>

      {showStudentPip && (
        <div className="call-pip">
          <video
            ref={studentVideoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
          <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wide text-white/70 bg-black/50 px-2 py-0.5 rounded">
            You
          </span>
        </div>
      )}

      {cameraUnavailable && !showStudentPip && (
        <div
          className="call-pip flex items-center justify-center text-xs text-white/50"
          style={{ width: PIP_WIDTH_PX, height: PIP_HEIGHT_PX }}
        >
          Camera unavailable
        </div>
      )}
    </div>
  );
}
