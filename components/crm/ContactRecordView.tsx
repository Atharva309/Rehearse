/**
 * ContactRecordView.tsx
 * Dana Reyes / Dr. Kim contact records — role select + relationship notes.
 */

"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export type CrmContactKey = "dana_reyes" | "dr_kim";

export const CRM_CONTACTS: Record<
  CrmContactKey,
  { name: string; title: string }
> = {
  dana_reyes: {
    name: "Dana Reyes",
    title: "Director of Operations",
  },
  dr_kim: {
    name: "Dr. Saul Kim",
    title: "Founder & Owner",
  },
};

const ROLE_OPTIONS = [
  "",
  "Economic Buyer",
  "Champion",
  "Influencer",
  "Technical Evaluator",
] as const;

type ContactRecordViewProps = {
  attemptId: string;
  contactKey: CrmContactKey;
  /** Linked account label; empty shows an em dash. */
  accountLabel?: string;
  onBackToList: () => void;
  onSaved?: (payload: { role: string; notes: string; updatedAt: string }) => void;
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
 * Contact record canvas (shell provided by CrmOverlay).
 */
export function ContactRecordView({
  attemptId,
  contactKey,
  accountLabel = "",
  onBackToList,
  onSaved,
}: ContactRecordViewProps): React.ReactElement {
  const profile = CRM_CONTACTS[contactKey];
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/student/crm-contact?attemptId=${encodeURIComponent(attemptId)}&contactKey=${encodeURIComponent(contactKey)}`
        );
        if (!res.ok) {
          return;
        }
        const body = (await res.json()) as {
          role?: string;
          notes?: string;
          updated_at?: string | null;
        };
        if (!cancelled) {
          setRole(body.role ?? "");
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
  }, [attemptId, contactKey]);

  /**
   * Saves role + relationship notes via POST.
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/student/crm-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, contactKey, role, notes }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Could not save contact.");
        return;
      }
      const body = (await res.json()) as {
        role: string;
        notes: string;
        updated_at: string;
      };
      setRole(body.role);
      setNotes(body.notes);
      setUpdatedAt(body.updated_at);
      onSaved?.({ role: body.role, notes: body.notes, updatedAt: body.updated_at });
    } catch {
      setError("Could not save contact.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatedLabel = formatUpdatedAt(updatedAt);
  const accountSuffix = accountLabel.trim() || "—";

  return (
    <div className="p-6 flex-grow overflow-auto">
      <div className="max-w-[1200px] mx-auto w-full space-y-6">
        <nav className="flex items-center gap-2 text-[#404848] text-[12px] font-medium tracking-wide">
          <button type="button" onClick={onBackToList} className="hover:text-[#0f4c4c] transition-colors">
            Contacts
          </button>
          <MaterialIcon name="chevron_right" className="text-[16px]" />
          <span className="text-[#161d1b]">{profile.name}</span>
        </nav>

        <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm p-6">
          <span className="text-[12px] font-medium tracking-widest uppercase text-[#404848]">
            Contact
          </span>
          <h2 className="text-[32px] leading-10 font-semibold tracking-tight text-[#003434] mt-1">
            {profile.name}
          </h2>
          <p className="text-sm text-[#404848] mt-1">
            {profile.title} · {accountSuffix}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#bfc8c8] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#bfc8c8] bg-[#eef5f2]/20">
            <h3 className="text-lg font-semibold text-[#003434]">Relationship Profile</h3>
            <p className="text-sm text-[#404848] mt-1">
              Assign a buying-role and capture notes anytime — not stage-gated.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2 max-w-md">
              <label className="text-[12px] font-medium tracking-wide text-[#404848]">
                Role in Decision
              </label>
              <select
                className="w-full bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all disabled:opacity-50"
                value={role}
                disabled={isLoading}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select a role…</option>
                {ROLE_OPTIONS.filter((opt) => opt !== "").map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-medium tracking-wide text-[#404848]">
                Relationship Notes
              </label>
              {isLoading ? (
                <p className="text-sm text-[#404848]">Loading notes…</p>
              ) : (
                <textarea
                  className="w-full min-h-[140px] bg-[#eef5f2] border border-[#bfc8c8] rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f4c4c] focus:border-[#0f4c4c] outline-none transition-all placeholder:text-[#bfc8c8] resize-y"
                  placeholder="Priorities, rapport, last conversation, personal drivers…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              )}
            </div>

            {updatedLabel ? (
              <p className="text-[12px] text-[#404848]">Last updated {updatedLabel}</p>
            ) : !isLoading ? (
              <p className="text-[12px] text-[#707978]">No relationship notes yet.</p>
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
