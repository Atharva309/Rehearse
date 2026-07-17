/**
 * ProspectingCompanyDirectory.tsx
 * Two-column Prospecting research step: company list + scoped chat (or empty state).
 * No page chrome — embeds inside the existing Prospecting wizard center column.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { ProspectingScopedChat } from "@/components/tempo/stages/ProspectingScopedChat";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { ProspectDirectoryCompany } from "@/lib/tempo-prospect-directory";
import type { ChatMessage } from "@/types";

type ProspectingCompanyDirectoryProps = {
  attemptId: string;
  selectedCompanyId: string | null;
  companyChats: Record<string, ChatMessage[]>;
  chatInput: string;
  isAILoading: boolean;
  onSelectCompany: (companyId: string) => void;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  /** Called when the directory finishes loading so the hook can cache public rows. */
  onCompaniesLoaded: (companies: ProspectDirectoryCompany[]) => void;
};

/**
 * Left directory list + right scoped chat / empty canvas.
 */
export function ProspectingCompanyDirectory({
  attemptId,
  selectedCompanyId,
  companyChats,
  chatInput,
  isAILoading,
  onSelectCompany,
  onChatInputChange,
  onSendMessage,
  onCompaniesLoaded,
}: ProspectingCompanyDirectoryProps): React.ReactElement {
  const [companies, setCompanies] = useState<ProspectDirectoryCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/student/prospect-directory?attemptId=${encodeURIComponent(attemptId)}`
        );
        if (!res.ok) {
          if (!cancelled) {
            setError("Could not load company directory.");
          }
          return;
        }
        const body = (await res.json()) as { companies?: ProspectDirectoryCompany[] };
        const next = body.companies ?? [];
        if (!cancelled) {
          setCompanies(next);
          onCompaniesLoaded(next);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load company directory.");
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
    // Intentionally only re-fetch when attempt changes; parent callback is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return companies;
    }
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.signalHint.toLowerCase().includes(q)
    );
  }, [companies, search]);

  const selected =
    selectedCompanyId === null
      ? null
      : companies.find((c) => c.id === selectedCompanyId) ?? null;

  const selectedMessages =
    selectedCompanyId && companyChats[selectedCompanyId]
      ? companyChats[selectedCompanyId]
      : [];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[520px] border border-outline-variant rounded-xl overflow-hidden bg-surface">
      {/* Left: company list */}
      <section className="w-full lg:w-[280px] xl:w-[300px] flex flex-col bg-surface-container-lowest border-b lg:border-b-0 lg:border-r border-outline-variant shrink-0 min-h-0">
        <div className="p-3 border-b border-outline-variant shrink-0">
          <div className="mb-2">
            <nav className="flex items-center gap-0.5 text-[10px] leading-tight text-on-surface-variant mb-0.5">
              <span>Prospecting</span>
              <MaterialIcon name="chevron_right" className="text-[12px]" />
              <span className="text-primary font-bold">Company Directory</span>
            </nav>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-primary leading-tight">Candidate Companies</h2>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  Review each and decide who&apos;s worth pursuing.
                </p>
              </div>
              <span className="shrink-0 bg-surface-container-high px-1.5 py-0.5 rounded text-[10px] text-on-surface-variant">
                {companies.length} Companies
              </span>
            </div>
          </div>
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]"
            />
            <input
              className="w-full h-8 pl-9 pr-3 bg-surface-container border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all"
              placeholder="Search companies..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {isLoading ? (
            <p className="text-body-md text-on-surface-variant py-4 text-center">Loading…</p>
          ) : error ? (
            <p className="text-sm text-error py-4 text-center">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-4 text-center">No matches.</p>
          ) : (
            filtered.map((company) => {
              const isSelected = selectedCompanyId === company.id;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => onSelectCompany(company.id)}
                  className={`w-full text-left p-2.5 rounded-lg cursor-pointer transition-all group active:scale-[0.99] border ${
                    isSelected
                      ? "bg-surface border-2 border-secondary shadow-sm"
                      : "bg-surface border-outline-variant hover:border-outline hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-1.5">
                    <h3
                      className={`text-[13px] leading-tight font-bold transition-colors ${
                        isSelected ? "text-primary" : "text-on-surface group-hover:text-primary"
                      }`}
                    >
                      {company.name}
                    </h3>
                    <span className="text-[9px] leading-tight px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                      {company.industry}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] leading-tight text-on-surface-variant mb-1">
                    <MaterialIcon name="groups" className="text-[12px]" />
                    <span>{company.sizeLabel}</span>
                  </div>
                  <div className="flex items-start gap-1 pt-1 border-t border-dashed border-outline-variant/50">
                    <MaterialIcon
                      name="rss_feed"
                      className="text-[12px] text-secondary shrink-0"
                    />
                    <p className="text-[10px] leading-tight text-on-surface-variant font-medium line-clamp-1 italic">
                      {company.signalHint}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Right: empty state or scoped chat */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface-container-low">
        {selected ? (
          <div className="flex-1 flex flex-col p-md min-h-0">
            <ProspectingScopedChat
              company={selected}
              messages={selectedMessages}
              chatInput={chatInput}
              isAILoading={isAILoading}
              onChatInputChange={onChatInputChange}
              onSendMessage={onSendMessage}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-xl relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative z-10 text-center max-w-md">
              <div className="w-24 h-24 bg-surface rounded-2xl border border-outline-variant shadow-lg flex items-center justify-center mx-auto mb-lg">
                <MaterialIcon
                  name="domain_verification"
                  className="text-[48px] text-outline"
                />
              </div>
              <h3 className="font-display text-display text-primary mb-md">Ready for Analysis</h3>
              <p className="text-body-lg text-on-surface-variant mb-xl leading-relaxed">
                Select a company from the list to begin your research. You&apos;ll dig into recent
                signals and ask grounded questions, then decide who belongs on your Lead list.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-surface/80 border border-outline-variant rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MaterialIcon name="verified" className="text-secondary text-[18px]" />
                    <span className="text-label-md font-bold">Known Facts</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    Start from each company&apos;s industry, scale, and trigger signal.
                  </p>
                </div>
                <div className="p-4 bg-surface/80 border border-outline-variant rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MaterialIcon name="psychology" className="text-secondary text-[18px]" />
                    <span className="text-label-md font-bold">Verify Claims</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    AI research can stretch beyond the brief. Check what you can trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
