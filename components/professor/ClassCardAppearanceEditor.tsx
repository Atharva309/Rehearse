/**
 * ClassCardAppearanceEditor.tsx
 * Stitch layout — color scheme, card image, and live student preview.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { ProfessorButtonContent } from "@/components/professor/ProfessorSpinner";
import {
  CLASS_APPEARANCE_SETUP_SQL,
  CLASS_COLOR_SCHEMES,
  resolveClassColorScheme,
  type ClassAppearanceStatus,
  type ClassColorSchemeId,
} from "@/lib/class-appearance";
import { StudentClassCard } from "@/components/StudentClassCard";
import { useToast } from "@/hooks/useToast";

type ImageMode = "preset" | "upload" | "none";

const PRESET_CARD_IMAGES = [
  {
    url: "https://t3.ftcdn.net/jpg/02/47/44/10/240_F_247441003_zWguJzxDwzAx3DEY1vQKBeQItT4YAajz.jpg",
    alt: "Modern workspace flat lay",
  },
  {
    url: "https://www.shutterstock.com/image-photo/construction-technology-banner-background-site-600nw-2375505543.jpg",
    alt: "Construction technology banner",
  },
  {
    url: "https://media.istockphoto.com/id/1411029939/photo/top-view-on-colorful-stacked-books-education-and-learning-concept-background.jpg?s=612x612&w=0&k=20&c=9X5M5RI_aAXvRv4r1OZUSBYSVKx0HK0Sg2dLUN8oQwQ=",
    alt: "Colorful stacked books",
  },
  {
    url: "https://t3.ftcdn.net/jpg/04/41/25/62/360_F_441256239_RG2mJkJujtD5ednLx3dz8mFtgbKiAKMt.jpg",
    alt: "Airplane wing over clouds at sunset",
  },
] as const;

type ClassCardAppearanceEditorProps = {
  classId: string;
  className: string;
  classDescription?: string | null;
  initialImageUrl: string | null;
  initialColorScheme: ClassColorSchemeId;
  appearanceStatus?: ClassAppearanceStatus;
  simulationCount?: number;
};

function MaterialIcon({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}): React.ReactElement {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={
        filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined
      }
      aria-hidden
    >
      {name}
    </span>
  );
}

/**
 * Color scheme picker, card image tabs, and live student preview (Stitch layout).
 */
export function ClassCardAppearanceEditor({
  classId,
  className,
  classDescription = null,
  initialImageUrl,
  initialColorScheme,
  appearanceStatus = "ready",
  simulationCount = 0,
}: ClassCardAppearanceEditorProps): React.ReactElement {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [colorScheme, setColorScheme] = useState<ClassColorSchemeId>(initialColorScheme);
  const [imageMode, setImageMode] = useState<ImageMode>(
    initialImageUrl?.trim() ? "upload" : "none"
  );
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const schemeRef = useRef<HTMLDivElement>(null);

  const scheme = resolveClassColorScheme(colorScheme);
  const previewImage =
    imageMode === "none" ? null : imageUrl.trim() || null;

  useEffect(() => {
    const onDocClick = (e: MouseEvent): void => {
      if (schemeRef.current && !schemeRef.current.contains(e.target as Node)) {
        setSchemeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    const res = await fetch(`/api/professor/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardImageUrl: imageMode === "none" ? null : imageUrl.trim() || null,
        cardColorScheme: colorScheme,
      }),
    });
    setIsSaving(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(body.error ?? "Could not save appearance", "error");
      return;
    }

    showToast("Class appearance saved", "success");
  };

  const setMode = (mode: ImageMode): void => {
    setImageMode(mode);
    if (mode === "none") {
      setImageUrl("");
    }
  };

  const saveTooltip =
    "Changes will be visible to all students enrolled in this class immediately upon saving.";

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="px-lg py-md border-b border-outline-variant flex items-center gap-sm bg-white">
        <MaterialIcon name="palette" className="text-primary" />
        <h2 className="font-headline-md text-headline-md text-primary-container">Class Card Appearance</h2>
      </div>

      <div className="p-lg space-y-lg">
        {appearanceStatus === "stale_schema" && (
          <div className="p-md rounded-lg border border-amber-300 bg-amber-50 text-amber-950 space-y-2">
            <p className="font-label-md font-semibold">Reload Supabase API schema</p>
            <p className="font-body-md text-sm">
              Columns exist in the database but the API cache is stale. Go to Settings → API →
              Reload schema, or run{" "}
              <code className="text-xs bg-white/80 px-1 rounded">NOTIFY pgrst, &apos;reload schema&apos;;</code>
            </p>
          </div>
        )}
        {appearanceStatus === "missing_columns" && (
          <div className="p-md rounded-lg border border-amber-300 bg-amber-50 text-amber-950 space-y-2">
            <p className="font-label-md font-semibold">Database setup required</p>
            <pre className="text-xs bg-white/80 border border-amber-200 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre">
              {CLASS_APPEARANCE_SETUP_SQL}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[11fr_9fr] gap-xl items-start">
          {/* Left settings */}
          <div className="pb-xl border-b border-outline-variant lg:pb-0 lg:border-b-0 lg:pr-xl lg:border-r">
          <div className="mb-xl">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">
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
                <div className="absolute z-20 mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
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
            <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant/70">
              Applies as accent color to simulation buttons and borders.
            </p>
          </div>

          <div className="mb-xl">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Card Image
            </label>
            <div className="flex bg-surface-container rounded-lg p-1 mb-md">
              {(
                [
                  { id: "preset" as const, label: "Preset Images" },
                  { id: "upload" as const, label: "Upload Own" },
                  { id: "none" as const, label: "No Image" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`flex-1 py-1.5 px-3 font-label-md text-label-md rounded-md transition-colors ${
                    imageMode === tab.id
                      ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {imageMode === "preset" && (
              <div className="grid grid-cols-2 gap-sm">
                {PRESET_CARD_IMAGES.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      imageUrl === img.url
                        ? "border-secondary ring-2 ring-secondary/20"
                        : "border-outline-variant hover:border-outline"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {imageMode === "upload" && (
              <div className="space-y-md">
                <div className="flex items-end gap-md">
                  <div className="flex-1">
                    <label
                      htmlFor="cardImageUrl"
                      className="block font-label-sm text-label-sm text-outline mb-xs"
                    >
                      Image URL
                    </label>
                    <input
                      id="cardImageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-10 px-md bg-surface-container-lowest border border-outline-variant rounded-lg font-code-md text-code-md focus:ring-2 focus:ring-secondary-container outline-none"
                    />
                  </div>
                  <div className="w-16 h-10 rounded-lg bg-surface-container border border-outline-variant overflow-hidden shrink-0">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImage}
                        alt="Preview thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-low" />
                    )}
                  </div>
                </div>
                <div className="p-md bg-surface-container-low rounded-lg border border-dashed border-outline-variant flex flex-col items-center justify-center gap-xs">
                  <MaterialIcon name="cloud_upload" className="text-outline" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Paste an image URL above to use as the card cover
                  </span>
                </div>
              </div>
            )}

            {imageMode === "none" && (
              <p className="font-label-sm text-label-sm text-on-surface-variant py-md text-center bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                No cover image — the color scheme gradient will be used instead.
              </p>
            )}
          </div>
          </div>

          {/* Right live preview */}
          <div className="flex flex-col gap-md lg:pl-xl">
            <div className="flex items-center gap-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface-variant">Live Preview</h3>
              <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded-full">
                Student View
              </span>
            </div>

            <div className="max-w-[400px] w-full mx-auto lg:mx-0 pointer-events-none">
              <StudentClassCard
                classId={classId}
                className={className}
                description={classDescription}
                cardImageUrl={previewImage}
                cardColorScheme={colorScheme}
                simulationCount={simulationCount}
              />
            </div>

            <div className="relative group w-fit mx-auto lg:mx-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                aria-describedby="save-appearance-tooltip"
                className={`h-8 px-4 bg-primary-container text-on-primary rounded-lg font-label-sm text-label-sm hover:bg-primary transition-colors active:scale-[0.98] duration-150 ${
                  isSaving ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <ProfessorButtonContent isLoading={isSaving} loadingText="Saving...">
                  Save Appearance Settings
                </ProfessorButtonContent>
              </button>
              <p
                id="save-appearance-tooltip"
                role="tooltip"
                className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 px-2 py-1.5 rounded bg-gray-600 text-gray-100 text-[10px] leading-tight shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20"
              >
                {saveTooltip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
