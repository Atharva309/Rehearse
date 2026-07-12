/**
 * AccountRecordView.tsx
 * Summit Dental account record — static firmographics + editable Account Strategy notes.
 */

"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

/** Facts already established in Tempo entry / prospecting copy (single CRM source). */
export const SUMMIT_DENTAL_ACCOUNT = {
  name: "Summit Dental Group",
  industry: "Healthcare / Dentistry",
  locations: "8",
  region: "Denver, CO / Mountain West",
} as const;

type AccountRecordViewProps = {
  attemptId: string;
  onBackToList: () => void;
};

/**
 * Formats an ISO timestamp for “Last updated”.
 */
function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Account record canvas (shell provided by CrmOverlay).
 */
export function AccountRecordView({
  attemptId,
  onBackToList,
}: AccountRecordViewProps): React.ReactElement {
  const [notes, setNotes] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/student/crm-account?attemptId=${encodeURIComponent(attemptId)}`
        );
        if (!res.ok) {
          return;
        }
        const body = (await res.json()) as { notes?: string; updated_at?: string | null };
        if (!cancelled) {
          setNotes(body.notes ?? "");
          setUpdatedAt(body.updated_at ?? null);
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

  /**
   * Saves Account Strategy notes via POST.
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/student/crm-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, notes }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Could not save notes.");
        return;
      }
      const body = (await res.json()) as { notes: string; updated_at: string };
      setNotes(body.notes);
      setUpdatedAt(body.updated_at);
    } catch {
      setError("Could not save notes.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatedLabel = formatUpdatedAt(updatedAt);

  return (
    <div className="p-6 flex-grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full space-y-6">
        <nav className="flex items-center gap-2 text-[#404848] text-[12px] font-medium tracking-wide">
          <button type="button" onClick={onBackToList} className="hover:text-[#0f4c4c] transition-colors">
            Accounts
          </button>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <span className="text-[#161d1b]">{SUMMIT_DENTAL_ACCOUNT.name}</span>
        </nav>

        <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm p-6">
          <span className="text-[12px] font-medium tracking-widest uppercase text-[#404848]">
            Account
          </span>
          <h2 className="text-[32px] leading-10 font-semibold tracking-tight text-[#003434] mt-1">
            {SUMMIT_DENTAL_ACCOUNT.name}
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
            <div>
              <p className="text-[10px] font-medium tracking-wide text-[#404848]">INDUSTRY</p>
              <p className="text-sm font-medium text-[#161d1b]">{SUMMIT_DENTAL_ACCOUNT.industry}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wide text-[#404848]">LOCATIONS</p>
              <p className="text-sm font-medium text-[#161d1b]">{SUMMIT_DENTAL_ACCOUNT.locations}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wide text-[#404848]">REGION</p>
              <p className="text-sm font-medium text-[#161d1b]">{SUMMIT_DENTAL_ACCOUNT.region}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#bfc8c8] bg-[#eef5f2]/20">
            <h3 className="text-lg font-semibold text-[#003434]">Account Strategy</h3>
            <p className="text-sm text-[#404848] mt-1">
              Freely editable notes — not tied to simulation stage progress.
            </p>
          </div>
          <div className="p-6 space-y-3">
            {isLoading ? (
              <p className="text-sm text-[#404848]">Loading notes…</p>
            ) : (
              <textarea
                className="w-full min-h-[160px] bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all placeholder:text-[#bfc8c8] resize-y"
                placeholder="Capture account strategy, buying committee dynamics, competitive landscape…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
            {updatedLabel ? (
              <p className="text-[12px] text-[#404848]">Last updated {updatedLabel}</p>
            ) : !isLoading ? (
              <p className="text-[12px] text-[#707978]">No strategy notes yet.</p>
            ) : null}
            {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}
          </div>
          <div className="p-6 bg-[#eef5f2] border-t border-[#bfc8c8] flex justify-end">
            <button
              type="button"
              disabled={isLoading || isSaving}
              onClick={() => void handleSave()}
              className="px-6 py-2 bg-[#0f4c4c] text-white text-[12px] font-medium tracking-wide rounded-lg hover:bg-[#0f4c4c]/90 shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40"
            >
              <MaterialIcon name="save" className="text-[18px]" />
              {isSaving ? "Saving…" : "Save Notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
