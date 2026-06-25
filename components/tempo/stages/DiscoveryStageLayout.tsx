/**
 * DiscoveryStageLayout.tsx
 * Presentational shell for Tempo Stage 2 Discovery — top app bar (matching
 * Stage 1), stage chrome bar, 3-column grid (mission briefing, center, reference
 * + transcript). The center swaps by phase; the active call center is injected
 * via callSlot so the audio session only mounts after Join Call.
 */

import Link from "next/link";
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

// Project flow shown in the top app bar (Discovery is the active stage).
const FLOW_PILLS = [
  "Prospecting",
  "Discovery",
  "Presentation",
  "Objection Handling",
  "Negotiation",
] as const;

const DISCOVERY_FLOW_INDEX = 1;

const BAR_BUTTON =
  "flex items-center gap-1.5 px-3 py-1.5 font-label-sm text-label-sm rounded-lg shrink-0 transition-all duration-150";

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
  onBack: () => void;
  onJoinCall: () => void;
  canJoin: boolean;
  connectError: string;
  transcript: DiscoveryTranscriptEntry[];
  callSlot: React.ReactNode;
  summaryForm: DiscoverySummaryForm;
  onSummaryChange: (field: keyof DiscoverySummaryForm, value: string) => void;
  canSubmitSummary: boolean;
  isSubmitting: boolean;
  onSubmitSummary: () => void;
};

/**
 * Renders the full Discovery stage chrome; center swaps by phase.
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
  onBack,
  onJoinCall,
  canJoin,
  connectError,
  transcript,
  callSlot,
  summaryForm,
  onSummaryChange,
  canSubmitSummary,
  isSubmitting,
  onSubmitSummary,
}: DiscoveryStageLayoutProps): React.ReactElement {
  const isCallPhase = phase === "connecting" || phase === "active";

  return (
    <>
      {/* ── Top app bar (matches Stage 1) ─── */}
      <header className="fixed top-0 left-0 right-0 z-[50] h-16 border-b border-border bg-page shrink-0">
        <div className="h-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 lg:px-6 min-w-0">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 shrink-0 text-xl font-bold text-primary tracking-tight"
          >
            <img
              src="/pitchlab-logo-new.png"
              alt="Rehearse logo"
              className="h-[1.5em] w-auto shrink-0"
            />
            <span className="hidden sm:inline">Rehearse</span>
          </Link>

          <div className="hidden sm:block w-px h-6 bg-outline-variant shrink-0" />

          <button
            type="button"
            onClick={onBack}
            className={`${BAR_BUTTON} text-on-surface-variant border border-outline-variant hover:bg-surface-container`}
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            <span className="hidden md:inline">Back to Dashboard</span>
            <span className="md:hidden">Back</span>
          </button>

          <div className="hidden sm:block w-px h-6 bg-outline-variant shrink-0" />

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 hidden lg:inline">
              Project Flow
            </span>
            {FLOW_PILLS.map((stage, i) => (
              <span key={stage} className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`px-2 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-full border whitespace-nowrap leading-tight ${
                    i === DISCOVERY_FLOW_INDEX
                      ? "bg-primary-container text-white border-primary-container"
                      : "bg-transparent text-on-surface-variant border-outline-variant"
                  }`}
                >
                  {stage.toUpperCase()}
                </div>
                {i < FLOW_PILLS.length - 1 && (
                  <div className="w-2 sm:w-3 h-px bg-outline-variant hidden md:block" />
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-1">
            <button
              type="button"
              onClick={onOpenHandoff}
              className={`${BAR_BUTTON} text-on-surface-variant border border-outline-variant hover:bg-surface-container`}
            >
              <MaterialIcon name="mail" className="text-[16px]" />
              <span className="hidden sm:inline">Handoff Note</span>
            </button>
            <RestartSimulationButton
              attemptId={attemptId}
              simulationId={simulationId}
              classId={classId}
              simulationTitle={simulationTitle}
              variant="tempoTopBar"
            />
          </div>
        </div>
      </header>

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
            { label: "Stage 3: Presentation", icon: "radio_button_unchecked" },
            { label: "Stage 4: Objection Handling", icon: "lock" },
            { label: "Stage 5: Negotiation", icon: "lock" },
          ].map((stage) => (
            <div
              key={stage.label}
              className="flex items-center gap-2 text-on-surface-variant/40 font-label-md text-label-md h-full shrink-0"
            >
              <MaterialIcon name={stage.icon} className="text-[18px]" />
              <span className="whitespace-nowrap hidden xl:inline">{stage.label}</span>
            </div>
          ))}
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
                Your goal is to uncover their business issues around scheduling before moving to
                the proposal stage.
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

          {isCallPhase && callSlot}

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
                {transcript.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-lg">
                    <MaterialIcon
                      name="waves"
                      className="text-4xl text-on-surface-variant/20 mb-2"
                    />
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
                        <span className="text-[10px] text-outline font-code-md">
                          {msg.timestamp}
                        </span>
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
    </>
  );
}
