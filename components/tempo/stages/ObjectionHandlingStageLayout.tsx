/**
 * ObjectionHandlingStageLayout.tsx
 * Presentational 3-column shell for Tempo Stage 4 Objection Handling.
 * Lobby, active video call, and post-call summary share the same side panels.
 */

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { PresentationForm } from "@/lib/tempo-presentation";
import {
  OBJECTION_SUMMARY_FIELDS,
  TEMPO_OBJECTION_FACTS,
  formatObjectionTime,
  type ObjectionHandlingPhase,
  type ObjectionSummaryForm,
  type ObjectionTracker,
  type ObjectionTranscriptEntry,
} from "@/lib/tempo-objections";

type ObjectionHandlingStageLayoutProps = {
  phase: ObjectionHandlingPhase;
  callSeconds: number;
  activeTab: number;
  onTabChange: (index: number) => void;
  transcript: ObjectionTranscriptEntry[];
  objectionTracker: ObjectionTracker;
  presentationSummary: PresentationForm | null;
  lobbySlot: React.ReactNode;
  callSlot: React.ReactNode;
  summaryForm: ObjectionSummaryForm;
  onSummaryChange: (field: keyof ObjectionSummaryForm, value: string) => void;
  canSubmitSummary: boolean;
  isSubmitting: boolean;
  onSubmitSummary: () => void;
  onOpenSupport: () => void;
};

const STAGE_NAV = [
  { label: "Prospecting", icon: "check_circle", done: true },
  { label: "Discovery", icon: "check_circle", done: true },
  { label: "Presentation", icon: "check_circle", done: true },
  { label: "Objection Handling", icon: "forum", active: true },
  { label: "Negotiation", icon: "handshake", locked: true },
] as const;

/**
 * Renders the Objection Handling chrome; center panel swaps by phase.
 */
export function ObjectionHandlingStageLayout({
  phase,
  callSeconds,
  activeTab,
  onTabChange,
  transcript,
  objectionTracker,
  presentationSummary,
  lobbySlot,
  callSlot,
  summaryForm,
  onSummaryChange,
  canSubmitSummary,
  isSubmitting,
  onSubmitSummary,
  onOpenSupport,
}: ObjectionHandlingStageLayoutProps): React.ReactElement {
  const isCallPhase = phase === "connecting" || phase === "active";

  return (
    <div className="fixed inset-0 z-[45] flex flex-col pt-16 overflow-hidden bg-surface">
      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel ─── */}
        <aside className="w-[280px] bg-inverse-surface text-surface-variant flex flex-col py-6 px-4 z-40 overflow-y-auto shrink-0 border-r border-outline-variant/10 hidden lg:flex">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
                <MaterialIcon name="target" className="text-on-primary-fixed" />
              </div>
              <div>
                <h2 className="text-headline-md font-headline-md text-primary-fixed leading-none">
                  Current Mission
                </h2>
                <p className="text-surface-variant opacity-70 text-mono-label font-mono-label uppercase tracking-wider">
                  Phase 4: Handle Objections
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {phase === "active" && (
              <div className="bg-surface-variant/10 p-4 rounded-xl border border-white/5">
                <p className="text-mono-label font-mono-label text-surface-variant/60 mb-1">
                  CALL DURATION
                </p>
                <p className="text-headline-md font-headline-md text-primary-fixed tracking-tight font-code-md">
                  {formatObjectionTime(callSeconds)}
                </p>
              </div>
            )}

            <nav className="space-y-1">
              {STAGE_NAV.map((item) => (
                <div
                  key={item.label}
                  className={`p-3 flex items-center gap-3 rounded-lg ${
                    "active" in item && item.active
                      ? "bg-primary-container text-on-primary-container font-bold scale-95"
                      : "done" in item && item.done
                        ? "text-surface-variant/50"
                        : "text-surface-variant opacity-70 hover:bg-surface-variant/10"
                  }`}
                >
                  <MaterialIcon name={item.icon} />
                  <span className="font-mono-label text-mono-label">{item.label}</span>
                </div>
              ))}
            </nav>

            {phase === "summary" && (
              <div className="mt-auto bg-error/10 border border-error/20 rounded-xl p-4 flex flex-col items-center text-center">
                <MaterialIcon name="call_end" className="text-error mb-2 text-3xl" />
                <span className="text-on-error-container font-bold text-body-md">Call Ended</span>
                <p className="text-on-error-container/70 text-xs mt-1">
                  Duration: {formatObjectionTime(callSeconds)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
            <button
              type="button"
              onClick={onOpenSupport}
              className="w-full p-3 bg-surface-variant/10 text-primary-fixed rounded-lg font-bold flex items-center gap-2 hover:bg-surface-variant/20 transition-all"
            >
              <MaterialIcon name="help" />
              Support
            </button>
          </div>
        </aside>

        {/* ── Center panel ─── */}
        {phase === "lobby" && lobbySlot}

        {isCallPhase && callSlot}

        {phase === "summary" && (
          <section className="flex-1 bg-surface min-h-0 relative flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto py-12 px-8 pb-32">
                <header className="mb-10">
                  <div className="flex items-center gap-3 text-on-surface-variant mb-2">
                    <MaterialIcon name="check_circle" className="text-xl" />
                    <h1 className="text-headline-md font-headline-md">
                      Call completed · {formatObjectionTime(callSeconds)}
                    </h1>
                  </div>
                  <p className="text-body-md text-on-surface-variant">
                    Review the interaction and document the key objections handled during the Stage
                    4 simulation.
                  </p>
                </header>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-8">
                  <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                    <h3 className="font-bold text-title-lg">Simulation Debrief</h3>
                  </div>
                  <div className="p-8 space-y-8">
                    {OBJECTION_SUMMARY_FIELDS.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block font-body-md font-semibold text-on-surface">
                          {field.label}
                        </label>
                        <p className="text-sm text-on-surface-variant mb-3">{field.helper}</p>
                        <textarea
                          className="w-full h-32 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 text-body-md transition-all placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                          placeholder={field.placeholder}
                          value={summaryForm[field.id]}
                          onChange={(e) => onSummaryChange(field.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-tertiary-fixed/20 border border-tertiary-container/30 rounded-xl p-6 flex gap-4 items-start mb-12">
                  <MaterialIcon name="info" className="text-tertiary text-2xl" />
                  <div>
                    <h4 className="font-bold text-tertiary">Review Process</h4>
                    <p className="text-on-tertiary-container text-sm leading-relaxed mt-1">
                      Your answers are reviewed alongside the full call transcript. Ensure accuracy
                      as these notes will populate your record for the final Negotiation stage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 h-20 bg-surface-container-lowest border-t border-outline-variant px-8 flex items-center justify-end z-40">
              <button
                type="button"
                disabled={!canSubmitSummary || isSubmitting}
                onClick={onSubmitSummary}
                className={`px-8 py-3 font-bold rounded-lg flex items-center gap-2 transition-all ${
                  canSubmitSummary && !isSubmitting
                    ? "bg-tertiary-fixed text-on-tertiary-fixed hover:scale-[1.02] active:scale-95"
                    : "bg-tertiary-fixed text-on-tertiary-fixed opacity-50 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Submitting…" : "Submit & Continue to Negotiation"}
                <MaterialIcon name="arrow_forward" />
              </button>
            </div>
          </section>
        )}

        {/* ── Right panel ─── */}
        <aside className="w-[320px] bg-surface-container flex flex-col border-l border-outline-variant z-30 shrink-0 hidden lg:flex min-h-0">
          <div className="flex border-b border-outline-variant h-12 shrink-0">
            {[
              { label: "Transcript", icon: "description" },
              { label: "Playbook", icon: "menu_book" },
            ].map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => onTabChange(i)}
                className={`flex-1 text-body-md flex items-center justify-center gap-2 ${
                  activeTab === i
                    ? "text-primary font-bold border-b-2 border-primary"
                    : "text-on-secondary-container opacity-70 hover:bg-surface-variant/50"
                }`}
              >
                <MaterialIcon name={tab.icon} className="text-[18px]" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 0 && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 flex flex-col">
              {phase === "active" && (
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="text-mono-label font-mono-label text-error uppercase font-bold tracking-tighter">
                    Live Transcript
                  </span>
                </div>
              )}

              {phase === "lobby" ? (
                <div className="h-32 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-center p-4">
                  <MaterialIcon name="graphic_eq" className="text-outline-variant mb-2" />
                  <p className="text-body-md text-on-surface-variant/40">
                    Transcript will appear here during the call
                  </p>
                </div>
              ) : (
                <div className="space-y-6 flex-1 min-h-0 overflow-y-auto">
                  {transcript.map((msg, i) => (
                    <div
                      key={`${msg.role}-${i}`}
                      className={`flex flex-col gap-1 ${
                        msg.role === "student" ? "items-end" : "items-start"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase ${
                          msg.role === "student" ? "text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {msg.role === "student" ? "You" : "Dr. Saul Kim"} · {msg.timestamp}
                      </span>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-body-md ${
                          msg.role === "student"
                            ? "bg-primary-container text-surface-lowest rounded-tr-none"
                            : "bg-surface-container-highest border border-outline-variant/30 rounded-tl-none text-on-surface"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {phase === "active" && (
                <div className="p-4 bg-surface-container-low border-t border-outline-variant shrink-0 -mx-4 -mb-4">
                  <p className="text-mono-label font-mono-label text-primary-container font-bold mb-2 flex items-center gap-1">
                    <MaterialIcon name="lightbulb" className="text-[16px]" />
                    STRATEGY HINT
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-outline-variant/30 text-body-md italic text-on-surface-variant">
                    {objectionTracker.price && !objectionTracker.priceHandled
                      ? "Acknowledge the expansion costs, then pivot to how no-show recovery dwarfs the monthly cost."
                      : objectionTracker.adoption && !objectionTracker.adoptionHandled
                        ? "Reassure Dr. Kim on training and onboarding — most teams are live in days, not weeks."
                        : objectionTracker.statusQuo && !objectionTracker.statusQuoHandled
                          ? "Make the cost of inaction visible — no-show revenue leak and front desk turnover risk."
                          : "Acknowledge the concern first — then reconnect to the business issue."}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
              <section>
                <h4 className="text-body-md font-bold text-on-surface mb-3 flex items-center gap-2">
                  <MaterialIcon name="history" className="text-[16px] text-secondary" />
                  Stage 3 Pitch Summary
                </h4>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant text-body-md space-y-3 text-on-surface-variant">
                  {presentationSummary ? (
                    <>
                      <p>
                        • Business issue:{" "}
                        {presentationSummary.businessIssue?.slice(0, 80) || "—"}
                        {(presentationSummary.businessIssue?.length ?? 0) > 80 ? "…" : ""}
                      </p>
                      <p>
                        • ROI stated: {presentationSummary.roiCalculation?.slice(0, 80) || "—"}
                        {(presentationSummary.roiCalculation?.length ?? 0) > 80 ? "…" : ""}
                      </p>
                      <p>
                        • Next step asked: {presentationSummary.nextStep?.slice(0, 80) || "—"}
                        {(presentationSummary.nextStep?.length ?? 0) > 80 ? "…" : ""}
                      </p>
                    </>
                  ) : (
                    <p className="italic">Stage 3 pitch summary not available.</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-body-md font-bold text-on-surface mb-3 flex items-center gap-2">
                  <MaterialIcon name="database" className="text-[16px] text-secondary" />
                  Tempo Core Facts
                </h4>
                <div className="space-y-2">
                  {TEMPO_OBJECTION_FACTS.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex justify-between p-3 bg-surface-container-lowest rounded-lg border border-outline-variant"
                    >
                      <span className="text-body-md text-on-surface-variant">{fact.label}</span>
                      <span className="text-body-md font-bold">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
