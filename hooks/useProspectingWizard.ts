/**
 * useProspectingWizard.ts
 * State and persistence for the Tempo Stage 1 Prospecting wizard.
 * Auto-saves to API + localStorage on changes.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { completeStage } from "@/lib/attempt-actions";
import {
  canAdvanceProspectingStep,
  canSubmitProspectingBrief,
  countWords,
  DEFAULT_PROSPECTING_WIZARD_STATE,
  loadProspectingWizardFromStorage,
  saveProspectingWizardToStorage,
  TEMPO_RESEARCH_SYSTEM_PROMPT,
  sanitizeAiResearchReply,
  normalizeProspectingWizardState,
  type ProspectingWizardState,
} from "@/lib/tempo-prospecting";
import type { ChatMessage } from "@/types";

type UseProspectingWizardOptions = {
  attemptId: string;
};

type UseProspectingWizardResult = {
  state: ProspectingWizardState;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  isAILoading: boolean;
  chatInput: string;
  setChatInput: (value: string) => void;
  setCurrentStep: (step: number) => void;
  updateField: <K extends keyof ProspectingWizardState>(
    key: K,
    value: ProspectingWizardState[K]
  ) => void;
  toggleSelfCheck: (id: string, checked: boolean) => void;
  canProceed: boolean;
  canSubmit: boolean;
  wordCount: number;
  handleSaveDraft: () => Promise<void>;
  handleStepAdvance: (nextStep: number) => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  dismissProspectingHandoff: () => void;
};

/**
 * Manages prospecting wizard state, chat, save, and submit flows.
 */
export function useProspectingWizard({
  attemptId,
}: UseProspectingWizardOptions): UseProspectingWizardResult {
  const [state, setState] = useState<ProspectingWizardState>(DEFAULT_PROSPECTING_WIZARD_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const persistState = useCallback(
    async (next: ProspectingWizardState): Promise<void> => {
      saveProspectingWizardToStorage(attemptId, next);
      setIsSaving(true);
      try {
        await fetch("/api/student/prospecting-wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, state: next }),
        });
      } catch {
        /* localStorage fallback remains */
      } finally {
        setIsSaving(false);
      }
    },
    [attemptId]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      const local = loadProspectingWizardFromStorage(attemptId);
      try {
        const res = await fetch(
          `/api/student/prospecting-wizard?attemptId=${encodeURIComponent(attemptId)}`
        );
        if (res.ok) {
          const body = (await res.json()) as { state: ProspectingWizardState };
          if (!cancelled) {
            setState(normalizeProspectingWizardState(body.state));
            saveProspectingWizardToStorage(attemptId, normalizeProspectingWizardState(body.state));
          }
        } else if (local && !cancelled) {
          setState(normalizeProspectingWizardState(local));
        }
      } catch {
        if (local && !cancelled) {
          setState(normalizeProspectingWizardState(local));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const updateField = useCallback(
    <K extends keyof ProspectingWizardState>(key: K, value: ProspectingWizardState[K]): void => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        void persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const setCurrentStep = useCallback(
    (step: number): void => {
      updateField("currentStep", step);
    },
    [updateField]
  );

  const toggleSelfCheck = useCallback(
    (id: string, checked: boolean): void => {
      setState((prev) => {
        const next = {
          ...prev,
          selfCheck: { ...prev.selfCheck, [id]: checked },
        };
        if (id === "wordCount") {
          next.selfCheck.wordCount = countWords(prev.openingMessage) <= 120;
        }
        void persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const handleSaveDraft = useCallback(async (): Promise<void> => {
    await persistState(state);
  }, [persistState, state]);

  const handleStepAdvance = useCallback(
    async (nextStep: number): Promise<void> => {
      const next = { ...state, currentStep: nextStep };
      setState(next);
      await persistState(next);
    },
    [persistState, state]
  );

  const handleSendMessage = useCallback(async (): Promise<void> => {
    const trimmed = chatInput.trim();
    if (!trimmed || isAILoading) {
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...state.chatMessages, userMessage];
    setChatInput("");
    setState((prev) => ({ ...prev, chatMessages: nextMessages }));
    setIsAILoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(0, -1),
          newMessage: trimmed,
          systemPrompt: TEMPO_RESEARCH_SYSTEM_PROMPT,
        }),
      });

      if (!res.ok) {
        throw new Error("AI request failed");
      }

      const body = (await res.json()) as { reply: string };
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: sanitizeAiResearchReply(body.reply),
      };
      setState((prev) => {
        const next = { ...prev, chatMessages: [...nextMessages, assistantMessage] };
        void persistState(next);
        return next;
      });
    } catch {
      setState((prev) => ({
        ...prev,
        chatMessages: [
          ...nextMessages,
          {
            role: "assistant",
            content: "Sorry — I couldn't respond right now. Try again in a moment.",
          },
        ],
      }));
    } finally {
      setIsAILoading(false);
    }
  }, [chatInput, isAILoading, persistState, state.chatMessages]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!canSubmitProspectingBrief(state)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const transcript = JSON.stringify({
        chatMessages: state.chatMessages,
        openingMessage: state.openingMessage,
        selfCheck: state.selfCheck,
      });

      await completeStage(
        attemptId,
        "prospecting",
        0,
        "Submitted — scoring coming soon",
        transcript
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, state]);

  const dismissProspectingHandoff = useCallback((): void => {
    updateField("prospectingHandoffSeen", true);
  }, [updateField]);

  const wordCount = countWords(state.openingMessage);
  const canProceed = canAdvanceProspectingStep(state.currentStep, state);
  const canSubmit = canSubmitProspectingBrief(state);

  return {
    state,
    isLoading,
    isSaving,
    isSubmitting,
    isAILoading,
    chatInput,
    setChatInput,
    setCurrentStep,
    updateField,
    toggleSelfCheck,
    canProceed,
    canSubmit,
    wordCount,
    handleSaveDraft,
    handleStepAdvance,
    handleSendMessage,
    handleSubmit,
    dismissProspectingHandoff,
  };
}
