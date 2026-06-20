/**
 * ProspectingStepPanels.tsx
 * Step content panels for the Tempo Stage 1 Prospecting wizard.
 */

import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  AUTO_RESEARCH_CARDS,
  PROSPECTING_STEPS,
  SELF_CHECK_ITEMS,
  type ProspectingWizardState,
} from "@/lib/tempo-prospecting";
import type { ChatMessage } from "@/types";

type StepPanelsProps = {
  currentStep: number;
  state: ProspectingWizardState;
  chatInput: string;
  isAILoading: boolean;
  wordCount: number;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onFieldChange: <K extends keyof ProspectingWizardState>(
    key: K,
    value: ProspectingWizardState[K]
  ) => void;
  onSelfCheckChange: (id: string, checked: boolean) => void;
  onStretchToggle: () => void;
};

/**
 * Renders the active wizard step panel in the center column.
 */
export function ProspectingStepPanels({
  currentStep,
  state,
  chatInput,
  isAILoading,
  wordCount,
  onChatInputChange,
  onSendMessage,
  onFieldChange,
  onSelfCheckChange,
  onStretchToggle,
}: StepPanelsProps): React.ReactElement {
  const progressPct = ((currentStep + 1) / PROSPECTING_STEPS.length) * 100;

  if (currentStep === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-xl">
        <div className="space-y-sm">
          <h1 className="text-display font-display text-primary">Ideal Customer Profile</h1>
          <p className="text-body-lg text-on-surface-variant">
            Defining your ICP is the foundation of every successful sales campaign. Be as specific
            as possible about the organizations and personas that derive the most value from your
            solution.
          </p>
        </div>

        <div className="bg-secondary-fixed text-on-secondary-fixed p-md rounded-lg flex gap-md items-start shadow-sm border border-secondary-container/20">
          <MaterialIcon name="lightbulb" className="text-secondary font-bold shrink-0" />
          <div className="space-y-xs">
            <h4 className="font-bold text-label-md">Professor&apos;s Tip</h4>
            <p className="text-label-md leading-relaxed opacity-90">
              Focus on pain points rather than demographics. A customer&apos;s industry matters less
              than the specific problem they are trying to solve right now.
            </p>
          </div>
        </div>

        <div className="space-y-lg">
          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <label className="font-bold text-label-md text-on-surface">
                Who is Tempo&apos;s ideal customer?
              </label>
              <span className="text-[11px] text-on-surface-variant font-medium">
                {state.icpField1.length} / 500 characters
              </span>
            </div>
            <textarea
              className="w-full h-32 p-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary-container focus:border-secondary focus:outline-none transition-all placeholder:text-outline-variant font-body-md"
              placeholder="Example: Appointment-based businesses with 2-20 locations..."
              value={state.icpField1}
              onChange={(e) => onFieldChange("icpField1", e.target.value)}
            />
          </div>

          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <label className="font-bold text-label-md text-on-surface">
                What signals tell you a prospect is worth pursuing?
              </label>
              <span className="text-[11px] text-on-surface-variant font-medium">
                {state.icpField2.length} / 500 characters
              </span>
            </div>
            <textarea
              className="w-full h-32 p-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary-container focus:border-secondary focus:outline-none transition-all placeholder:text-outline-variant font-body-md"
              placeholder="Example: Recent expansion, job listings for front desk staff..."
              value={state.icpField2}
              onChange={(e) => onFieldChange("icpField2", e.target.value)}
            />
          </div>
        </div>

        <div className="pt-xl border-t border-outline-variant">
          <div className="flex items-center gap-md">
            <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-secondary-container" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant">
              STEP {currentStep + 1} OF {PROSPECTING_STEPS.length}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <div>
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">Research Analysis</h2>
            <p className="text-body-md text-on-surface-variant">
              Gather intelligence for Summit Dental Group
            </p>
          </div>
        </div>

        <section className="mb-xl">
          <div className="flex items-center gap-sm mb-md">
            <MaterialIcon name="auto_awesome" className="text-tertiary-container" filled />
            <h3 className="font-headline-md text-headline-md">Auto Research</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {AUTO_RESEARCH_CARDS.map((card) => (
              <div
                key={card.id}
                className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-sm">
                  <MaterialIcon
                    name={card.icon}
                    className="text-tertiary-container group-hover:scale-110 transition-transform"
                  />
                  <span className="bg-tertiary-fixed text-[#584400] px-xs rounded text-[10px] font-bold uppercase">
                    Gen AI
                  </span>
                </div>
                <h4 className="font-label-md text-label-md mb-xs">{card.title}</h4>
                <p className="text-label-sm text-on-surface-variant line-clamp-3">{card.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-xl">
          <div className="flex items-center gap-sm mb-md">
            <MaterialIcon name="forum" className="text-secondary" />
            <h3 className="font-headline-md text-headline-md">Dig Deeper</h3>
          </div>
          <div className="bg-surface-container-high rounded-xl p-md space-y-md border border-outline-variant">
            <div className="min-h-[200px] space-y-md">
              {state.chatMessages.map((msg: ChatMessage, i: number) => (
                <div key={`${msg.role}-${i}`} className="flex flex-col gap-xs">
                  {msg.role === "user" ? (
                    <div className="bg-[#acc7ff] text-on-secondary-fixed max-w-[85%] self-end p-sm rounded-lg rounded-tr-none text-body-md shadow-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest text-on-surface max-w-[90%] self-start p-sm rounded-lg rounded-tl-none border border-outline-variant text-body-md shadow-sm flex gap-sm">
                      <MaterialIcon name="smart_toy" className="text-secondary-container" filled />
                      <p>{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              {isAILoading && (
                <div className="flex items-center gap-sm text-on-surface-variant">
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-label-sm">AI is thinking...</span>
                </div>
              )}
            </div>
            <div className="relative pt-sm">
              <input
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-12 text-body-md focus:ring-2 focus:ring-secondary-container outline-none"
                placeholder="Ask AI anything about the prospect..."
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
              <button
                type="button"
                onClick={onSendMessage}
                className="absolute right-2 top-3 w-10 h-10 flex items-center justify-center text-secondary hover:text-secondary/80 transition-colors"
              >
                <MaterialIcon name="send" />
              </button>
            </div>
          </div>
        </section>

        <section className="mb-xl">
          <div className="flex items-center gap-sm mb-md">
            <MaterialIcon name="note_alt" className="text-outline" />
            <h3 className="font-headline-md text-headline-md">Research Notes</h3>
          </div>
          <textarea
            className="w-full min-h-[160px] bg-surface-container-lowest border border-outline-variant rounded-xl p-md text-body-md focus:ring-2 focus:ring-secondary-container outline-none"
            placeholder="Summarize your key findings here..."
            value={state.researchNotes}
            onChange={(e) => onFieldChange("researchNotes", e.target.value)}
          />
        </section>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <div
          className="p-lg rounded-lg border-l-4 border-l-secondary mb-lg"
          style={{
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div className="flex items-center gap-md mb-md">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <MaterialIcon name="target" className="text-secondary" />
            </div>
            <div>
              <h4 className="font-label-md font-bold text-primary uppercase tracking-wider">
                Your ICP from Step 1
              </h4>
              <p className="font-label-sm text-on-surface-variant">
                Recall your primary target criteria.
              </p>
            </div>
          </div>
          <p className="font-body-md text-on-surface-variant italic border-l-2 border-outline-variant pl-md">
            &ldquo;{state.icpField1.slice(0, 150)}
            {state.icpField1.length > 150 ? "..." : ""}&rdquo;
          </p>
        </div>

        <div className="bg-white border border-outline-variant p-lg rounded-xl shadow-sm mb-lg">
          <label className="block font-label-md font-bold text-primary mb-md">
            Why Summit Dental fits?
          </label>
          <textarea
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg font-body-md focus:ring-2 focus:ring-secondary focus:border-transparent transition-all placeholder:text-outline p-md"
            placeholder="Outline the specific signals that match Summit Dental to your ICP..."
            rows={4}
            value={state.fitJustification}
            onChange={(e) => onFieldChange("fitJustification", e.target.value)}
          />
          <div className="mt-sm flex justify-between items-center">
            <p className="font-label-sm text-outline">Aim for 2-3 specific examples.</p>
            <p className="font-label-sm text-outline">{state.fitJustification.length} / 500</p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-lg rounded-xl shadow-sm mb-lg">
          <label className="block font-label-md font-bold text-primary mb-md">
            Decision Maker Details
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <p className="font-label-sm text-outline mb-1">Full Name</p>
              <input
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent p-2"
                placeholder="e.g. Dana Reyes"
                value={state.dmName}
                onChange={(e) => onFieldChange("dmName", e.target.value)}
              />
            </div>
            <div>
              <p className="font-label-sm text-outline mb-1">Role / Title</p>
              <input
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent p-2"
                placeholder="e.g. Director of Operations"
                value={state.dmRole}
                onChange={(e) => onFieldChange("dmRole", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
          <h4 className="font-label-md font-bold text-primary mb-lg">Qualification Scores</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-sm text-outline uppercase mb-2">Fit Rating</label>
              <select
                className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 font-body-md focus:ring-2 focus:ring-secondary"
                value={state.fitRating}
                onChange={(e) => onFieldChange("fitRating", e.target.value)}
              >
                <option value="">Select rating...</option>
                <option value="strong">Strong Fit</option>
                <option value="moderate">Moderate Fit</option>
                <option value="weak">Weak Fit</option>
                <option value="no">Not a Fit</option>
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-outline uppercase mb-2">
                Confidence Level
              </label>
              <select
                className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 font-body-md focus:ring-2 focus:ring-secondary"
                value={state.confidence}
                onChange={(e) => onFieldChange("confidence", e.target.value)}
              >
                <option value="">Select confidence...</option>
                <option value="high">High — Solid Data</option>
                <option value="medium">Medium — Educated Guess</option>
                <option value="low">Low — Needs Verification</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="max-w-4xl mx-auto">
        <header className="mb-xl">
          <span className="inline-flex items-center gap-xs text-secondary font-bold text-label-sm uppercase tracking-wider mb-sm">
            <MaterialIcon name="bolt" className="text-sm" />
            Contextual Intelligence
          </span>
          <h1 className="font-display text-display text-on-surface mb-md">
            Defining Your Trigger Event
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            A trigger event is a specific, observable change in the prospect&apos;s world that
            creates an immediate opening for your solution.
          </p>
        </header>

        <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm mb-lg">
          <label className="block font-headline-md text-body-lg font-bold text-on-surface mb-sm">
            Describe your primary trigger event
          </label>
          <textarea
            className="w-full border border-outline-variant rounded-lg p-md font-body-md focus:ring-2 focus:ring-secondary-container focus:border-secondary transition-all resize-none"
            placeholder="Example: Summit Dental just opened their 8th location three months ago..."
            rows={4}
            value={state.triggerEvent}
            onChange={(e) => onFieldChange("triggerEvent", e.target.value)}
          />
          <div className="flex justify-between items-center mt-sm">
            <p className="text-label-sm text-on-surface-variant italic">
              Focus on timing and relevance.
            </p>
            <span className="text-label-sm text-on-surface-variant">
              {state.triggerEvent.length} / 500 characters
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-lg">
          <div className="p-md bg-surface-container-low border-b border-outline-variant">
            <h3 className="font-headline-md text-body-lg font-bold">Trigger Quality Benchmark</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-lg border-b md:border-b-0 md:border-r border-outline-variant bg-green-50/30">
              <div className="flex items-center gap-sm mb-md text-emerald-700">
                <MaterialIcon name="check_circle" />
                <span className="font-bold text-label-md uppercase">Strong Trigger</span>
              </div>
              <ul className="space-y-md text-body-md">
                <li>
                  <strong>Specific Growth:</strong> Opening 8th practice — manual scheduling is
                  straining.
                </li>
                <li>
                  <strong>Hiring Signal:</strong> Job listing for front desk coordinator suggests
                  overload.
                </li>
              </ul>
            </div>
            <div className="p-lg bg-red-50/30">
              <div className="flex items-center gap-sm mb-md text-error">
                <MaterialIcon name="cancel" />
                <span className="font-bold text-label-md uppercase">Weak Trigger</span>
              </div>
              <ul className="space-y-md text-body-md">
                <li>
                  <strong>Generic Intent:</strong> They seem like they might want to grow soon.
                </li>
                <li>
                  <strong>No Trigger:</strong> I wanted to introduce myself and our product.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative rounded-xl bg-primary-container p-lg flex flex-col md:flex-row items-start md:items-center gap-lg border border-on-primary-container/20">
          <div className="w-16 h-16 shrink-0 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container shadow-xl">
            <MaterialIcon name="auto_awesome" className="text-3xl" />
          </div>
          <div>
            <span className="bg-secondary-container/20 text-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary-container/30">
              AI INSIGHT
            </span>
            <h4 className="font-headline-md text-white mb-xs mt-xs">8th Location Detected</h4>
            <p className="text-on-primary-container text-body-md leading-relaxed">
              Summit Dental opened their 8th practice 3 months ago — this is your high-gravity
              trigger. Their manual scheduling system that worked at 7 locations is now under
              strain. Use this in your outreach.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const checkedCount = SELF_CHECK_ITEMS.filter((item) => state.selfCheck[item.id]).length;
  const triggerPreview =
    state.triggerEvent.length > 40 ? `${state.triggerEvent.slice(0, 40)}...` : state.triggerEvent;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-md mb-lg">
        {[
          {
            icon: "person",
            label: "Target",
            value: `${state.dmName || "Dana Reyes"}, ${state.dmRole || "Director of Operations"}`,
            color: "text-secondary",
          },
          {
            icon: "bolt",
            label: "Trigger",
            value: triggerPreview || "Summit 8th location expansion",
            color: "text-tertiary-container",
          },
          {
            icon: "domain",
            label: "Account",
            value: "Summit Dental Group",
            color: "text-on-surface-variant",
          },
        ].map((pill) => (
          <div
            key={pill.label}
            className="flex items-center gap-sm bg-surface-container-high px-md py-sm rounded-full border border-outline-variant"
          >
            <MaterialIcon name={pill.icon} className={`text-base ${pill.color}`} />
            <span className="text-label-md font-bold text-on-surface">{pill.label}:</span>
            <span className="text-label-md text-on-surface-variant">{pill.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-lg">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Draft Your Opening</h2>
            <p className="text-body-md text-on-surface-variant">
              Personalize the outreach based on your research.
            </p>
          </div>
        </div>
        <div className="p-lg space-y-lg">
          <div className="relative">
            <textarea
              className="w-full h-64 p-lg rounded-lg border border-outline focus:ring-2 focus:ring-secondary-container focus:border-secondary font-body-md text-body-lg resize-none leading-relaxed"
              placeholder="Write your opening message here..."
              value={state.openingMessage}
              onChange={(e) => onFieldChange("openingMessage", e.target.value)}
            />
            <div
              className={`absolute bottom-4 right-4 flex items-center gap-xs bg-white/90 px-sm py-xs rounded-md shadow-sm border ${
                wordCount > 120 ? "border-error" : "border-outline-variant"
              }`}
            >
              <span
                className={`text-label-sm font-bold ${
                  wordCount > 120 ? "text-error" : "text-tertiary-container"
                }`}
              >
                {wordCount}
              </span>
              <span className="text-[10px] uppercase text-on-surface-variant">Words</span>
              <div
                className={`h-2 w-2 rounded-full ${wordCount > 120 ? "bg-error" : "bg-green-500"}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
              <h4 className="text-label-md font-bold text-on-surface mb-md flex items-center gap-sm">
                <MaterialIcon name="task_alt" className="text-secondary" />
                Self-Check ({checkedCount}/{SELF_CHECK_ITEMS.length})
              </h4>
              <ul className="space-y-sm">
                {SELF_CHECK_ITEMS.map((item) => (
                  <li key={item.id} className="flex items-center gap-md">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-outline text-secondary-container focus:ring-secondary"
                      checked={Boolean(state.selfCheck[item.id])}
                      onChange={(e) => onSelfCheckChange(item.id, e.target.checked)}
                    />
                    <span
                      className={`text-body-md ${
                        state.selfCheck[item.id] ? "text-on-surface" : "text-on-surface-variant"
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-outline-variant rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={onStretchToggle}
          className="w-full flex items-center justify-between p-md bg-surface hover:bg-surface-container-high transition-colors text-left"
        >
          <div className="flex items-center gap-md">
            <MaterialIcon name="robot_2" className="text-secondary" />
            <div>
              <span className="text-label-md font-bold text-on-surface">Reusable Agent Design</span>
              <span className="ml-md text-xs text-on-surface-variant font-normal">
                (Optional — earns bonus badges)
              </span>
            </div>
          </div>
          <MaterialIcon
            name="expand_more"
            className={`transition-transform duration-300 ${state.stretchOpen ? "rotate-180" : ""}`}
          />
        </button>
        {state.stretchOpen && (
          <div className="p-lg border-t border-outline-variant space-y-md bg-surface-container-lowest">
            <p className="text-body-md text-on-surface-variant">
              Document your AI prospecting system as reusable instructions someone else could
              follow.
            </p>
            <textarea
              className="w-full min-h-[120px] bg-white border border-outline-variant rounded-lg p-md font-code-md focus:ring-2 focus:ring-secondary-container outline-none"
              placeholder="Document your agent as reusable instructions..."
              value={state.agentDesign}
              onChange={(e) => onFieldChange("agentDesign", e.target.value)}
            />
            <textarea
              className="w-full min-h-[80px] bg-white border border-outline-variant rounded-lg p-md font-body-md focus:ring-2 focus:ring-secondary-container outline-none"
              placeholder="How did you correct or improve the AI output?"
              value={state.agentCorrections}
              onChange={(e) => onFieldChange("agentCorrections", e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
