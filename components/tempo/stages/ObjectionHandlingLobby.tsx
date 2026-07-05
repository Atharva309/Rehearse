/**
 * ObjectionHandlingLobby.tsx
 * Pre-call lobby for Tempo Stage 4 — Dr. Kim briefing card in the center column.
 * Mic and camera are acquired when the student clicks Join Call.
 */

"use client";

import { useCallback, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export type ObjectionJoinStreams = {
  audioStream: MediaStream;
  videoStream: MediaStream | null;
};

type ObjectionHandlingLobbyProps = {
  connectError: string;
  onJoin: (streams: ObjectionJoinStreams) => void;
};

/**
 * Center-column pre-call lobby with Dr. Kim profile and Join Call action.
 */
export function ObjectionHandlingLobby({
  connectError,
  onJoin,
}: ObjectionHandlingLobbyProps): React.ReactElement {
  const [deviceError, setDeviceError] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = useCallback(async (): Promise<void> => {
    setDeviceError("");
    setJoining(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      if (audioTracks.length === 0) {
        setDeviceError("Microphone access is required to join the call.");
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const audioStream = new MediaStream(audioTracks);
      const videoStream = videoTracks.length > 0 ? new MediaStream(videoTracks) : null;

      onJoin({ audioStream, videoStream });
    } catch {
      setDeviceError(
        "Could not access microphone or camera. Allow permissions in your browser settings and try again."
      );
    } finally {
      setJoining(false);
    }
  }, [onJoin]);

  return (
    <div className="flex-grow bg-surface-container-low flex items-center justify-center p-gutter overflow-y-auto min-w-0 flex-1">
      <div className="max-w-2xl w-full">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-10 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="w-24 h-24 rounded-full bg-[#1a1a2e] flex items-center justify-center text-tertiary-fixed text-headline-md font-bold mb-6 ring-4 ring-surface-container-high">
            SK
          </div>

          <h2 className="text-headline-md font-headline-md text-on-surface">Dr. Saul Kim</h2>
          <p className="text-body-lg text-on-surface-variant mb-2">Practice Owner & Founder</p>
          <p className="text-body-md text-on-surface-variant mb-2">Summit Dental Group</p>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest rounded-full mb-10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-body-md font-medium text-on-surface">Ready · Waiting on call</span>
          </div>

          <div className="w-full bg-surface-container-low p-6 rounded-xl border-l-4 border-primary italic mb-10 text-left relative">
            <MaterialIcon
              name="format_quote"
              className="text-outline-variant absolute -translate-y-4 -translate-x-2"
            />
            <p className="text-body-lg leading-relaxed text-on-surface-variant relative z-10">
              &ldquo;Eight locations times that price adds up fast — is it really worth it? My staff
              are already stretched thin; I&apos;m not looking to buy them more homework.&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1.5 rounded-full font-bold text-body-md">
              <MaterialIcon name="monetization_on" className="text-[18px]" />
              Price Sensitive
            </div>
            <div className="flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1.5 rounded-full font-bold text-body-md">
              <MaterialIcon name="psychology_alt" className="text-[18px]" />
              Evasion Patterns
            </div>
            <div className="flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed px-4 py-1.5 rounded-full font-bold text-body-md">
              <MaterialIcon name="verified" className="text-[18px]" />
              Softening Required
            </div>
          </div>

          {(deviceError.length > 0 || connectError.length > 0) && (
            <p className="text-sm text-error mb-4">{deviceError || connectError}</p>
          )}

          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={joining}
            className="w-64 bg-[#1a1a2e] hover:bg-[#252545] text-white py-4 rounded-xl font-bold text-title-lg transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-[#1a1a2e]/20 disabled:opacity-60"
          >
            <MaterialIcon name="video_call" filled />
            {joining ? "Connecting…" : "Join Call"}
          </button>

          <p className="mt-6 text-body-md text-on-surface-variant/60">Estimated duration: 15 minutes</p>
        </div>
      </div>
    </div>
  );
}
