/**
 * SimliCallStage.tsx
 * Orchestrates lobby → Simli connect → active call → score for Discovery, Objections, Close.
 * Avatar mounts once after Join Call and is not remounted until the call ends.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { Avatar } from "@/components/Avatar";
import { CallLayout } from "@/components/call/CallLayout";
import { CallLobby } from "@/components/call/CallLobby";
import { EndCallModal } from "@/components/call/EndCallModal";
import { StageScoreReveal } from "@/components/StageScoreReveal";
import { resumePlaybackContext } from "@/lib/audio-playback";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import { CALL_SCORE_DELAY_MS, SIMLI_CONNECT_TIMEOUT_MS } from "@/lib/constants";
import { getStageCallLabel } from "@/lib/stages";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import { useVideoCall } from "@/hooks/useVideoCall";
import type { Simulation, SimulationStage } from "@/types";

type CallPhase = "lobby" | "connecting" | "active" | "scoring" | "scored";

type SimliCallStageProps = {
  simulation: Simulation;
  attemptId: string;
  stage: SimulationStage;
  stageHint: string;
  openingGreeting: string;
  scoreStage: "discovery" | "objections" | "close";
  runningTotalScore?: number;
  scoreTranscriptExtra?: string;
  priorStagesSummary?: string;
  advanceLabel: string;
  onAdvance: () => void;
};

/**
 * Shared video-call flow for all Simli-powered simulation stages.
 */
export function SimliCallStage({
  simulation,
  attemptId,
  stage,
  stageHint,
  openingGreeting,
  scoreStage,
  runningTotalScore = 0,
  scoreTranscriptExtra = "",
  priorStagesSummary,
  advanceLabel,
  onAdvance,
}: SimliCallStageProps): React.ReactElement {
  const [phase, setPhase] = useState<CallPhase>("lobby");
  const [mountSimli, setMountSimli] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [scoreError, setScoreError] = useState("");
  const { showToast } = useToast();
  const videoCall = useVideoCall({ withVideo: true });
  const connectStartedRef = useRef(false);

  const voice = useSimulationVoiceSession({
    systemPrompt: simulation.persona_system_prompt,
    stageHint,
    openingGreeting,
    isMutedRef: videoCall.isMutedRef,
  });

  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const stageLabel = getStageCallLabel(stage);

  const handleJoinCall = useCallback((): void => {
    if (!videoCall.canJoin || !videoCall.audioStream) return;
    setConnectError("");
    connectStartedRef.current = false;
    void resumePlaybackContext();
    setMountSimli(true);
    setPhase("connecting");
  }, [videoCall.canJoin, videoCall.audioStream]);

  useEffect(() => {
    if (phase !== "connecting" || !mountSimli || connectStartedRef.current) return;

    const run = async (): Promise<void> => {
      connectStartedRef.current = true;

      let waited = 0;
      while (!voiceRef.current.avatarRef.current && waited < 5000) {
        await new Promise<void>((r) => setTimeout(r, 200));
        waited += 200;
      }

      const ready = await voiceRef.current.avatarRef.current?.waitUntilReady(
        SIMLI_CONNECT_TIMEOUT_MS
      );
      if (!ready) {
        setConnectError(
          `Could not connect to ${simulation.persona_name} in time. Check Simli keys and try again.`
        );
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
        return;
      }

      const audioStream = videoCall.audioStream;
      if (!audioStream) {
        setPhase("lobby");
        setMountSimli(false);
        connectStartedRef.current = false;
        return;
      }

      try {
        voiceRef.current.avatarRef.current?.resumeAudioContext();
        await voiceRef.current.startCall(audioStream);
        videoCall.startTimer();
        setPhase("active");
      } catch {
        setConnectError("Could not start voice session. Reload and try again.");
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
      }
    };

    void run();
  }, [phase, mountSimli, videoCall.audioStream, simulation.persona_name]);

  const runScoring = useCallback(async (): Promise<void> => {
    setPhase("scoring");
    setScoreError("");
    const transcript = voiceRef.current.getFullTranscript();
    const fullTranscript = scoreTranscriptExtra
      ? `${transcript}\n\n${scoreTranscriptExtra}`
      : transcript;

    await new Promise<void>((r) => setTimeout(r, CALL_SCORE_DELAY_MS));

    try {
      const result = await fetchStageScore({
        stage: scoreStage,
        transcript: fullTranscript,
        priorStagesSummary,
        simulationContext: {
          personaName: simulation.persona_name,
          personaRole: simulation.persona_role,
          personaSystemPrompt: simulation.persona_system_prompt,
          productContext: simulation.product_context,
          productName: simulation.title,
        },
        runningTotalScore,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(
        attemptId,
        scoreStage,
        result.score,
        result.feedback,
        fullTranscript
      );
      setPhase("scored");
      showToast("Stage complete — score saved", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      setScoreError(err instanceof Error ? err.message : "Scoring failed");
      setPhase("active");
      setMountSimli(true);
    }
  }, [
    scoreTranscriptExtra,
    priorStagesSummary,
    scoreStage,
    runningTotalScore,
    attemptId,
    simulation,
    showToast,
  ]);

  const handleConfirmEndCall = useCallback((): void => {
    setShowEndModal(false);
    voice.endCall();
    setMountSimli(false);
    videoCall.stopTimer();
    videoCall.stopAllTracks();
    void runScoring();
  }, [voice, videoCall, runScoring]);

  const showStudentPip =
    videoCall.permissionState === "ready" && !videoCall.cameraUnavailable;

  if (phase === "scoring") {
    return (
      <div className="call-screen-root flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-10 h-10 border-2 border-white/20 border-t-success rounded-full animate-spin" />
        <p className="mt-4 text-sm text-white/70">Scoring your conversation…</p>
      </div>
    );
  }

  if (phase === "scored" && score !== undefined && feedback) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-call-background">
        <div className="stage-content-card max-w-lg w-full">
          <StageScoreReveal
            score={score}
            feedback={feedback}
            advanceLabel={advanceLabel}
            onAdvance={onAdvance}
          />
          {scoreError.length > 0 && <p className="text-sm text-error mt-4">{scoreError}</p>}
        </div>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <>
        {connectError.length > 0 && (
          <p className="text-sm text-error mb-3">{connectError}</p>
        )}
        <CallLobby
          personaName={simulation.persona_name}
          personaRole={simulation.persona_role}
          permissionError={videoCall.permissionError}
          canJoin={videoCall.canJoin}
          isPermissionPending={videoCall.permissionState === "pending"}
          studentVideoRef={videoCall.studentVideoRef}
          showStudentPip={showStudentPip}
          cameraUnavailable={videoCall.cameraUnavailable}
          onJoinCall={handleJoinCall}
        />
      </>
    );
  }

  return (
    <div className="call-screen-root">
      {mountSimli && (
        <div
          className={`absolute inset-0 z-0 w-full h-full ${
            phase === "connecting" ? "opacity-0" : "opacity-100"
          } [&>div]:!max-w-none [&>div]:!w-full [&>div]:!h-full [&>div]:!aspect-auto [&>div]:!rounded-none [&>div]:!shadow-none [&_video]:!absolute [&_video]:!inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover`}
        >
          <Avatar ref={voice.avatarRef} />
        </div>
      )}

      {phase === "connecting" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-call-background">
          <div className="w-10 h-10 border-2 border-white/20 border-t-success rounded-full animate-spin" />
          <p className="mt-4 text-sm text-white/70">
            Connecting to {simulation.persona_name}…
          </p>
        </div>
      )}

      {phase === "active" && (
        <>
          {showEndModal && (
            <EndCallModal
              personaName={simulation.persona_name}
              onConfirm={handleConfirmEndCall}
              onCancel={() => setShowEndModal(false)}
            />
          )}
          <CallLayout
            stageLabel={stageLabel}
            formattedTimer={videoCall.formattedTimer}
            personaName={simulation.persona_name}
            studentVideoRef={videoCall.studentVideoRef}
            showStudentPip={showStudentPip}
            cameraUnavailable={videoCall.cameraUnavailable}
            isMuted={videoCall.isMuted}
            isCameraOff={videoCall.isCameraOff}
            userTranscripts={voice.userTranscripts}
            personaTranscripts={voice.personaTranscripts}
            onToggleMute={videoCall.toggleMute}
            onToggleCamera={videoCall.toggleCamera}
            onEndCall={() => setShowEndModal(true)}
          />
          {scoreError.length > 0 && (
            <p className="absolute bottom-2 left-4 z-30 text-sm text-error">{scoreError}</p>
          )}
        </>
      )}
    </div>
  );
}
