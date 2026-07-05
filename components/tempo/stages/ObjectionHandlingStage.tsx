/**
 * ObjectionHandlingStage.tsx
 * Stage 4 of the Tempo simulation — live Simli video call with Dr. Saul Kim.
 * Three sequential states: Pre-call lobby → Active video call → Post-call summary.
 * Uses Simli avatar (video, not audio-only like Stage 2).
 * The 3-column layout persists across all three states.
 * Only used in the Tempo/Default simulation.
 *
 * State flow:
 * 'lobby' → student clicks Join Call → 'active'
 * 'active' → student clicks End Call → 'summary'
 * 'summary' → student submits form → Stage 5 handoff modal
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HandoffModal } from "@/components/tempo/HandoffModal";
import {
  ObjectionHandlingCallSession,
} from "@/components/tempo/stages/ObjectionHandlingCallSession";
import {
  ObjectionHandlingLobby,
  type ObjectionJoinStreams,
} from "@/components/tempo/stages/ObjectionHandlingLobby";
import { ObjectionHandlingStageLayout } from "@/components/tempo/stages/ObjectionHandlingStageLayout";
import { ObjectionHandlingTopBar } from "@/components/tempo/stages/ObjectionHandlingTopBar";
import { resumePlaybackContext } from "@/lib/audio-playback";
import { completeStage } from "@/lib/attempt-actions";
import { SIMLI_FACE_ID } from "@/lib/constants";
import type { PresentationForm } from "@/lib/tempo-presentation";
import {
  EMPTY_SUMMARY,
  EMPTY_TRACKER,
  canSubmitObjectionSummary,
  type ObjectionHandlingPhase,
  type ObjectionSummaryForm,
  type ObjectionTracker,
  type ObjectionTranscriptEntry,
} from "@/lib/tempo-objections";
import {
  TEMPO_HANDOFF_MESSAGES,
  TEMPO_HANDOFF_STAGE_META,
} from "@/lib/tempo-prospecting";

type ObjectionHandlingStageProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  presentationSummary: PresentationForm | null;
  simliFaceId?: string;
};

/**
 * Tempo Objection Handling — lobby, video call session, and post-call summary.
 */
export function ObjectionHandlingStage({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  presentationSummary,
  simliFaceId,
}: ObjectionHandlingStageProps): React.ReactElement {
  const router = useRouter();
  const [phase, setPhase] = useState<ObjectionHandlingPhase>("lobby");
  const [connectError, setConnectError] = useState("");
  const [callSeconds, setCallSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [transcript, setTranscript] = useState<ObjectionTranscriptEntry[]>([]);
  const [objectionTracker, setObjectionTracker] = useState<ObjectionTracker>(EMPTY_TRACKER);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [summaryForm, setSummaryForm] = useState<ObjectionSummaryForm>(EMPTY_SUMMARY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showNegotiationHandoff, setShowNegotiationHandoff] = useState(false);

  const finalTranscriptRef = useRef("");

  const faceId = simliFaceId?.trim() || SIMLI_FACE_ID;
  const objectionsMeta = TEMPO_HANDOFF_STAGE_META.objections;
  const negotiationMeta = TEMPO_HANDOFF_STAGE_META.negotiation;

  const handleJoinCall = useCallback((streams: ObjectionJoinStreams): void => {
    setConnectError("");
    setCallSeconds(0);
    setTranscript([]);
    setObjectionTracker(EMPTY_TRACKER);
    setAudioStream(streams.audioStream);
    setVideoStream(streams.videoStream);
    void resumePlaybackContext();
    setPhase("connecting");
  }, []);

  const handleCallActive = useCallback((): void => {
    setPhase("active");
  }, []);

  const handleCallError = useCallback((message: string): void => {
    setConnectError(message);
    setAudioStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setVideoStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setPhase("lobby");
  }, []);

  const handleCallEnded = useCallback(
    (
      transcriptText: string,
      seconds: number,
      entries: ObjectionTranscriptEntry[],
      tracker: ObjectionTracker
    ): void => {
      finalTranscriptRef.current = transcriptText;
      setCallSeconds(seconds);
      setTranscript(entries);
      setObjectionTracker(tracker);
      setAudioStream(null);
      setVideoStream(null);
      setPhase("summary");
    },
    []
  );

  const handleSummaryChange = useCallback(
    (field: keyof ObjectionSummaryForm, value: string): void => {
      setSummaryForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmitSummary = useCallback(async (): Promise<void> => {
    if (!canSubmitObjectionSummary(summaryForm) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = JSON.stringify({
        callDurationSeconds: callSeconds,
        transcript: finalTranscriptRef.current,
        transcriptEntries: transcript,
        postCallSummary: summaryForm,
        objectionTracker,
      });

      await completeStage(attemptId, "objections", 0, "Submitted — scoring coming soon", payload);

      setShowNegotiationHandoff(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [summaryForm, isSubmitting, callSeconds, transcript, objectionTracker, attemptId]);

  const handleNegotiationBegin = (): void => {
    window.location.assign(
      `/student/simulation/${simulationId}?classId=${classId}&attempt=${attemptId}`
    );
  };

  return (
    <>
      <ObjectionHandlingTopBar
        attemptId={attemptId}
        simulationId={simulationId}
        classId={classId}
        simulationTitle={simulationTitle}
        onOpenHandoff={() => setShowHandoff(true)}
        onBack={() => router.push("/student/dashboard")}
      />

      <ErrorBoundary stageName="objections">
        <ObjectionHandlingStageLayout
          phase={phase}
          callSeconds={callSeconds}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          transcript={transcript}
          objectionTracker={objectionTracker}
          presentationSummary={presentationSummary}
          lobbySlot={
            <ObjectionHandlingLobby connectError={connectError} onJoin={handleJoinCall} />
          }
          callSlot={
            (phase === "connecting" || phase === "active") && audioStream ? (
              <ObjectionHandlingCallSession
                faceId={faceId}
                audioStream={audioStream}
                videoStream={videoStream}
                onActive={handleCallActive}
                onError={handleCallError}
                onTranscriptChange={setTranscript}
                onTrackerChange={setObjectionTracker}
                onSecondsChange={setCallSeconds}
                onEnded={handleCallEnded}
              />
            ) : null
          }
          summaryForm={summaryForm}
          onSummaryChange={handleSummaryChange}
          canSubmitSummary={canSubmitObjectionSummary(summaryForm)}
          isSubmitting={isSubmitting}
          onSubmitSummary={() => void handleSubmitSummary()}
        />
      </ErrorBoundary>

      {showNegotiationHandoff && (
        <HandoffModal
          stageNumber={negotiationMeta.stageNumber}
          stageName={negotiationMeta.stageName}
          stageIcon={negotiationMeta.stageIcon}
          message={TEMPO_HANDOFF_MESSAGES.negotiation}
          hasAIRestriction={negotiationMeta.hasAIRestriction}
          onBegin={handleNegotiationBegin}
          onDismiss={() => setShowNegotiationHandoff(false)}
        />
      )}

      {showHandoff && !showNegotiationHandoff && (
        <HandoffModal
          stageNumber={objectionsMeta.stageNumber}
          stageName={objectionsMeta.stageName}
          stageIcon={objectionsMeta.stageIcon}
          message={TEMPO_HANDOFF_MESSAGES.objections}
          hasAIRestriction={objectionsMeta.hasAIRestriction}
          onBegin={() => setShowHandoff(false)}
          onDismiss={() => setShowHandoff(false)}
        />
      )}
    </>
  );
}
