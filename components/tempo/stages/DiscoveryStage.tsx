/**
 * DiscoveryStage.tsx
 * Stage 2 of the Tempo simulation — Discovery audio call with Dana Reyes.
 * Flow: pre-call lobby (DiscoveryLobby) → active audio call → post-call summary.
 * The microphone is enabled by the student in the lobby and handed to the call
 * session, so no device indicator turns on automatically.
 * Only used in the Tempo/Default simulation (Rehearse Essentials class).
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HandoffModal } from "@/components/tempo/HandoffModal";
import { DiscoveryCallSession } from "@/components/tempo/stages/DiscoveryCallSession";
import { DiscoveryLobby } from "@/components/tempo/stages/DiscoveryLobby";
import { DiscoveryStageLayout } from "@/components/tempo/stages/DiscoveryStageLayout";
import { DiscoveryTopBar } from "@/components/tempo/stages/DiscoveryTopBar";
import { resumePlaybackContext } from "@/lib/audio-playback";
import { completeStage } from "@/lib/attempt-actions";
import { SIMLI_FACE_ID } from "@/lib/constants";
import {
  DEFAULT_DISCOVERY_SUMMARY,
  canSubmitDiscoverySummary,
  type DiscoveryPhase,
  type DiscoverySummaryForm,
  type DiscoveryTranscriptEntry,
} from "@/lib/tempo-discovery";
import {
  TEMPO_HANDOFF_MESSAGES,
  TEMPO_HANDOFF_STAGE_META,
} from "@/lib/tempo-prospecting";

type DiscoveryStageProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  simliFaceId?: string;
};

/**
 * Tempo Discovery — lobby, audio call session, and post-call summary.
 */
export function DiscoveryStage({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  simliFaceId,
}: DiscoveryStageProps): React.ReactElement {
  const router = useRouter();
  const [phase, setPhase] = useState<DiscoveryPhase>("lobby");
  const [connectError, setConnectError] = useState("");
  const [callSeconds, setCallSeconds] = useState(0);
  const [referenceCollapsed, setReferenceCollapsed] = useState(false);
  const [transcript, setTranscript] = useState<DiscoveryTranscriptEntry[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [summaryForm, setSummaryForm] = useState<DiscoverySummaryForm>(DEFAULT_DISCOVERY_SUMMARY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showPresentationHandoff, setShowPresentationHandoff] = useState(false);

  const finalTranscriptRef = useRef("");

  const faceId = simliFaceId?.trim() || SIMLI_FACE_ID;
  const discoveryMeta = TEMPO_HANDOFF_STAGE_META.discovery;
  const presentationMeta = TEMPO_HANDOFF_STAGE_META.presentation;

  // ── Lobby hands over the enabled mic stream and starts the call ───
  const handleJoinCall = useCallback((stream: MediaStream): void => {
    setConnectError("");
    setCallSeconds(0);
    setTranscript([]);
    setAudioStream(stream);
    void resumePlaybackContext();
    setPhase("connecting");
  }, []);

  const handleCallActive = useCallback((): void => {
    setPhase("active");
  }, []);

  const handleCallError = useCallback((message: string): void => {
    setConnectError(message);
    setAudioStream(null);
    setPhase("lobby");
  }, []);

  const handleCallEnded = useCallback(
    (transcriptText: string, seconds: number, entries: DiscoveryTranscriptEntry[]): void => {
      finalTranscriptRef.current = transcriptText;
      setCallSeconds(seconds);
      setTranscript(entries);
      setAudioStream(null);
      setPhase("summary");
    },
    []
  );

  const handleSummaryChange = useCallback(
    (field: keyof DiscoverySummaryForm, value: string): void => {
      setSummaryForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmitSummary = useCallback(async (): Promise<void> => {
    if (!canSubmitDiscoverySummary(summaryForm) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = JSON.stringify({
        callDurationSeconds: callSeconds,
        transcript: finalTranscriptRef.current,
        transcriptEntries: transcript,
        postCallSummary: summaryForm,
      });

      await completeStage(attemptId, "discovery", 0, "Submitted — scoring coming soon", payload);

      setShowPresentationHandoff(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [summaryForm, isSubmitting, callSeconds, transcript, attemptId]);

  const handlePresentationBegin = (): void => {
    window.location.assign(
      `/student/simulation/${simulationId}?classId=${classId}&attempt=${attemptId}`
    );
  };

  return (
    <>
      <DiscoveryTopBar
        attemptId={attemptId}
        simulationId={simulationId}
        classId={classId}
        simulationTitle={simulationTitle}
        onOpenHandoff={() => setShowHandoff(true)}
        onBack={() => router.push("/student/dashboard")}
      />

      <ErrorBoundary stageName="discovery">
        <DiscoveryStageLayout
          phase={phase}
          callSeconds={callSeconds}
          referenceCollapsed={referenceCollapsed}
          onToggleReference={() => setReferenceCollapsed((prev) => !prev)}
          transcript={transcript}
          lobbySlot={<DiscoveryLobby connectError={connectError} onJoin={handleJoinCall} />}
          callSlot={
            (phase === "connecting" || phase === "active") && audioStream ? (
              <DiscoveryCallSession
                faceId={faceId}
                audioStream={audioStream}
                onActive={handleCallActive}
                onError={handleCallError}
                onTranscriptChange={setTranscript}
                onSecondsChange={setCallSeconds}
                onEnded={handleCallEnded}
              />
            ) : null
          }
          summaryForm={summaryForm}
          onSummaryChange={handleSummaryChange}
          canSubmitSummary={canSubmitDiscoverySummary(summaryForm)}
          isSubmitting={isSubmitting}
          onSubmitSummary={() => void handleSubmitSummary()}
        />
      </ErrorBoundary>

      {showPresentationHandoff && (
        <HandoffModal
          stageNumber={presentationMeta.stageNumber}
          stageName={presentationMeta.stageName}
          stageIcon={presentationMeta.stageIcon}
          message={TEMPO_HANDOFF_MESSAGES.presentation}
          hasAIRestriction={presentationMeta.hasAIRestriction}
          onBegin={handlePresentationBegin}
          onDismiss={() => setShowPresentationHandoff(false)}
        />
      )}

      {showHandoff && !showPresentationHandoff && (
        <HandoffModal
          stageNumber={discoveryMeta.stageNumber}
          stageName={discoveryMeta.stageName}
          stageIcon={discoveryMeta.stageIcon}
          message={TEMPO_HANDOFF_MESSAGES.discovery}
          hasAIRestriction={discoveryMeta.hasAIRestriction}
          onBegin={() => setShowHandoff(false)}
          onDismiss={() => setShowHandoff(false)}
        />
      )}
    </>
  );
}
