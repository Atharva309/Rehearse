/**
 * ClassCardAppearanceEditor.tsx
 * Edit student-facing class card image and color scheme with live preview.
 */

"use client";

import { useState } from "react";
import { ProfessorButtonContent } from "@/components/professor/ProfessorSpinner";
import {
  CLASS_APPEARANCE_SETUP_SQL,
  CLASS_COLOR_SCHEMES,
  resolveClassColorScheme,
  type ClassAppearanceStatus,
  type ClassColorSchemeId,
} from "@/lib/class-appearance";
import { useToast } from "@/hooks/useToast";

type ClassCardAppearanceEditorProps = {
  classId: string;
  className: string;
  initialImageUrl: string | null;
  initialColorScheme: ClassColorSchemeId;
  appearanceStatus?: ClassAppearanceStatus;
};

/**
 * Color scheme picker, optional cover image URL, and student card preview.
 */
export function ClassCardAppearanceEditor({
  classId,
  className,
  initialImageUrl,
  initialColorScheme,
  appearanceStatus = "ready",
}: ClassCardAppearanceEditorProps): React.ReactElement {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [colorScheme, setColorScheme] = useState<ClassColorSchemeId>(initialColorScheme);
  const [isSaving, setIsSaving] = useState(false);

  const scheme = resolveClassColorScheme(colorScheme);
  const previewImage = imageUrl.trim() || null;

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    const res = await fetch(`/api/professor/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardImageUrl: imageUrl.trim() || null,
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

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="px-lg py-md border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary-container">
            Class Card Appearance
          </h2>
          <p className="font-body-md text-on-surface-variant mt-1">
            Students see this card on their dashboard and open the class to view simulations.
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className={`px-lg h-10 bg-primary-container text-white font-label-md rounded-lg hover:opacity-90 transition-all duration-150 shrink-0 ${
            isSaving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <ProfessorButtonContent isLoading={isSaving} loadingText="Saving...">
            Save Appearance
          </ProfessorButtonContent>
        </button>
      </div>

      {appearanceStatus === "stale_schema" && (
        <div className="mx-lg mt-lg p-md rounded-lg border border-amber-300 bg-amber-50 text-amber-950 space-y-2">
          <p className="font-label-md font-semibold">Reload Supabase API schema</p>
          <p className="font-body-md text-sm">
            Your columns are in the database, but the API has not picked them up yet. Do one of
            these:
          </p>
          <ol className="text-sm list-decimal list-inside space-y-1">
            <li>
              Supabase Dashboard → <strong>Settings → API → Reload schema</strong>
            </li>
            <li>
              Or run in SQL Editor:{" "}
              <code className="text-xs bg-white/80 px-1 rounded">NOTIFY pgrst, &apos;reload schema&apos;;</code>
            </li>
          </ol>
        </div>
      )}
      {appearanceStatus === "missing_columns" && (
        <div className="mx-lg mt-lg p-md rounded-lg border border-amber-300 bg-amber-50 text-amber-950 space-y-2">
          <p className="font-label-md font-semibold">Database setup required</p>
          <p className="font-body-md text-sm">Run this in Supabase SQL Editor:</p>
          <pre className="text-xs bg-white/80 border border-amber-200 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre">
            {CLASS_APPEARANCE_SETUP_SQL}
          </pre>
        </div>
      )}

      <div className="p-lg grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="space-y-lg">
          <div>
            <label className="font-label-md text-on-surface-variant block mb-3">Color scheme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CLASS_COLOR_SCHEMES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setColorScheme(preset.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-150 ${
                    colorScheme === preset.id
                      ? "border-primary ring-2 ring-primary/20 bg-surface-container-low"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-full shrink-0 border border-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})`,
                    }}
                  />
                  <span className="font-label-sm text-on-surface text-left">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="cardImageUrl" className="font-label-md text-on-surface-variant block mb-2">
              Cover image URL (optional)
            </label>
            <input
              id="cardImageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/your-class-image.jpg"
              className="w-full h-10 px-4 border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all duration-150 font-body-md"
            />
            <p className="font-label-sm text-on-surface-variant mt-2">
              Paste a link to an image. It appears behind the class name on the student dashboard.
            </p>
          </div>
        </div>

        <div>
          <p className="font-label-md text-on-surface-variant mb-3">Student preview</p>
          <div className="rounded-xl border border-outline-variant overflow-hidden bg-page shadow-sm">
            <div
              className="relative px-6 py-8 min-h-[120px] flex items-end"
              style={{
                background: previewImage
                  ? `linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.25)), url(${previewImage}) center/cover`
                  : `linear-gradient(135deg, ${scheme.gradientFrom}, ${scheme.gradientTo})`,
              }}
            >
              <h3 className="font-headline-md text-white font-bold drop-shadow-sm">{className}</h3>
            </div>
            <article
              className="p-5 flex flex-col gap-3 border-l-4 bg-surface-container-lowest m-4 rounded-lg shadow-sm"
              style={{ borderLeftColor: scheme.accent }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: scheme.accent }}>
                {className}
              </p>
              <h4 className="font-semibold text-on-surface">Sample Simulation</h4>
              <p className="text-sm text-on-surface-variant">Alex Chen · VP of Sales</p>
              <div
                className="mt-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-white text-sm font-semibold w-fit"
                style={{ backgroundColor: scheme.accent }}
              >
                Start Simulation
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
