/**
 * usePresentationStage.ts
 * State and persistence for the Tempo Stage 3 Presentation form.
 * Auto-saves draft to API + localStorage on changes.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { completeStage } from "@/lib/attempt-actions";
import {
  canSubmitPresentation,
  countCompletedPresentationSections,
  EMPTY_PRESENTATION_FORM,
  isPresentationAiWorkComplete,
  loadPresentationFromStorage,
  savePresentationToStorage,
  type PresentationForm,
} from "@/lib/tempo-presentation";

type UsePresentationStageOptions = {
  attemptId: string;
};

type UsePresentationStageResult = {
  form: PresentationForm;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  aiWorkOpen: boolean;
  setAiWorkOpen: (open: boolean) => void;
  updateField: <K extends keyof PresentationForm>(key: K, value: PresentationForm[K]) => void;
  completedSections: number;
  canSubmit: boolean;
  aiWorkComplete: boolean;
  handleSaveDraft: () => Promise<void>;
  handleSubmit: () => Promise<void>;
};

/**
 * Manages presentation form state, draft save, and submit flow.
 */
export function usePresentationStage({
  attemptId,
}: UsePresentationStageOptions): UsePresentationStageResult {
  const [form, setForm] = useState<PresentationForm>(EMPTY_PRESENTATION_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiWorkOpen, setAiWorkOpen] = useState(false);

  const persistForm = useCallback(
    async (next: PresentationForm): Promise<void> => {
      savePresentationToStorage(attemptId, next);
      setIsSaving(true);
      try {
        await fetch("/api/student/presentation-stage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, form: next }),
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
      const local = loadPresentationFromStorage(attemptId);
      try {
        const res = await fetch(
          `/api/student/presentation-stage?attemptId=${encodeURIComponent(attemptId)}`
        );
        if (res.ok) {
          const body = (await res.json()) as { form: PresentationForm };
          if (!cancelled) {
            setForm({ ...EMPTY_PRESENTATION_FORM, ...body.form });
            savePresentationToStorage(attemptId, {
              ...EMPTY_PRESENTATION_FORM,
              ...body.form,
            });
          }
        } else if (local && !cancelled) {
          setForm({ ...EMPTY_PRESENTATION_FORM, ...local });
        }
      } catch {
        if (local && !cancelled) {
          setForm({ ...EMPTY_PRESENTATION_FORM, ...local });
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
    <K extends keyof PresentationForm>(key: K, value: PresentationForm[K]): void => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        void persistForm(next);
        return next;
      });
    },
    [persistForm]
  );

  const handleSaveDraft = useCallback(async (): Promise<void> => {
    await persistForm(form);
  }, [form, persistForm]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!canSubmitPresentation(form) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = JSON.stringify({
        form,
        submittedAt: new Date().toISOString(),
      });
      await completeStage(
        attemptId,
        "presentation",
        0,
        "Submitted — scoring coming soon",
        payload
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isSubmitting, attemptId]);

  return {
    form,
    isLoading,
    isSaving,
    isSubmitting,
    aiWorkOpen,
    setAiWorkOpen,
    updateField,
    completedSections: countCompletedPresentationSections(form),
    canSubmit: canSubmitPresentation(form),
    aiWorkComplete: isPresentationAiWorkComplete(form),
    handleSaveDraft,
    handleSubmit,
  };
}
