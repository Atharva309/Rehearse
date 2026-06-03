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
import { StageScoreReveal } from "@/components/StageScoreReveal";
import { resumePlaybackContext } from "@/lib/audio-playback";
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

  const { levels } = useAudioWaveform(
    phase === "active" ? videoCall.getAudioStream() : null
  );

  const context = {
    personaName: simulation.persona_name,
    personaRole: simulation.persona_role,
    personaSystemPrompt: simulation.persona_system_prompt,
    productContext: simulation.product_context,
    productName: simulation.title,
  };

  const handleJoinCall = useCallback((): void => {
    if (!videoCall.canJoin) {
      return;
    }

    void (async (): Promise<void> => {
      setPhase("connecting");
      try {
        await resumePlaybackContext();
        const audioStream = videoCall.getAudioStream();
        if (!audioStream) {
          setPhase("lobby");
          return;
        }
        await voice.startCall(audioStream);
        videoCall.startTimer();
        setPhase("active");
      } catch {
        setPhase("lobby");
      }
    })();
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
  }, [voice, attemptId, context, showToast]);

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
      <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-call-background">
        <div className="stage-content-card max-w-lg w-full">
          <StageScoreReveal
            score={score}
            feedback={feedback}
            advanceLabel="Next Stage →"
            onAdvance={onAdvance}
          />
          {scoreError.length > 0 && <p className="text-sm text-error mt-4">{scoreError}</p>}
        </div>
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
      onJoinCall={handleJoinCall}
    />
  );
}
