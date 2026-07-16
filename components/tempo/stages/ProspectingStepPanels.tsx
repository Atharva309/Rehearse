/**
 * ProspectingStepPanels.tsx
 * Step content panels for the Tempo Stage 1 Prospecting wizard.
 * Steps: AI Research → Select Target Lead → Opening Message.
 */

"use client";

import { useEffect, useRef } from "react";
import { ProspectingLeadSelectionStep } from "@/components/tempo/stages/ProspectingLeadSelectionStep";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  AUTO_RESEARCH_CARDS,
  OPENING_MESSAGE_TIPS,
  sanitizeAiResearchReply,
  type ProspectingWizardState,
} from "@/lib/tempo-prospecting";
import type { ChatMessage } from "@/types";

type StepPanelsProps = {
  currentStep: number;
  attemptId: string;
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
  onLeadSelected: (leadId: string) => Promise<void>;
};

/**
 * Renders the active wizard step panel in the center column.
 */
export function ProspectingStepPanels({
  currentStep,
  attemptId,
  state,
  chatInput,
  isAILoading,
  wordCount,
  onChatInputChange,
  onSendMessage,
  onFieldChange,
  onLeadSelected,
}: StepPanelsProps): React.ReactElement {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentStep !== 0) {
      return;
    }
    const el = chatScrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [currentStep, state.chatMessages, isAILoading]);

  if (currentStep === 1) {
    return (
      <ProspectingLeadSelectionStep
        attemptId={attemptId}
        selectedLeadId={state.selectedLeadId}
        onSelected={onLeadSelected}
      />
    );
  }

  if (currentStep === 0) {
    return (
      <div>
        <section className="mb-xl">
          <div className="flex items-center gap-sm mb-md">
            <MaterialIcon name="forum" className="text-secondary" />
            <h3 className="font-headline-md text-headline-md">Dig Deeper</h3>
          </div>
          <div className="bg-surface-container-high rounded-xl p-md border border-outline-variant flex flex-col">
            <div
              ref={chatScrollRef}
              className="h-[280px] overflow-y-auto space-y-md pr-1 custom-scrollbar"
            >
              {state.chatMessages.map((msg: ChatMessage, i: number) => (
                <div key={`${msg.role}-${i}`} className="flex flex-col gap-xs">
                  {msg.role === "user" ? (
                    <div className="bg-[#acc7ff] text-on-secondary-fixed max-w-[85%] self-end p-sm rounded-lg rounded-tr-none text-body-md shadow-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest text-on-surface max-w-[90%] self-start p-sm rounded-lg rounded-tl-none border border-outline-variant text-body-md shadow-sm flex gap-sm items-start">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/pitchlab-logo-new.png"
                        alt="Rehearse AI"
                        className="h-7 w-auto shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">
                          Rehearse AI
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {sanitizeAiResearchReply(msg.content)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isAILoading && (
                <div className="flex items-center gap-sm text-on-surface-variant">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pitchlab-logo-new.png" alt="" className="h-5 w-auto opacity-70" />
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-label-sm">Rehearse AI is thinking...</span>
                </div>
              )}
            </div>
            <div className="relative pt-md mt-md border-t border-outline-variant/60">
              <input
                className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-12 text-body-md focus:ring-2 focus:ring-secondary-container outline-none"
                placeholder="Ask Rehearse AI anything about the prospect..."
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
                className="absolute right-2 top-[calc(0.75rem+1px)] w-10 h-10 flex items-center justify-center text-secondary hover:text-secondary/80 transition-colors"
              >
                <MaterialIcon name="send" />
              </button>
            </div>
          </div>
        </section>

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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-md mb-lg">
        {[
          {
            icon: "person",
            label: "Target",
            value: "Dana Reyes, Director of Operations",
            color: "text-secondary",
          },
          {
            icon: "bolt",
            label: "Trigger",
            value: "Summit 8th location expansion",
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
        <div className="p-lg grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-lg items-start">
          <div className="relative min-w-0">
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

          <aside className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
            <h4 className="text-label-md font-bold text-on-surface mb-md flex items-center gap-sm">
              <MaterialIcon name="lightbulb" className="text-tertiary-container" />
              Tips
            </h4>
            <ul className="space-y-sm">
              {OPENING_MESSAGE_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-sm text-body-md text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tertiary-container shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
