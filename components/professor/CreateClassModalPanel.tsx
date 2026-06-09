/**
 * CreateClassModalPanel.tsx
 * Create-class modal with live professor class card preview.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { ProfessorClassCard } from "@/components/professor/ProfessorClassCard";
import { ProfessorButtonContent } from "@/components/professor/ProfessorSpinner";
import {
  CLASS_COLOR_SCHEMES,
  resolveClassColorScheme,
  type ClassColorSchemeId,
} from "@/lib/class-appearance";

type CreateClassModalPanelProps = {
  open: boolean;
  name: string;
  description: string;
  isCreating: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent, colorScheme: ClassColorSchemeId) => void;
};

function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}): React.ReactElement {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

/**
 * Modal for creating a class — form on the left, live card preview on the right.
 */
export function CreateClassModalPanel({
  open,
  name,
  description,
  isCreating,
  onClose,
  onNameChange,
  onDescriptionChange,
  onSubmit,
}: CreateClassModalPanelProps): React.ReactElement | null {
  const [isClosing, setIsClosing] = useState(false);
  const [visible, setVisible] = useState(open);
  const [colorScheme, setColorScheme] = useState<ClassColorSchemeId>("default");
  const [schemeOpen, setSchemeOpen] = useState(false);
  const schemeRef = useRef<HTMLDivElement>(null);
  const scheme = resolveClassColorScheme(colorScheme);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setIsClosing(false);
    } else if (visible) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setVisible(false), 150);
      return () => window.clearTimeout(timer);
    }
  }, [open, visible]);

  useEffect(() => {
    if (!open) {
      setColorScheme("default");
      setSchemeOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent): void => {
      if (schemeRef.current && !schemeRef.current.contains(e.target as Node)) {
        setSchemeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const requestClose = (): void => {
    if (isCreating) return;
    setIsClosing(true);
    window.setTimeout(onClose, 150);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center modal-overlay px-4 ${
        isClosing ? "animate-overlay-out" : "animate-overlay-in"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      role="presentation"
    >
      <div
        className={`bg-surface-container-lowest w-full max-w-[920px] rounded-xl shadow-xl border border-outline-variant overflow-hidden ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <div className="px-xl py-lg border-b border-outline-variant flex justify-between items-center bg-white">
          <div className="flex items-center gap-sm">
            <MaterialIcon name="add_box" className="text-primary" />
            <h2 className="font-headline-md text-headline-md text-primary-container">Create New Class</h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="text-on-surface-variant hover:text-primary transition-colors duration-150"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <form
          onSubmit={(e) => onSubmit(e, colorScheme)}
          className="p-xl grid grid-cols-1 lg:grid-cols-[11fr_9fr] gap-xl items-start"
        >
          <div className="space-y-lg lg:pr-xl lg:border-r border-outline-variant">
            <div className="space-y-sm">
              <label
                htmlFor="className"
                className="block font-label-md text-label-md text-on-surface-variant"
              >
                Class Name <span className="text-error">*</span>
              </label>
              <input
                id="className"
                type="text"
                required
                className="w-full h-10 px-4 border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all duration-150 font-body-md"
                placeholder="e.g. Advanced Sales Strategy"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-sm">
              <label
                htmlFor="classDesc"
                className="block font-label-md text-label-md text-on-surface-variant"
              >
                Description
              </label>
              <textarea
                id="classDesc"
                rows={3}
                className="w-full p-md rounded-lg border border-outline-variant bg-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none font-body-md resize-none"
                placeholder="Briefly describe the course objectives..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>

            <div className="space-y-sm">
              <label className="block font-label-md text-label-md text-on-surface-variant">
                Color Scheme
              </label>
              <div className="relative" ref={schemeRef}>
                <button
                  type="button"
                  onClick={() => setSchemeOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary-container outline-none transition-all"
                >
                  <div className="flex items-center gap-sm">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: scheme.accent }}
                    />
                    <span className="font-body-md text-body-md">{scheme.label}</span>
                  </div>
                  <MaterialIcon
                    name="expand_more"
                    className={`text-outline transition-transform ${schemeOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {schemeOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
                    {CLASS_COLOR_SCHEMES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setColorScheme(preset.id);
                          setSchemeOpen(false);
                        }}
                        className={`w-full flex items-center gap-sm px-md py-2.5 hover:bg-surface-container-low transition-colors text-left ${
                          colorScheme === preset.id ? "bg-surface-container-low" : ""
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span className="font-body-md text-body-md">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant/70">
                Customize the cover image later in Class Card Appearance.
              </p>
            </div>

            <div className="bg-secondary-fixed/20 border border-secondary-fixed/30 p-md rounded-lg flex gap-md items-start">
              <MaterialIcon name="info" className="text-secondary shrink-0" />
              <p className="font-body-md text-on-secondary-container text-sm">
                A unique 6-character join code is generated on creation. Students use it to enroll
                instantly.
              </p>
            </div>

            <div className="flex justify-end items-center gap-md pt-sm">
              <button
                type="button"
                onClick={requestClose}
                className="px-lg h-9 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container-high transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className={`px-lg h-9 rounded-lg bg-primary-container text-white font-bold font-label-md hover:opacity-90 active:scale-95 transition-all duration-150 ${
                  isCreating ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <ProfessorButtonContent isLoading={isCreating} loadingText="Creating...">
                  Create Class
                </ProfessorButtonContent>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-md lg:pl-xl">
            <div className="flex items-center gap-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface-variant">Live Preview</h3>
              <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded-full">
                Professor View
              </span>
            </div>
            <div className="pointer-events-none">
              <ProfessorClassCard
                classId="preview"
                className={name}
                description={description.trim() || null}
                joinCode="------"
                cardColorScheme={colorScheme}
                simulationCount={0}
                previewMode
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
