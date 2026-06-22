/**
 * DiscoveryStage.tsx
 * Stage 2 of the Tempo simulation — Discovery live voice call with Dana Reyes.
 * Three sequential states: Pre-call lobby → Active call → Post-call summary form.
 * Only used in the Tempo/Default simulation (Rehearse Essentials class).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HandoffModal } from "@/components/tempo/HandoffModal";
import { DiscoveryStageLayout } from "@/components/tempo/stages/DiscoveryStageLayout";
import { resumePlaybackContext } from "@/lib/audio-playback";
import { completeStage } from "@/lib/attempt-actions";
import {
  DANA_REYES_SYSTEM_PROMPT,
  SIMLI_FACE_ID,
  TEMPO_DISCOVERY_OPENING_GREETING,
  TEMPO_DISCOVERY_STAGE_HINT,
} from "@/lib/constants";
import {
  DEFAULT_DISCOVERY_SUMMARY,
  canSubmitDiscoverySummary,
  parseDiscoveryTranscript,
  type DiscoveryPhase,
  type DiscoverySummaryForm,
  type DiscoveryTranscriptEntry,
} from "@/lib/tempo-discovery";
import {
  TEMPO_HANDOFF_MESSAGES,
  TEMPO_HANDOFF_STAGE_META,
  type TempoHandoffStageKey,
} from "@/lib/tempo-prospecting";
import { useSimulationVoiceSession } from "@/hooks/useSimulationVoiceSession";
import { useVideoCall } from "@/hooks/useVideoCall";
import type { AvatarRef } from "@/types";

type DiscoveryStageProps = {
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  simliFaceId?: string;
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
 * Tempo Discovery — lobby, Simli voice call, and post-call summary.
 */
export function DiscoveryStage({
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  simliFaceId,
}: DiscoveryStageProps): React.ReactElement {
  const [phase, setPhase] = useState<DiscoveryPhase>("lobby");
  const [mountSimli, setMountSimli] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [finalCallSeconds, setFinalCallSeconds] = useState(0);
  const [referenceCollapsed, setReferenceCollapsed] = useState(false);
  const [transcript, setTranscript] = useState<DiscoveryTranscriptEntry[]>([]);
  const [summaryForm, setSummaryForm] = useState<DiscoverySummaryForm>(DEFAULT_DISCOVERY_SUMMARY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [postSubmitHandoff, setPostSubmitHandoff] = useState<TempoHandoffStageKey | null>(null);
  const [isDanaSpeaking, setIsDanaSpeaking] = useState(false);

  const connectStartedRef = useRef(false);
  const voiceRef = useRef<ReturnType<typeof useSimulationVoiceSession> | null>(null);

  const videoCall = useVideoCall({
    withVideo: true,
    onAudioStreamReplace: (stream) => voiceRef.current?.replaceAudioStream(stream),
  });

  const voice = useSimulationVoiceSession({
    systemPrompt: DANA_REYES_SYSTEM_PROMPT,
    stageHint: TEMPO_DISCOVERY_STAGE_HINT,
    openingGreeting: TEMPO_DISCOVERY_OPENING_GREETING,
    isMutedRef: videoCall.isMutedRef,
  });

  voiceRef.current = voice;

  const getAudioStreamRef = useRef(videoCall.getAudioStream);
  const primeUserGestureRef = useRef(videoCall.primeUserGesture);
  getAudioStreamRef.current = videoCall.getAudioStream;
  primeUserGestureRef.current = videoCall.primeUserGesture;

  const faceId = simliFaceId?.trim() || SIMLI_FACE_ID;
  const discoveryMeta = TEMPO_HANDOFF_STAGE_META.discovery;
  const presentationMeta = TEMPO_HANDOFF_STAGE_META.presentation;
  const displayCallSeconds =
    phase === "summary" ? finalCallSeconds : videoCall.elapsedSeconds;

  // ── Live transcript sync ───
  useEffect(() => {
    if (phase !== "active" && phase !== "summary") {
      return;
    }
    const raw = voiceRef.current?.getFullTranscript() ?? "";
    setTranscript(parseDiscoveryTranscript(raw, displayCallSeconds));
  }, [voice.userTranscripts, voice.personaTranscripts, phase, displayCallSeconds]);

  // ── Dana speaking indicator ───
  useEffect(() => {
    if (!voice.personaTranscripts || phase !== "active") {
      return;
    }
    setIsDanaSpeaking(true);
    const timer = window.setTimeout(() => setIsDanaSpeaking(false), 2500);
    return () => window.clearTimeout(timer);
  }, [voice.personaTranscripts, phase]);

  const handleJoinCall = useCallback((): void => {
    if (!videoCall.canJoin) {
      return;
    }

    setConnectError("");
    connectStartedRef.current = false;
    setFinalCallSeconds(0);

    void (async (): Promise<void> => {
      await resumePlaybackContext();
      await primeUserGestureRef.current();
      setMountSimli(true);
      setPhase("connecting");
    })();
  }, [videoCall.canJoin]);

  useEffect(() => {
    if (phase !== "connecting" || !mountSimli || connectStartedRef.current) {
      return;
    }

    const run = async (): Promise<void> => {
      connectStartedRef.current = true;

      const avatar = await waitForAvatarReady(() => voiceRef.current?.avatarRef.current ?? null);
      if (!avatar) {
        setConnectError("Could not connect to Dana Reyes. Reload and try again.");
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
        return;
      }

      avatar.resumeAudioContext();

      const simliReady = await avatar.startSession();
      if (!simliReady) {
        setConnectError(
          "Could not connect to Dana Reyes in time. Check Simli keys and try again."
        );
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
        return;
      }

      const audioStream = getAudioStreamRef.current();
      if (!audioStream || audioStream.getAudioTracks().length === 0) {
        setConnectError("Microphone stream unavailable. Reload and try again.");
        setMountSimli(false);
        setPhase("lobby");
        connectStartedRef.current = false;
        return;
      }

      try {
        await voiceRef.current?.startCall(audioStream);
        await primeUserGestureRef.current();
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
  }, [phase, mountSimli, videoCall]);

  const handleEndCall = useCallback((): void => {
    voice.endCall();
    setMountSimli(false);
    videoCall.stopTimer();
    videoCall.stopAllTracks();
    setFinalCallSeconds(videoCall.elapsedSeconds);
    const raw = voice.getFullTranscript();
    setTranscript(parseDiscoveryTranscript(raw, videoCall.elapsedSeconds));
    setPhase("summary");
  }, [voice, videoCall]);

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
        callDurationSeconds: finalCallSeconds,
        transcript: voice.getFullTranscript(),
        transcriptEntries: transcript,
        postCallSummary: summaryForm,
      });

      await completeStage(
        attemptId,
        "discovery",
        0,
        "Submitted — scoring coming soon",
        payload
      );

      setPostSubmitHandoff("presentation");
      setShowHandoff(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [summaryForm, isSubmitting, finalCallSeconds, transcript, voice, attemptId]);

  const handlePresentationBegin = (): void => {
    window.location.assign(
      `/student/simulation/${simulationId}?classId=${classId}&attempt=${attemptId}`
    );
  };

  const showStudentPip =
    videoCall.permissionState === "ready" && !videoCall.cameraUnavailable && !videoCall.isCameraOff;

  return (
    <>
      <ErrorBoundary stageName="discovery">
        <DiscoveryStageLayout
          phase={phase}
          attemptId={attemptId}
          simulationId={simulationId}
          classId={classId}
          simulationTitle={simulationTitle}
          callSeconds={displayCallSeconds}
          referenceCollapsed={referenceCollapsed}
          onToggleReference={() => setReferenceCollapsed((prev) => !prev)}
          onOpenHandoff={() => setShowHandoff(true)}
          onJoinCall={handleJoinCall}
          onEndCall={handleEndCall}
          onToggleMic={videoCall.toggleMute}
          onToggleCamera={videoCall.toggleCamera}
          micMuted={videoCall.isMuted}
          cameraOff={videoCall.isCameraOff}
          canJoin={videoCall.canJoin}
          connectError={connectError}
          isDanaSpeaking={isDanaSpeaking}
          mountSimli={mountSimli}
          avatarSlot={<Avatar ref={voice.avatarRef} faceId={faceId} />}
          studentVideoRef={videoCall.studentVideoRef}
          showStudentPip={showStudentPip}
          transcript={transcript}
          summaryForm={summaryForm}
          onSummaryChange={handleSummaryChange}
          canSubmitSummary={canSubmitDiscoverySummary(summaryForm)}
          isSubmitting={isSubmitting}
          onSubmitSummary={() => void handleSubmitSummary()}
        />
      </ErrorBoundary>

      {showHandoff && postSubmitHandoff === "presentation" && (
        <HandoffModal
          stageNumber={presentationMeta.stageNumber}
          stageName={presentationMeta.stageName}
          stageIcon={presentationMeta.stageIcon}
          message={TEMPO_HANDOFF_MESSAGES.presentation}
          hasAIRestriction={presentationMeta.hasAIRestriction}
          onBegin={handlePresentationBegin}
          onDismiss={() => {
            setShowHandoff(false);
            setPostSubmitHandoff(null);
          }}
        />
      )}

      {showHandoff && postSubmitHandoff !== "presentation" && (
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
