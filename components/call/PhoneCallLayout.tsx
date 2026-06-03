/**
 * PhoneCallLayout.tsx
 * Full-screen prospecting phone call UI (Stitch design).
 */

"use client";

import { CallControlPill } from "@/components/ui/CallControlPill";
import { PersonaInitials } from "@/components/ui/PersonaInitials";
import { CallTranscript } from "@/components/call/CallTranscript";
import {
  CALL_CONTROL_BAR_BOTTOM_PX,
  CALL_OVERLAY_INSET_PX,
  PHONE_WAVEFORM_BAR_COUNT,
  PHONE_WAVEFORM_MAX_HEIGHT_PX,
  PHONE_WAVEFORM_MIN_HEIGHT_PX,
} from "@/lib/constants";
import { getStageCallLabel } from "@/lib/stages";
import type { SimulationStage } from "@/types";

type PhoneCallLayoutProps = {
  stage: SimulationStage;
  personaName: string;
  personaRole: string;
  formattedTimer: string;
  waveformLevels: number[];
  userTranscripts: string;
  personaTranscripts: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
};

const phoneStyle = {
  "--call-inset": `${CALL_OVERLAY_INSET_PX}px`,
  "--call-controls-bottom": `${CALL_CONTROL_BAR_BOTTOM_PX}px`,
} as React.CSSProperties;

/**
 * Active audio-only call: initials, waveform, timer, transcript strip, control pill.
 */
export function PhoneCallLayout({
  stage,
  personaName,
  personaRole,
  formattedTimer,
  waveformLevels,
  userTranscripts,
  personaTranscripts,
  isMuted,
  onToggleMute,
  onEndCall,
}: PhoneCallLayoutProps): React.ReactElement {
  const stageLabel = getStageCallLabel(stage);
  const bars =
    waveformLevels.length >= PHONE_WAVEFORM_BAR_COUNT
      ? waveformLevels
      : [
          ...waveformLevels,
          ...Array(PHONE_WAVEFORM_BAR_COUNT - waveformLevels.length).fill(0),
        ];

  return (
    <div className="absolute inset-0 z-10" style={phoneStyle}>
      <span className="call-stage-badge">{stageLabel}</span>
      <span className="call-timer-badge">{formattedTimer}</span>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-48">
        <PersonaInitials name={personaName} />
        <p className="mt-6 text-xl font-semibold">{personaName}</p>
        <p className="text-sm text-white/60 mt-1">{personaRole}</p>
        <p className="text-xs text-success mt-2 font-medium uppercase tracking-wider">On call</p>

        <div
          className="flex items-end justify-center gap-1 mt-12 w-full max-w-xs"
          style={{ height: PHONE_WAVEFORM_MAX_HEIGHT_PX + PHONE_WAVEFORM_MIN_HEIGHT_PX }}
          aria-hidden
        >
          {bars.slice(0, PHONE_WAVEFORM_BAR_COUNT).map((level, index) => (
            <div
              key={`wave-${index}`}
              className="w-1.5 rounded-full bg-success transition-all duration-75"
              style={{
                height: `${Math.round(level * PHONE_WAVEFORM_MAX_HEIGHT_PX) + PHONE_WAVEFORM_MIN_HEIGHT_PX}px`,
              }}
            />
          ))}
        </div>
      </div>

      <CallControlPill isMuted={isMuted} onToggleMute={onToggleMute} onEndCall={onEndCall} />

      <div className="call-transcript-strip">
        <CallTranscript
          userText={userTranscripts}
          personaText={personaTranscripts}
          personaLabel={personaName}
        />
      </div>
    </div>
  );
}
