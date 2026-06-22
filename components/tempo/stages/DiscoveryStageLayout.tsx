/**
 * DiscoveryStageLayout.tsx
 * Presentational 3-column shell for Tempo Stage 2 Discovery —
 * chrome bar, mission briefing, lobby, active call, and post-call summary.
 */

import { RestartSimulationButton } from "@/components/simulation/RestartSimulationButton";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  DISCOVERY_SUMMARY_FIELDS,
  DISCOVERY_TIPS,
  TEMPO_VALUE_DRIVERS,
  countSummaryWords,
  formatDiscoveryTime,
  type DiscoveryPhase,
  type DiscoverySummaryForm,
  type DiscoveryTranscriptEntry,
} from "@/lib/tempo-discovery";
import type { RefCallback } from "react";

type DiscoveryStageLayoutProps = {
  phase: DiscoveryPhase;
  attemptId: string;
  simulationId: string;
  classId: string;
  simulationTitle: string;
  callSeconds: number;
  referenceCollapsed: boolean;
  onToggleReference: () => void;
  onOpenHandoff: () => void;
  onJoinCall: () => void;
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  micMuted: boolean;
  cameraOff: boolean;
  canJoin: boolean;
  connectError: string;
  isDanaSpeaking: boolean;
  mountSimli: boolean;
  avatarSlot: React.ReactNode;
  studentVideoRef: RefCallback<HTMLVideoElement | null>;
  showStudentPip: boolean;
  transcript: DiscoveryTranscriptEntry[];
  summaryForm: DiscoverySummaryForm;
  onSummaryChange: (field: keyof DiscoverySummaryForm, value: string) => void;
  canSubmitSummary: boolean;
  isSubmitting: boolean;
  onSubmitSummary: () => void;
};

/**
 * Renders the full Discovery stage grid; center panel swaps by phase.
 */
export function DiscoveryStageLayout({
  phase,
  attemptId,
  simulationId,
  classId,
  simulationTitle,
  callSeconds,
  referenceCollapsed,
  onToggleReference,
  onOpenHandoff,
  onJoinCall,
  onEndCall,
  onToggleMic,
  onToggleCamera,
  micMuted,
  cameraOff,
  canJoin,
  connectError,
  isDanaSpeaking,
  mountSimli,
  avatarSlot,
  studentVideoRef,
  showStudentPip,
  transcript,
  summaryForm,
  onSummaryChange,
  canSubmitSummary,
  isSubmitting,
  onSubmitSummary,
}: DiscoveryStageLayoutProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[45] flex flex-col pt-16 overflow-hidden bg-surface">
      {/* ── Stage chrome bar ─── */}
      <nav className="bg-surface-container border-b border-outline-variant flex items-center px-4 lg:px-gutter h-14 gap-4 lg:gap-8 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 text-tertiary font-label-md text-label-md border-b-2 border-tertiary h-full shrink-0">
          <MaterialIcon name="check_circle" className="text-[18px]" filled />
          <span className="whitespace-nowrap">Stage 1: Prospecting</span>
        </div>
        <div className="flex items-center gap-2 text-primary-container font-label-md text-label-md border-b-2 border-primary-container h-full shrink-0">
          <MaterialIcon name="adjust" className="text-[18px]" />
          <span className="whitespace-nowrap">Stage 2: Discovery</span>
        </div>
        {[
          { label: "Presentation", icon: "radio_button_unchecked" },
          { label: "Objection Handling", icon: "lock" },
          { label: "Negotiation", icon: "lock" },
        ].map((stage) => (
          <div
            key={stage.label}
            className="flex items-center gap-2 text-on-surface-variant/40 font-label-md text-label-md h-full shrink-0"
          >
            <MaterialIcon name={stage.icon} className="text-[18px]" />
            <span className="whitespace-nowrap hidden xl:inline">
              Stage: {stage.label}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenHandoff}
            className="flex items-center gap-1.5 px-3 py-1.5 text-on-surface-variant font-label-sm border border-outline-variant rounded-lg hover:bg-surface-container transition-all"
          >
            <MaterialIcon name="mail" className="text-[16px]" />
            <span className="hidden sm:inline">Handoff Note</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-on-surface-variant font-label-sm border border-outline-variant rounded-lg hover:bg-surface-container transition-all"
          >
            <MaterialIcon name="workspace_premium" className="text-[16px]" />
            <span className="hidden sm:inline">Badges (0)</span>
          </button>
          <RestartSimulationButton
            attemptId={attemptId}
            simulationId={simulationId}
            classId={classId}
            simulationTitle={simulationTitle}
            variant="tempoTopBar"
          />
        </div>
      </nav>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel ─── */}
        <aside className="w-60 xl:w-72 bg-primary-container text-on-primary p-lg flex flex-col gap-lg border-r border-white/5 shrink-0 hidden lg:flex overflow-y-auto">
          <section>
            <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container mb-4">
              Mission Briefing
            </h2>
            <h1 className="font-headline-md text-headline-md mb-2">
              Run a 20-minute discovery call with Dana Reyes.
            </h1>
            <p className="text-on-primary/70 font-body-md">
              Your goal is to uncover their business issues around scheduling before
              moving to the proposal stage.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl p-md border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-lg text-on-secondary-container">
                DR
              </div>
              <div>
                <div className="font-label-md text-label-md">Dana Reyes</div>
                <div className="text-xs text-on-primary/50 flex items-center gap-1">
                  {phase !== "summary" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 tempo-pulse-green" />
                      Available
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Call ended
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-on-primary/70">
                <MaterialIcon name="work" className="text-sm" />
                <span>Director of Operations, Summit Dental</span>
              </div>
              <div className="flex items-center gap-2 text-on-primary/70">
                <MaterialIcon name="business" className="text-sm" />
                <span>8 dental practices, Colorado</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-label-md text-label-md mb-3 flex items-center gap-2">
              <MaterialIcon name="lightbulb" className="text-tertiary-fixed" />
              Discovery Tips
            </h3>
            <ul className="space-y-3">
              {DISCOVERY_TIPS.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm text-on-primary/80">
                  <MaterialIcon
                    name="check_box_outline_blank"
                    className="text-on-primary/40 shrink-0"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          {phase === "active" && (
            <section className="mt-auto">
              <h3 className="font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container mb-2">
                Call Duration
              </h3>
              <span className="font-code-lg text-code-lg text-white">
                {formatDiscoveryTime(callSeconds)}
              </span>
              <p className="text-white/40 text-xs mt-1">Target: 15-20 minutes</p>
            </section>
          )}
        </aside>

        {/* ── Center panel ─── */}
        {phase === "lobby" && (
          <section className="flex-1 bg-surface p-4 lg:p-xl flex flex-col items-center justify-center relative overflow-y-auto min-w-0">
            {connectError.length > 0 && (
              <p className="mb-4 text-sm text-error shrink-0">{connectError}</p>
            )}
            <div className="max-w-md w-full flex flex-col gap-lg">
              <div className="text-center">
                <h2 className="font-display text-display text-primary mb-2">
                  Ready to call Dana Reyes?
                </h2>
                <p className="text-on-surface-variant font-body-md">
                  Confirm your setup and join the session when you&apos;re prepared.
                </p>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-display text-2xl mb-4 border-4 border-surface-container-high">
                  DR
                </div>
                <h3 className="font-headline-md text-headline-md text-primary">Dana Reyes</h3>
                <p className="font-label-md text-label-md text-on-surface-variant mb-6 uppercase tracking-wider">
                  Director of Operations
                </p>
                <div className="bg-surface-container-low p-md rounded-lg italic text-on-surface-variant font-body-md relative w-full">
                  <MaterialIcon
                    name="format_quote"
                    className="absolute -top-3 -left-1 text-primary-container opacity-20 text-3xl"
                  />
                  &ldquo;Before we get into your product — what made you reach out to us?&rdquo;
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "You completed Stage 1 — Prospecting",
                  "Your manager briefed you on the account",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-md bg-surface-container-high rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <MaterialIcon name="check_circle" className="text-green-600" />
                      <span className="font-body-md">{label}</span>
                    </div>
                    <span className="text-xs font-label-sm text-on-surface-variant">DONE</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={!canJoin}
                onClick={onJoinCall}
                className="w-full h-14 bg-primary-container text-on-primary font-headline-md rounded-lg flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-lg group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MaterialIcon
                  name="call"
                  className="group-hover:translate-x-1 transition-transform"
                />
                Join Call
              </button>
              <p className="text-center text-xs text-on-surface-variant">
                Once you join, the call begins immediately
              </p>
            </div>
          </section>
        )}

        {(phase === "connecting" || phase === "active") && (
          <section className="flex-1 bg-[#0a0a0a] relative flex flex-col items-center justify-center p-lg min-w-0">
            {connectError.length > 0 && (
              <p className="absolute top-4 left-4 right-4 z-40 text-sm text-error bg-black/70 rounded px-3 py-2">
                {connectError}
              </p>
            )}

            {mountSimli && (
              <div
                className={`relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-700 ${
                  isDanaSpeaking && phase === "active"
                    ? "border-tertiary-fixed-dim/40 speaking-ring"
                    : "border-white/10"
                }`}
              >
                <div className="absolute inset-0 bg-neutral-900">{avatarSlot}</div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 z-10">
                  <span className="text-on-primary font-medium tracking-wide">Dana Reyes</span>
                  {isDanaSpeaking && phase === "active" && (
                    <MaterialIcon name="graphic_eq" className="text-tertiary-fixed text-[18px]" filled />
                  )}
                </div>
              </div>
            )}

            {phase === "connecting" && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0a]/80">
                <div className="w-10 h-10 border-2 border-white/20 border-t-tertiary-container rounded-full animate-spin" />
                <p className="mt-4 text-sm text-white/70">Connecting to Dana Reyes…</p>
              </div>
            )}

            {showStudentPip && (
              <div className="absolute bottom-24 lg:bottom-10 right-4 lg:right-10 w-36 lg:w-48 aspect-video rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-neutral-800 z-10">
                <video
                  ref={studentVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded uppercase tracking-tighter">
                  You (Student)
                </div>
              </div>
            )}

            {phase === "active" && (
              <>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                  <nav className="rounded-full backdrop-blur-xl bg-black/20 border border-white/10 shadow-2xl flex items-center p-2 gap-2">
                    <button
                      type="button"
                      onClick={onToggleMic}
                      className={`p-3 rounded-full transition-all active:scale-90 ${
                        micMuted ? "bg-error text-white" : "hover:bg-white/10 text-on-primary"
                      }`}
                    >
                      <MaterialIcon name={micMuted ? "mic_off" : "mic"} />
                    </button>
                    <button
                      type="button"
                      onClick={onToggleCamera}
                      className={`p-3 rounded-full transition-all active:scale-90 ${
                        cameraOff ? "bg-error text-white" : "hover:bg-white/10 text-on-primary"
                      }`}
                    >
                      <MaterialIcon name={cameraOff ? "videocam_off" : "videocam"} />
                    </button>
                    <button
                      type="button"
                      onClick={onEndCall}
                      className="bg-tertiary text-on-tertiary rounded-full p-3 transition-all active:scale-90"
                    >
                      <MaterialIcon name="call_end" filled />
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <button
                      type="button"
                      className="p-3 hover:bg-white/10 text-on-primary rounded-full transition-all active:scale-90"
                    >
                      <MaterialIcon name="subtitles" />
                    </button>
                  </nav>
                </div>
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-[10px] z-20">
                  This call is being recorded for scoring purposes
                </p>
              </>
            )}
          </section>
        )}

        {phase === "summary" && (
          <section className="flex-1 overflow-y-auto bg-surface-container-low px-4 lg:px-xl py-lg flex flex-col gap-lg relative pb-32 min-w-0">
            <div className="flex justify-between items-end border-b border-outline-variant pb-md">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                  <MaterialIcon name="check_circle" className="text-[16px]" />
                  Call completed · {formatDiscoveryTime(callSeconds)}
                </span>
                <h1 className="font-display text-display text-on-surface mt-xs">
                  What did you learn?
                </h1>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg flex flex-col gap-xl">
              {DISCOVERY_SUMMARY_FIELDS.map((field) => (
                <div key={field.id} className="flex flex-col gap-xs">
                  <div className="flex justify-between items-baseline">
                    <label className="font-label-md text-label-md font-bold text-on-surface">
                      {field.label}
                    </label>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {countSummaryWords(summaryForm[field.id])} / 30 min
                    </span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant italic mb-xs">
                    {field.helper}
                  </p>
                  <textarea
                    className="w-full p-md rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary focus:outline-none bg-surface-bright text-body-md transition-shadow"
                    placeholder={field.placeholder}
                    rows={field.rows}
                    value={summaryForm[field.id]}
                    onChange={(e) => onSummaryChange(field.id, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 left-0 w-full p-lg bg-surface/80 backdrop-blur-md border-t border-outline-variant flex justify-end items-center mt-auto">
              <div className="flex items-center gap-lg">
                <span className="text-label-sm text-on-surface-variant">
                  {canSubmitSummary
                    ? "Great! You're ready to advance."
                    : "All sections must be filled to proceed."}
                </span>
                <button
                  type="button"
                  disabled={!canSubmitSummary || isSubmitting}
                  onClick={onSubmitSummary}
                  className={`px-lg py-md rounded-lg font-bold flex items-center gap-md ${
                    canSubmitSummary && !isSubmitting
                      ? "bg-tertiary text-on-tertiary hover:bg-tertiary-container active:scale-95 transition-transform"
                      : "bg-tertiary text-on-tertiary opacity-40 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit & Continue to Stage 3"}
                  <MaterialIcon name="arrow_forward" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Right panel ─── */}
        <aside className="w-72 xl:w-80 bg-surface-container-low flex flex-col border-l border-outline-variant shrink-0 hidden lg:flex min-h-0">
          <section
            className={`border-b border-outline-variant flex flex-col overflow-hidden ${
              referenceCollapsed ? "shrink-0" : "flex-1 min-h-0"
            }`}
          >
            <button
              type="button"
              onClick={onToggleReference}
              className="p-md border-b border-outline-variant flex items-center justify-between bg-surface-container hover:bg-surface-container-high transition-colors text-left w-full"
            >
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Reference: Tempo Product
              </h3>
              <MaterialIcon name={referenceCollapsed ? "expand_more" : "expand_less"} />
            </button>
            {!referenceCollapsed && (
              <div className="flex-1 p-lg overflow-y-auto space-y-lg custom-scrollbar min-h-0">
                <div>
                  <h4 className="font-headline-md text-headline-md mb-1">Tempo</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Scheduling software for appointment-based businesses. Core value: keep
                    calendars full, stop losing money to no-shows.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase text-on-surface-variant opacity-60">
                    Value Drivers
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {TEMPO_VALUE_DRIVERS.map((value) => (
                      <div
                        key={value}
                        className="p-2 bg-surface-container rounded border border-outline-variant/30 text-xs"
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="flex-1 flex flex-col min-h-0 bg-surface-container-high/50">
            <div className="p-md border-b border-outline-variant flex items-center gap-2 bg-surface-container shrink-0">
              <MaterialIcon name="subtitles" className="text-sm" />
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Live Transcript
              </h3>
              {phase === "active" && (
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="text-[10px] font-bold text-error uppercase">LIVE</span>
                </div>
              )}
              {phase === "summary" && (
                <span className="ml-auto text-[10px] text-on-surface-variant">
                  Call ended · {formatDiscoveryTime(callSeconds)}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-lg space-y-lg custom-scrollbar min-h-0">
              {phase === "lobby" || (phase === "connecting" && transcript.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-lg">
                  <MaterialIcon name="waves" className="text-4xl text-on-surface-variant/20 mb-2" />
                  <p className="text-sm text-on-surface-variant/50 italic">
                    Transcript will appear here during the call.
                  </p>
                </div>
              ) : (
                transcript.map((msg, i) => (
                  <div key={`${msg.role}-${i}`} className="space-y-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-label-sm text-label-sm font-bold ${
                          msg.role === "dana" ? "text-on-surface" : "text-secondary"
                        }`}
                      >
                        {msg.role === "dana" ? "Dana Reyes" : "You"}
                      </span>
                      <span className="text-[10px] text-outline font-code-md">{msg.timestamp}</span>
                    </div>
                    <p
                      className={`text-on-surface-variant leading-relaxed ${
                        msg.role === "student" ? "italic" : ""
                      }`}
                    >
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
