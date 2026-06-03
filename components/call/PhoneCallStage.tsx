/**
 * PhoneCallStage.tsx
 * Prospecting flow: lobby → connect → active phone UI → score (no Simli, no camera).
 */

"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { EndCallModal } from "@/components/call/EndCallModal";
import { PhoneCallLayout } from "@/components/call/PhoneCallLayout";
import { PhoneCallLobby } from "@/components/call/PhoneCallLobby";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CALL_SCORE_DELAY_MS } from "@/lib/constants";
import { useAudioWaveform } from "@/hooks/useAudioWaveform";
import { useProspectingVoice } from "@/hooks/useProspectingVoice";
import { useVideoCall } from "@/hooks/useVideoCall";
import { completeStage, fetchStageScore } from "@/lib/attempt-actions";
import type { Simulation } from "@/types";

type PhonePhase = "lobby" | "connecting" | "active" | "scoring" | "scored";

type PhoneCallStageProps = {
  simulation: Simulation;
  attemptId: string;
  stageHint: string;
  openingGreeting?: string;
  onAdvance: () => void;
};

/**
 * Orchestrates the prospecting phone-call experience end to end.
 */
export function PhoneCallStage({
  simulation,
  attemptId,
  stageHint,
  openingGreeting,
  onAdvance,
}: PhoneCallStageProps): React.ReactElement {
  const [phase, setPhase] = useState<PhonePhase>("lobby");
  const [showEndModal, setShowEndModal] = useState(false);
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | undefined>();
  const [scoreError, setScoreError] = useState("");
  const { showToast } = useToast();

  const videoCall = useVideoCall({ withVideo: false });

  const voice = useProspectingVoice({
    systemPrompt: simulation.persona_system_prompt,
    personaName: simulation.persona_name,
    stageHint,
    openingGreeting,
    isMutedRef: videoCall.isMutedRef,
  });

  const { levels } = useAudioWaveform(phase === "active" ? videoCall.audioStream : null);

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
  };

  const handleJoinCall = useCallback(async (): Promise<void> => {
    if (!videoCall.canJoin || !videoCall.audioStream) return;
    setPhase("connecting");
    try {
      await voice.startCall(videoCall.audioStream);
      videoCall.startTimer();
      setPhase("active");
    } catch {
      setPhase("lobby");
    }
  }, [videoCall, voice]);

  const runScoring = useCallback(async (): Promise<void> => {
    setPhase("scoring");
    setScoreError("");
    const transcript = voice.getFullTranscript();

    await new Promise<void>((r) => setTimeout(r, CALL_SCORE_DELAY_MS));

    try {
      const result = await fetchStageScore({
        stage: "prospecting",
        transcript,
        simulationContext: context,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      await completeStage(
        attemptId,
        "prospecting",
        result.score,
        result.feedback,
        transcript
      );
      setPhase("scored");
      showToast("Stage complete — score saved", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      setScoreError(err instanceof Error ? err.message : "Scoring failed");
      setPhase("active");
    }
  }, [voice, attemptId, context]);

  const handleConfirmEndCall = useCallback((): void => {
    setShowEndModal(false);
    voice.endCall();
    videoCall.stopTimer();
    videoCall.stopAllTracks();
    void runScoring();
  }, [voice, videoCall, runScoring]);

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
      <div className="space-y-6 card-surface p-6">
        <ScoreBadge score={score} />
        <p className="text-sm text-text-secondary leading-relaxed">{feedback}</p>
        {scoreError && <p className="text-sm text-error">{scoreError}</p>}
        <button type="button" onClick={onAdvance} className="btn-accent">
          Next Stage
        </button>
      </div>
    );
  }

  if (phase === "connecting") {
    return (
      <div className="call-screen-root flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-10 h-10 border-2 border-white/20 border-t-success rounded-full animate-spin" />
        <p className="mt-4 text-sm text-white/70">Calling {simulation.persona_name}…</p>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <>
        {showEndModal && (
          <EndCallModal
            personaName={simulation.persona_name}
            onConfirm={handleConfirmEndCall}
            onCancel={() => setShowEndModal(false)}
          />
        )}
        <PhoneCallLayout
          stage="prospecting"
          personaName={simulation.persona_name}
          personaRole={simulation.persona_role}
          formattedTimer={videoCall.formattedTimer}
          waveformLevels={levels}
          userTranscripts={voice.userTranscripts}
          personaTranscripts={voice.personaTranscripts}
          isMuted={videoCall.isMuted}
          onToggleMute={videoCall.toggleMute}
          onEndCall={() => setShowEndModal(true)}
        />
      </>
    );
  }

  return (
    <PhoneCallLobby
      personaName={simulation.persona_name}
      personaRole={simulation.persona_role}
      permissionError={videoCall.permissionError}
      canJoin={videoCall.canJoin}
      isPermissionPending={videoCall.permissionState === "pending"}
      onJoinCall={() => void handleJoinCall()}
    />
  );
}
