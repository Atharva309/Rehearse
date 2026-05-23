/**
 * PhoneCallLobby.tsx
 * Stitch pre-call screen for prospecting — dark full screen, initials, join CTA.
 */

"use client";

import { PersonaInitials } from "@/components/ui/PersonaInitials";

type PhoneCallLobbyProps = {
  personaName: string;
  personaRole: string;
  permissionError: string;
  canJoin: boolean;
  isPermissionPending: boolean;
  onJoinCall: () => void;
};

/**
 * Audio-only lobby before prospecting connects Deepgram/ElevenLabs.
 */
export function PhoneCallLobby({
  personaName,
  personaRole,
  permissionError,
  canJoin,
  isPermissionPending,
  onJoinCall,
}: PhoneCallLobbyProps): React.ReactElement {
  return (
    <div className="call-screen-root flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8">
        <span className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping scale-110" />
        <PersonaInitials name={personaName} />
      </div>

      <h2 className="text-2xl font-bold">Ready to call {personaName}?</h2>
      <p className="text-sm text-white/60 mt-2">{personaRole}</p>

      {permissionError.length > 0 && (
        <p className="text-sm text-error mt-6 max-w-md">{permissionError}</p>
      )}

      {isPermissionPending && (
        <p className="text-sm text-white/50 mt-6">Requesting microphone access…</p>
      )}

      <button
        type="button"
        onClick={onJoinCall}
        disabled={!canJoin || isPermissionPending}
        className="btn-call-join mt-10"
      >
        Join Call
      </button>
    </div>
  );
}
