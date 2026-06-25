/**
 * DiscoveryLobby.tsx
 * Pre-call waiting room for Tempo Stage 2 Discovery.
 * The microphone and camera are acquired ONLY when the student clicks their
 * respective buttons (so the macOS hardware indicators never light up on load).
 * The acquired microphone stream is handed to the call session on Join Call.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type DiscoveryLobbyProps = {
  connectError: string;
  onJoin: (audioStream: MediaStream) => void;
};

/**
 * Two-column waiting room: Dana's profile and the device setup / Join Call panel.
 */
export function DiscoveryLobby({ connectError, onJoin }: DiscoveryLobbyProps): React.ReactElement {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [deviceError, setDeviceError] = useState("");

  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const handedOffRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop any preview tracks that were not handed off to the call session.
  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (!handedOffRef.current) {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleMic = useCallback(async (): Promise<void> => {
    setDeviceError("");
    if (micOn) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicOn(true);
    } catch {
      setDeviceError("Microphone access was blocked. Allow it in your browser settings to join.");
    }
  }, [micOn]);

  const toggleCamera = useCallback(async (): Promise<void> => {
    setDeviceError("");
    if (cameraOn) {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => undefined);
      }
      setCameraOn(true);
    } catch {
      setDeviceError("Camera access was blocked. You can still join with audio only.");
    }
  }, [cameraOn]);

  const handleJoin = useCallback((): void => {
    const stream = micStreamRef.current;
    if (!stream) {
      return;
    }
    // Camera is a setup preview only — this is an audio call.
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    handedOffRef.current = true;
    onJoin(stream);
  }, [onJoin]);

  return (
    <div className="fixed inset-0 z-[45] flex flex-col pt-16 overflow-y-auto bg-surface">
      <main className="flex-grow flex items-center justify-center p-4 sm:p-gutter relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[160px] -z-10" />

        <div className="w-full max-w-5xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant rounded-xl shadow-[0px_12px_24px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row">
          {/* Left: Dana profile */}
          <div className="w-full md:w-2/5 bg-surface-container-low/50 p-8 lg:p-10 flex flex-col border-b md:border-b-0 md:border-r border-outline-variant/40">
            <div className="mb-10">
              <span className="bg-surface-container-high text-primary font-label-sm text-label-sm px-3 py-1.5 rounded-lg tracking-wider font-bold">
                DISCOVERY · STAGE 2 OF 5
              </span>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-display text-display ring-4 ring-surface shadow-lg">
                  DR
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-surface rounded-full" />
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Dana Reyes</h2>
              <p className="text-on-surface-variant font-body-lg mb-8">
                Director of Operations · Summit Dental
              </p>
              <div className="flex items-center gap-3 py-2 px-4 bg-surface-container-high rounded-full text-primary font-label-sm text-label-sm uppercase tracking-widest">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Waiting to join
              </div>
            </div>
            <div className="mt-auto pt-8 border-t border-outline-variant/40">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <MaterialIcon name="verified" className="text-[20px]" />
                <span className="text-label-sm font-label-sm">8 dental practices, Colorado</span>
              </div>
            </div>
          </div>

          {/* Right: setup + join */}
          <div className="w-full md:w-3/5 p-8 lg:p-10 flex flex-col bg-surface-container-lowest">
            <div className="mb-6">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                Ready to meet Dana Reyes?
              </h1>
              <p className="text-on-surface-variant font-body-md leading-relaxed max-w-lg">
                Dana is the Director of Operations at Summit Dental Group. This is a 20-minute
                discovery call — uncover their scheduling and no-show challenges with smart
                questions. Don&apos;t pitch yet.
              </p>
            </div>

            {/* Camera preview */}
            <div className="relative flex-grow min-h-[220px] rounded-xl overflow-hidden bg-[#0a0a0a] border border-outline-variant shadow-inner mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`}
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2">
                  <MaterialIcon name="videocam_off" className="text-4xl" />
                  <span className="text-label-sm font-label-sm">Camera off (optional)</span>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <div className="bg-black/40 backdrop-blur-md text-white font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  YOU
                </div>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void toggleMic()}
                  title="Toggle Microphone"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    micOn
                      ? "bg-primary text-on-primary"
                      : "bg-white/90 text-on-surface hover:bg-white"
                  }`}
                >
                  <MaterialIcon name={micOn ? "mic" : "mic_off"} filled={micOn} />
                </button>
                <button
                  type="button"
                  onClick={() => void toggleCamera()}
                  title="Toggle Camera"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    cameraOn
                      ? "bg-primary text-on-primary"
                      : "bg-white/90 text-on-surface hover:bg-white"
                  }`}
                >
                  <MaterialIcon name={cameraOn ? "videocam" : "videocam_off"} filled={cameraOn} />
                </button>
              </div>
            </div>

            {(deviceError.length > 0 || connectError.length > 0) && (
              <p className="mb-4 text-sm text-error">{deviceError || connectError}</p>
            )}

            {/* Footer action bar */}
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 ${micOn ? "text-primary" : "text-on-surface-variant/50"}`}
                >
                  <MaterialIcon name={micOn ? "mic" : "mic_off"} className="text-[20px]" filled={micOn} />
                  <span className="text-label-sm font-label-sm uppercase tracking-tighter">
                    {micOn ? "Mic ready" : "Mic off"}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 ${cameraOn ? "text-primary" : "text-on-surface-variant/50"}`}
                >
                  <MaterialIcon
                    name={cameraOn ? "videocam" : "videocam_off"}
                    className="text-[20px]"
                    filled={cameraOn}
                  />
                  <span className="text-label-sm font-label-sm uppercase tracking-tighter">
                    {cameraOn ? "Camera on" : "Camera off"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoin}
                disabled={!micOn}
                className="bg-primary text-on-primary font-title-md text-title-md px-8 lg:px-10 py-4 rounded-xl shadow-[0_4px_12px_rgba(32,54,189,0.3)] hover:bg-primary-container transition-all active:scale-95 flex items-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {micOn ? "Join Call" : "Enable mic to join"}
                <MaterialIcon
                  name="arrow_forward"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
