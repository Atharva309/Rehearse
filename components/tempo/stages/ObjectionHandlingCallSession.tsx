/**
 * ObjectionHandlingCallSession.tsx
 * Simli video call for Tempo Stage 4 — Dr. Saul Kim with visible avatar feed,
 * student PiP, objection tracker, and call controls.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  DR_KIM_SYSTEM_PROMPT,
  TEMPO_OBJECTIONS_OPENING_GREETING,
  TEMPO_OBJECTIONS_STAGE_HINT,
} from "@/lib/constants";
import { resumePlaybackContext } from "@/lib/audio-playback";
import {
  deriveObjectionTracker,
  formatObjectionTime,
  parseObjectionTranscript,
  type ObjectionTracker,
  type ObjectionTranscriptEntry,
} from "@/lib/tempo-objections";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import type { AvatarRef } from "@/types";

type ObjectionHandlingCallSessionProps = {
  faceId: string;
  audioStream: MediaStream;
  videoStream: MediaStream | null;
  onActive: () => void;
  onError: (message: string) => void;
  onTranscriptChange: (entries: ObjectionTranscriptEntry[]) => void;
  onTrackerChange: (tracker: ObjectionTracker) => void;
  onSecondsChange: (seconds: number) => void;
  onEnded: (
    transcriptText: string,
    seconds: number,
    entries: ObjectionTranscriptEntry[],
    tracker: ObjectionTracker
  ) => void;
};

/**
 * Waits until Avatar imperative handle and media elements are ready.
 */
async function waitForAvatarReady(
  getRef: () => AvatarRef | null,
  maxMs = 8000
): Promise<AvatarRef | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const avatar = getRef();
    if (avatar) {
      const domReady = await avatar.waitForMediaElements(2000);
      if (domReady) {
        return avatar;
      }
    }
    await new Promise<void>((r) => setTimeout(r, 100));
  }
  return getRef();
}

/**
 * Mounts Simli voice session with visible video avatar and student PiP.
 */
export function ObjectionHandlingCallSession({
  faceId,
  audioStream,
  videoStream,
  onActive,
  onError,
  onTranscriptChange,
  onTrackerChange,
  onSecondsChange,
  onEnded,
}: ObjectionHandlingCallSessionProps): React.ReactElement {
  const [connected, setConnected] = useState(false);
  const [isDrKimSpeaking, setIsDrKimSpeaking] = useState(false);
  const [isStudentSpeaking, setIsStudentSpeaking] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const connectStartedRef = useRef(false);
  const isMutedRef = useRef(false);
  const secondsRef = useRef(0);
  const studentVideoRef = useRef<HTMLVideoElement | null>(null);

  const voice = useSimulationVoiceSession({
    systemPrompt: DR_KIM_SYSTEM_PROMPT,
    stageHint: TEMPO_OBJECTIONS_STAGE_HINT,
    openingGreeting: TEMPO_OBJECTIONS_OPENING_GREETING,
    isMutedRef,
  });

  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const callbacksRef = useRef({ onActive, onError });
  callbacksRef.current = { onActive, onError };

  const [tracker, setTracker] = useState<ObjectionTracker>({
    price: false,
    priceHandled: false,
    adoption: false,
    adoptionHandled: false,
    statusQuo: false,
    statusQuoHandled: false,
  });

  // ── Student PiP video ───
  useEffect(() => {
    const el = studentVideoRef.current;
    if (!el || !videoStream) {
      return;
    }
    el.srcObject = videoStream;
    void el.play().catch(() => undefined);
  }, [videoStream]);

  useEffect(() => {
    if (!videoStream) {
      return;
    }
    videoStream.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOff;
    });
  }, [cameraOff, videoStream]);

  // ── Connect once on mount ───
  useEffect(() => {
    if (connectStartedRef.current) {
      return;
    }
    connectStartedRef.current = true;

    const run = async (): Promise<void> => {
      await resumePlaybackContext();

      const avatar = await waitForAvatarReady(() => voiceRef.current.avatarRef.current);
      if (!avatar) {
        callbacksRef.current.onError("Could not connect to Dr. Kim. Reload and try again.");
        return;
      }

      avatar.resumeAudioContext();

      const simliReady = await avatar.startSession();
      if (!simliReady) {
        callbacksRef.current.onError(
          "Could not connect to Dr. Kim in time. Check Simli keys and try again."
        );
        return;
      }

      if (audioStream.getAudioTracks().length === 0) {
        callbacksRef.current.onError("Microphone stream unavailable. Reload and try again.");
        return;
      }

      try {
        await voiceRef.current.startCall(audioStream);
        setConnected(true);
        callbacksRef.current.onActive();
      } catch {
        callbacksRef.current.onError("Could not start voice session. Reload and try again.");
      }
    };

    void run();
  }, [audioStream]);

  // ── Call timer ───
  useEffect(() => {
    if (!connected) {
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      secondsRef.current = elapsed;
      setSeconds(elapsed);
    }, 1000);
    return () => window.clearInterval(id);
  }, [connected]);

  useEffect(() => {
    onSecondsChange(seconds);
  }, [seconds, onSecondsChange]);

  // ── Live transcript + objection tracker ───
  useEffect(() => {
    if (!connected) {
      return;
    }
    const raw = voiceRef.current.getFullTranscript();
    const entries = parseObjectionTranscript(raw, secondsRef.current);
    const nextTracker = deriveObjectionTracker(entries);
    setTracker(nextTracker);
    onTranscriptChange(entries);
    onTrackerChange(nextTracker);
  }, [voice.userTranscripts, voice.personaTranscripts, connected, onTranscriptChange, onTrackerChange]);

  // ── Speaking indicators ───
  useEffect(() => {
    if (!voice.personaTranscripts || !connected) {
      return;
    }
    setIsDrKimSpeaking(true);
    const timer = window.setTimeout(() => setIsDrKimSpeaking(false), 2500);
    return () => window.clearTimeout(timer);
  }, [voice.personaTranscripts, connected]);

  useEffect(() => {
    if (!voice.userTranscripts || !connected) {
      return;
    }
    setIsStudentSpeaking(true);
    const timer = window.setTimeout(() => setIsStudentSpeaking(false), 2000);
    return () => window.clearTimeout(timer);
  }, [voice.userTranscripts, connected]);

  const toggleMute = useCallback((): void => {
    setMicMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      audioStream.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, [audioStream]);

  const toggleCamera = useCallback((): void => {
    setCameraOff((prev) => !prev);
  }, []);

  const handleEndCall = useCallback((): void => {
    const finalSeconds = secondsRef.current;
    voiceRef.current.endCall();
    audioStream.getTracks().forEach((track) => track.stop());
    videoStream?.getTracks().forEach((track) => track.stop());
    const raw = voiceRef.current.getFullTranscript();
    const entries = parseObjectionTranscript(raw, finalSeconds);
    const finalTracker = deriveObjectionTracker(entries);
    onEnded(raw, finalSeconds, entries, finalTracker);
  }, [audioStream, videoStream, onEnded]);

  const objectionChips = [
    { label: "Price", raised: tracker.price, handled: tracker.priceHandled },
    { label: "Adoption", raised: tracker.adoption, handled: tracker.adoptionHandled },
    { label: "Status Quo", raised: tracker.statusQuo, handled: tracker.statusQuoHandled },
  ] as const;

  return (
    <section className="flex-1 bg-[#0a0a0a] relative flex flex-col min-w-0 overflow-hidden">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex gap-3 flex-wrap justify-center px-4 pointer-events-none">
        {objectionChips.map((obj) => (
          <div
            key={obj.label}
            className={`px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-lg border pointer-events-auto ${
              obj.handled
                ? "bg-green-900/40 border-green-600/40 text-green-300"
                : obj.raised
                  ? "bg-amber-900/40 border-tertiary/30 text-tertiary-fixed"
                  : "glass-panel text-outline-variant/50 border-white/5"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                obj.handled
                  ? "bg-green-400"
                  : obj.raised
                    ? "bg-tertiary-fixed animate-pulse"
                    : "bg-outline-variant/30"
              }`}
            />
            <span className="text-body-md font-bold uppercase tracking-wider">{obj.label}</span>
            {obj.handled && <MaterialIcon name="check" className="text-green-300 text-[16px]" />}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-4 min-h-0">
        {!connected ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-tertiary-container rounded-full animate-spin" />
            <p className="mt-4 text-sm text-white/70">Connecting to Dr. Saul Kim…</p>
            <div className="pointer-events-none absolute opacity-0 h-px w-px overflow-hidden">
              <Avatar ref={voice.avatarRef} faceId={faceId} />
            </div>
          </div>
        ) : (
          <div
            className={`relative w-full max-w-4xl aspect-video max-h-[min(56vh,calc(100%-1rem))] rounded-3xl overflow-hidden transition-all duration-700 ${
              isDrKimSpeaking ? "speaking-ring-gold" : "border border-white/10"
            }`}
          >
            <div className="absolute inset-0">
              <Avatar ref={voice.avatarRef} faceId={faceId} />
            </div>

            <div className="absolute bottom-6 left-6 glass-panel px-4 py-2 rounded-xl flex flex-col">
              <span className="text-white font-bold text-title-lg">Dr. Saul Kim</span>
              <span className="text-white/60 text-body-md">Founder & Owner</span>
            </div>

            <div
              className={`absolute bottom-6 right-6 w-48 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-800 ${
                isStudentSpeaking ? "speaking-ring-blue" : ""
              }`}
            >
              {videoStream && !cameraOff ? (
                <video
                  ref={studentVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                  <MaterialIcon name="person" className="text-white/40 text-4xl" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded uppercase tracking-tighter">
                You (Student)
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 py-5 px-4 flex items-center justify-center gap-6 border-t border-white/10 bg-black/30 backdrop-blur-md">
        {connected && (
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mr-2">
            <MaterialIcon name="timer" className="text-white/60 text-[18px]" />
            <span className="font-code-md text-white/80">{formatObjectionTime(seconds)}</span>
          </div>
        )}
        {[
          { icon: "mic" as const, muted: micMuted, onClick: toggleMute },
          { icon: "videocam" as const, muted: cameraOff, onClick: toggleCamera },
        ].map((ctrl) => (
          <button
            key={ctrl.icon}
            type="button"
            onClick={ctrl.onClick}
            disabled={!connected}
            className={`w-14 h-14 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-40 ${
              ctrl.muted ? "bg-error/80" : ""
            }`}
          >
            <MaterialIcon
              name={
                ctrl.icon === "mic"
                  ? micMuted
                    ? "mic_off"
                    : "mic"
                  : cameraOff
                    ? "videocam_off"
                    : "videocam"
              }
            />
          </button>
        ))}
        <button
          type="button"
          onClick={handleEndCall}
          disabled={!connected}
          className="w-20 h-14 rounded-3xl bg-error flex items-center justify-center text-white hover:opacity-90 shadow-lg shadow-error/20 transition-all disabled:opacity-40"
        >
          <MaterialIcon name="call_end" className="font-bold" />
        </button>
        <button
          type="button"
          disabled={!connected}
          className="w-14 h-14 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-40"
        >
          <MaterialIcon name="closed_caption" />
        </button>
        <button
          type="button"
          disabled={!connected}
          className="w-14 h-14 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-40"
        >
          <MaterialIcon name="more_horiz" />
        </button>
      </div>
    </section>
  );
}
