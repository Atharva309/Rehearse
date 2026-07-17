/**
 * ProspectingScopedChat.tsx
 * Per-company research chat for Prospecting — known facts + grounded AI chat.
 * No Export/Start Sim, no mic — text research only.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { ProspectDirectoryCompany } from "@/lib/tempo-prospect-directory";
import { sanitizeAiResearchReply } from "@/lib/tempo-prospecting";
import type { ChatMessage } from "@/types";

type ProspectingScopedChatProps = {
  company: ProspectDirectoryCompany;
  messages: ChatMessage[];
  chatInput: string;
  isAILoading: boolean;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
};

type FactTab = "industry" | "scale" | "contact" | "signal";

/**
 * Header, Known Facts card, and chat transcript for one directory company.
 */
export function ProspectingScopedChat({
  company,
  messages,
  chatInput,
  isAILoading,
  onChatInputChange,
  onSendMessage,
}: ProspectingScopedChatProps): React.ReactElement {
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [activeFactTab, setActiveFactTab] = useState<FactTab>("industry");

  const factTabs: Array<{ id: FactTab; label: string; icon: string; value: string }> = [
    { id: "industry", label: "Industry", icon: "business", value: company.industry },
    { id: "scale", label: "Scale", icon: "groups", value: company.sizeLabel },
    {
      id: "contact",
      label: "Primary Contact",
      icon: "person",
      value: company.contactName.trim()
        ? `${company.contactName}${
            company.contactTitle.trim() ? ` — ${company.contactTitle}` : ""
          }`
        : "No primary contact listed.",
    },
    { id: "signal", label: "Trigger Signal", icon: "rss_feed", value: company.signalHint },
  ];
  const activeFact = factTabs.find((tab) => tab.id === activeFactTab) ?? factTabs[0];

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, isAILoading, company.id]);

  return (
    <section className="flex-1 flex flex-col bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden min-h-0">
      <div className="p-lg border-b border-outline-variant bg-surface-container-low shrink-0">
        <h2 className="font-headline-lg text-headline-lg text-primary">{company.name} Research</h2>
        <p className="text-body-md text-on-surface-variant">
          {company.industry} · {company.sizeLabel}
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-lg space-y-lg custom-scrollbar">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2 text-secondary">
              <MaterialIcon name="fact_check" className="text-[20px]" />
              <span className="text-label-md font-bold uppercase tracking-wider">Known Facts</span>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-lg bg-surface-container p-1"
              role="tablist"
              aria-label="Known company facts"
            >
              {factTabs.map((tab) => {
                const isActive = activeFactTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFactTab(tab.id)}
                    className={`min-h-8 px-2 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                      isActive
                        ? "bg-white text-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-start gap-2 mt-2 rounded-lg border border-outline-variant bg-white px-3 py-2"
              role="tabpanel"
            >
              <MaterialIcon
                name={activeFact.icon}
                className="text-[16px] text-secondary mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                  {activeFact.label}
                </p>
                <p className="text-xs font-medium leading-snug break-words">{activeFact.value}</p>
              </div>
            </div>
          </div>

          <div className="space-y-lg">
            {messages.length === 0 ? (
              <p className="text-body-md text-on-surface-variant text-center py-md">
                Ask a research question about {company.name} to dig deeper.
              </p>
            ) : null}
            {messages.map((msg, i) => (
              <div key={`${company.id}-${msg.role}-${i}`}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-primary-container text-on-primary p-md rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                      <p className="text-body-md whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start gap-md">
                    <div className="w-8 h-8 rounded-full bg-secondary-fixed/40 flex items-center justify-center shrink-0">
                      <MaterialIcon name="smart_toy" className="text-secondary text-[20px]" />
                    </div>
                    <div className="bg-surface-container p-md rounded-2xl rounded-tl-none max-w-[85%] border border-outline-variant">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">
                        Rehearse AI
                      </p>
                      <p className="text-body-md leading-relaxed whitespace-pre-wrap">
                        {sanitizeAiResearchReply(msg.content)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isAILoading ? (
              <div className="flex items-center gap-sm text-on-surface-variant">
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span className="text-label-sm">Rehearse AI is thinking...</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-lg bg-white border-t border-outline-variant shrink-0">
          <div className="relative flex items-center">
            <textarea
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-4 pr-14 text-body-md focus:ring-2 focus:ring-secondary focus:border-transparent outline-none resize-none shadow-sm"
              placeholder={`Ask about ${company.name}...`}
              rows={1}
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <div className="absolute right-3 flex items-center">
              <button
                type="button"
                onClick={onSendMessage}
                disabled={isAILoading || !chatInput.trim()}
                className="bg-primary-container text-on-primary p-1.5 rounded-lg active:scale-95 transition-transform disabled:opacity-40"
                aria-label="Send message"
              >
                <MaterialIcon name="send" className="text-[20px]" />
              </button>
            </div>
          </div>
          <div className="mt-sm flex justify-center">
            <p className="text-label-sm text-on-surface-variant">
              Rehearse AI can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
