/**
 * PresentationStageLayout.tsx
 * Presentational 3-column shell for Tempo Stage 3 Presentation —
 * mission panel, pitch form, discovery reference, and footer action bar.
 */

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { TempoExitSimulation } from "@/components/tempo/TempoExitSimulation";
import type { DiscoverySummaryForm } from "@/lib/tempo-discovery";
import {
  isPresentationSectionComplete,
  TEMPO_REFERENCE_SECTIONS,
  VALUE_DRIVER_CARDS,
  type PresentationForm,
} from "@/lib/tempo-presentation";

const DISCOVERY_SUMMARY_ITEMS: {
  label: string;
  field: keyof DiscoverySummaryForm;
}[] = [
  { label: "Business Issue", field: "businessIssue" },
  { label: "Key Problems", field: "keyProblems" },
  { label: "Quantified Value", field: "quantifiedValue" },
  { label: "Personal Value", field: "personalValue" },
  { label: "Agreed Next Step", field: "nextStep" },
];

/** Shared styling — all student-editable fields use white so inputs are obvious. */
const FORM_FIELD =
  "w-full bg-white border border-outline-variant rounded-xl p-4 text-body-md text-on-surface outline-none resize-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all";

const FORM_FIELD_SM =
  "w-full bg-white border border-outline-variant rounded-lg p-3 text-[13px] text-on-surface outline-none resize-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all";

type PresentationStageLayoutProps = {
  form: PresentationForm;
  discoverySummary: Partial<DiscoverySummaryForm>;
  completedSections: number;
  canSubmit: boolean;
  aiWorkComplete: boolean;
  submitHint: string;
  aiWorkOpen: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  openRef: string | null;
  onToggleRef: (label: string) => void;
  onUpdateField: <K extends keyof PresentationForm>(key: K, value: PresentationForm[K]) => void;
  onToggleAiWork: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onOpenHandoff: () => void;
};

/**
 * Renders the full Presentation stage grid and footer.
 */
export function PresentationStageLayout({
  form,
  discoverySummary,
  completedSections,
  canSubmit,
  aiWorkComplete,
  submitHint,
  aiWorkOpen,
  isSaving,
  isSubmitting,
  openRef,
  onToggleRef,
  onUpdateField,
  onToggleAiWork,
  onSaveDraft,
  onSubmit,
  onOpenHandoff,
}: PresentationStageLayoutProps): React.ReactElement {
  const readyToSubmit = canSubmit;

  return (
    <div className="fixed inset-0 z-[45] flex flex-col pt-16 overflow-hidden bg-surface">
      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left column: mission ─── */}
        <aside className="w-[280px] bg-[#1a1a2e] text-white flex flex-col p-6 overflow-y-auto border-r border-outline-variant shrink-0 hidden lg:flex">
          <div className="mb-6">
            <TempoExitSimulation />
          </div>
          <div className="mb-8">
            <span className="text-[11px] font-mono-label text-blue-300 uppercase tracking-[0.2em]">
              Current Phase
            </span>
            <h2 className="font-title-lg text-white mt-1">Stage 3: Presentation</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-mono-label text-[12px] text-blue-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                <MaterialIcon name="target" className="text-[16px]" />
                Your Mission
              </h3>
              <p className="text-body-md text-slate-300 leading-relaxed">
                Present the value of Tempo to{" "}
                <span className="text-white font-semibold">Dana Reyes</span> and{" "}
                <span className="text-white font-semibold">Dr. Saul Kim</span>. Your goal is to
                secure a pilot agreement.
              </p>
            </div>

            <div>
              <h3 className="font-mono-label text-[12px] text-blue-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                <MaterialIcon name="groups" className="text-[16px]" />
                Your Audience
              </h3>
              <div className="space-y-3">
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-sm font-bold text-white">Dana Reyes</p>
                  <p className="text-[12px] text-slate-400">Operations / Clinic Staff</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-sm font-bold text-white">Dr. Saul Kim</p>
                  <p className="text-[12px] text-slate-400">Owner / Revenue & ROI</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary-container/20 rounded-xl border border-primary-container/30">
              <div className="flex items-center gap-2 mb-2">
                <MaterialIcon name="smart_toy" className="text-blue-300 text-[20px]" />
                <h3 className="text-sm font-bold">AI Copilot</h3>
              </div>
              <p className="text-[12px] text-slate-300">
                Enabled. You can use the copilot to refine your messaging and ROI calculations.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <h3 className="font-mono-label text-[12px] text-blue-300 uppercase tracking-wider">
                  Progress
                </h3>
                <span className="text-[12px] font-mono-label text-tertiary-fixed">
                  {completedSections} / 6 Completed
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < completedSections
                        ? "bg-tertiary-fixed shadow-[0_0_8px_rgba(255,223,147,0.4)]"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={onOpenHandoff}
              className="w-full bg-white/5 border border-white/20 py-3 rounded-lg font-mono-label text-[12px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <MaterialIcon name="mail" className="text-[18px]" />
              Handoff Note
            </button>
          </div>
        </aside>

        {/* ── Center column: form ─── */}
        <section className="flex-1 bg-white overflow-y-auto custom-scrollbar min-w-0">
          <div className="max-w-4xl mx-auto py-8 lg:py-12 px-4 lg:px-12">
            <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-headline-lg font-headline-lg text-on-surface">
                  Present to Dana and Dr. Kim
                </h1>
                <p className="text-body-lg text-on-surface-variant mt-2">
                  Construct your final presentation deck narrative by completing the key strategic
                  components below.
                </p>
              </div>
              {readyToSubmit && (
                <div className="flex items-center gap-2 bg-tertiary-container/20 px-3 py-1 rounded-full border border-tertiary-container/40 shrink-0">
                  <MaterialIcon name="check_circle" className="text-tertiary text-sm" filled />
                  <span className="font-mono-label text-tertiary">READY TO SUBMIT</span>
                </div>
              )}
            </div>

            <div className="mb-10 lg:mb-12 p-5 bg-secondary-container/20 rounded-xl border border-secondary-container flex items-start gap-4">
              <MaterialIcon name="auto_awesome" className="text-primary-container text-[28px]" />
              <div>
                <h4 className="font-bold text-primary">Need a starting point?</h4>
                <p className="text-body-md text-on-surface-variant">
                  Your AI Copilot can help you draft sections based on your Discovery Stage notes.
                  Use your discovery summary in the right panel as a starting point.
                </p>
              </div>
            </div>

            <div className="space-y-12 pb-8">
              {/* Section 1 */}
              <SectionShell
                sectionNumber={1}
                title="Restate the Business Issue"
                isComplete={isPresentationSectionComplete(1, form)}
              >
                <textarea
                  className={`${FORM_FIELD} min-h-[80px] leading-relaxed`}
                  placeholder="Through our discovery call, we've identified that Summit Dental Group..."
                  value={form.businessIssue}
                  onChange={(e) => onUpdateField("businessIssue", e.target.value)}
                />
              </SectionShell>

              {/* Section 2 */}
              <SectionShell
                sectionNumber={2}
                title="Map Value Drivers"
                isComplete={isPresentationSectionComplete(2, form)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VALUE_DRIVER_CARDS.map((card) => (
                    <div
                      key={card.field}
                      className={`p-4 border border-outline-variant rounded-lg border-l-4 ${card.color} bg-white`}
                    >
                      <p className={`text-[11px] font-mono-label uppercase mb-1 ${card.labelColor}`}>
                        {card.label}
                      </p>
                      <p className="text-sm font-bold mb-2 text-on-surface">{card.title}</p>
                      <textarea
                        className={`${FORM_FIELD_SM} min-h-[56px]`}
                        placeholder={`Connect ${card.title} to Summit Dental's specific pain...`}
                        value={form[card.field]}
                        onChange={(e) => onUpdateField(card.field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </SectionShell>

              {/* Section 3 */}
              <SectionShell
                sectionNumber={3}
                title="Quantify the ROI"
                isComplete={isPresentationSectionComplete(3, form)}
              >
                <textarea
                  className={`${FORM_FIELD} h-32`}
                  placeholder="Based on our model, Tempo will recover..."
                  value={form.roiCalculation}
                  onChange={(e) => onUpdateField("roiCalculation", e.target.value)}
                />
                <div className="p-4 bg-tertiary-fixed/20 border border-tertiary-fixed rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <MaterialIcon name="calculate" className="text-on-tertiary-fixed-variant" />
                    <span className="text-sm font-medium text-on-tertiary-fixed-variant">
                      ROI Helper: 6,400 appts × 18% no-shows × $120 = $138,240/month lost
                    </span>
                  </div>
                </div>
              </SectionShell>

              {/* Section 4 */}
              <SectionShell
                sectionNumber={4}
                title="Include a Proof Point"
                isComplete={isPresentationSectionComplete(4, form)}
              >
                <textarea
                  className={`${FORM_FIELD} min-h-[128px]`}
                  placeholder="Front Range Veterinary Partners, a 6-clinic group similar in size to Summit Dental..."
                  value={form.proofPoint}
                  onChange={(e) => onUpdateField("proofPoint", e.target.value)}
                />
              </SectionShell>

              {/* Section 5 */}
              <SectionShell
                sectionNumber={5}
                title="Next Step Ask"
                isComplete={isPresentationSectionComplete(5, form)}
              >
                <textarea
                  className={`${FORM_FIELD} min-h-[96px]`}
                  placeholder="I'd like to propose a 30-day pilot at one Summit Dental location..."
                  value={form.nextStep}
                  onChange={(e) => onUpdateField("nextStep", e.target.value)}
                />
              </SectionShell>

              {/* Section 6 */}
              <SectionShell
                sectionNumber={6}
                title="Speak to Both Stakeholders"
                isComplete={isPresentationSectionComplete(6, form)}
              >
                <textarea
                  className={`${FORM_FIELD} min-h-[96px]`}
                  placeholder="For Dana — this takes the scheduling burden off your front desk immediately. For Dr. Kim — at $1,432/month across all eight locations..."
                  value={form.bothStakeholders}
                  onChange={(e) => onUpdateField("bothStakeholders", e.target.value)}
                />
              </SectionShell>

              {/* AI Work */}
              <div className="border-t border-outline-variant pt-8">
                <button
                  type="button"
                  onClick={onToggleAiWork}
                  className="w-full flex items-center justify-between text-on-surface-variant hover:text-primary transition-colors py-2"
                >
                  <span className="font-bold flex items-center gap-2">
                    <MaterialIcon name={aiWorkOpen ? "expand_less" : "expand_more"} />
                    Show Your AI Work
                  </span>
                  <span className="text-[12px] font-mono-label">REQUIRED</span>
                </button>

                {aiWorkOpen && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <p className="text-mono-label text-primary-container mb-2 flex items-center gap-2">
                        <MaterialIcon name="smart_toy" className="text-sm" />
                        AI PROMPT USED
                      </p>
                      <textarea
                        className={`${FORM_FIELD} min-h-[80px] italic`}
                        placeholder="Paste the exact prompts you used to help write this pitch..."
                        value={form.aiPrompts}
                        onChange={(e) => onUpdateField("aiPrompts", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-mono-label text-on-surface-variant mb-2">RAW AI OUTPUT</p>
                        <textarea
                          className={`${FORM_FIELD} min-h-[96px]`}
                          placeholder="Paste what the AI gave you..."
                          value={form.aiOutput}
                          onChange={(e) => onUpdateField("aiOutput", e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="text-mono-label text-primary-container mb-2">
                          YOUR REFINEMENT
                        </p>
                        <textarea
                          className={`${FORM_FIELD} min-h-[96px]`}
                          placeholder="How did you edit or improve the AI output? What did it get wrong?"
                          value={form.aiRefinement}
                          onChange={(e) => onUpdateField("aiRefinement", e.target.value)}
                        />
                      </div>
                    </div>

                    {aiWorkComplete && (
                      <div className="bg-tertiary-fixed text-on-tertiary-fixed p-4 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center shrink-0">
                            <MaterialIcon name="workspace_premium" className="text-tertiary" />
                          </div>
                          <div>
                            <p className="font-bold text-body-md">
                              Badge Preview: Directed the AI Copilot Well
                            </p>
                            <p className="text-xs opacity-80">
                              Awarded for showing prompts and structural edits.
                            </p>
                          </div>
                        </div>
                        <MaterialIcon name="stars" filled />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Right column: reference ─── */}
        <aside className="w-[320px] bg-[#f2f4f6] flex flex-col border-l border-outline-variant overflow-hidden shrink-0 hidden xl:flex">
          <div className="p-5 border-b border-outline-variant bg-white/50 backdrop-blur shrink-0">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <MaterialIcon name="sticky_note_2" className="text-[20px]" />
              Discovery Summary
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
            {DISCOVERY_SUMMARY_ITEMS.map((item) => (
              <div
                key={item.field}
                className="p-3 bg-white border border-outline-variant rounded-lg shadow-sm"
              >
                <p className="text-[10px] font-mono-label text-primary-container uppercase mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-on-surface">
                  {discoverySummary[item.field]?.trim() ? (
                    discoverySummary[item.field]
                  ) : (
                    <span className="text-on-surface-variant italic font-normal">
                      Not captured in Discovery
                    </span>
                  )}
                </p>
              </div>
            ))}

            <div className="pt-6 border-t border-outline-variant">
              <h3 className="font-bold text-on-surface-variant flex items-center gap-2 mb-4">
                <MaterialIcon name="book" className="text-[20px]" />
                Tempo Reference
              </h3>
              <div className="space-y-2">
                {TEMPO_REFERENCE_SECTIONS.map((section) => (
                  <div key={section.label}>
                    <button
                      type="button"
                      onClick={() => onToggleRef(section.label)}
                      className="w-full flex items-center justify-between p-3 bg-white/50 hover:bg-white rounded-lg border border-outline-variant transition-all"
                    >
                      <span className="text-[13px] font-medium">{section.label}</span>
                      <MaterialIcon
                        name={openRef === section.label ? "expand_less" : "chevron_right"}
                        className="text-[18px]"
                      />
                    </button>
                    {openRef === section.label && (
                      <div className="mt-1 p-3 bg-white rounded-lg border border-outline-variant space-y-1">
                        {section.content.map((line) => (
                          <p key={line} className="text-[12px] text-on-surface-variant">
                            • {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ── Footer action bar ─── */}
      <footer className="h-20 bg-white border-t border-outline-variant flex items-center justify-between px-4 lg:px-8 z-50 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-mono-label text-on-surface-variant">
              Presentation Completion
            </span>
            {readyToSubmit ? (
              <span className="text-body-md font-bold text-tertiary flex items-center gap-1 truncate">
                6 of 6 complete + AI work done
              </span>
            ) : (
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-body-lg font-bold">
                    {completedSections} of 6 sections complete
                  </span>
                  {!readyToSubmit && (
                    <>
                      <span className="text-on-surface-variant/40">—</span>
                      <span className="text-[12px] text-on-surface-variant">Drafting Stage</span>
                    </>
                  )}
                </div>
                {!readyToSubmit && (
                  <span className="text-[12px] text-on-surface-variant leading-snug">
                    {submitHint}
                  </span>
                )}
              </div>
            )}
          </div>
          {readyToSubmit && (
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-tertiary" />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isSaving && (
            <span className="text-[12px] text-on-surface-variant hidden sm:inline">Saving...</span>
          )}
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-4 lg:px-6 py-2.5 border border-outline-variant text-on-surface-variant font-bold rounded-lg hover:bg-surface-container-low transition-all text-sm"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            className={`px-6 lg:px-10 py-2.5 font-bold rounded-lg flex items-center gap-2 text-sm ${
              canSubmit && !isSubmitting
                ? "bg-[#c9a84c] text-on-primary shadow-lg hover:brightness-110 active:scale-95 transition-all submit-glow"
                : "bg-outline-variant text-white opacity-50 cursor-not-allowed"
            }`}
          >
            {isSubmitting
              ? "Submitting..."
              : readyToSubmit
                ? "Submit Presentation"
                : "Submit Stage 3"}
            <MaterialIcon name={canSubmit ? "send" : "lock"} className="text-[20px]" />
          </button>
        </div>
      </footer>
    </div>
  );
}

type SectionShellProps = {
  sectionNumber: number;
  title: string;
  isComplete: boolean;
  children: React.ReactNode;
};

/**
 * Number badge + section title wrapper for form sections.
 */
function SectionShell({
  sectionNumber,
  title,
  isComplete,
  children,
}: SectionShellProps): React.ReactElement {
  return (
    <div className="relative pl-12">
      <div
        className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
          isComplete
            ? "bg-green-100 text-green-700"
            : "border-2 border-outline-variant text-on-surface-variant"
        }`}
      >
        {isComplete ? (
          <MaterialIcon name="check_circle" className="text-[20px]" filled />
        ) : (
          <span className="font-mono-label text-sm">{sectionNumber}</span>
        )}
      </div>
      <div className="space-y-4">
        <label className="font-title-lg text-on-surface block">{title}</label>
        {children}
      </div>
    </div>
  );
}
