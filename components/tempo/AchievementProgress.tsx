/**
 * AchievementProgress.tsx
 * Data-driven Tempo badge sidebar for the results page.
 * Reads stage_scores.badges_earned; icons/names from lib/tempo-badges.ts.
 */

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  DISCOVERY_BADGES,
  NEGOTIATION_BADGES,
  OBJECTION_BADGES,
  PRESENTATION_BADGES,
  PROSPECTING_BADGES,
  TEMPO_BADGE_ICONS,
} from "@/lib/tempo-badges";
import type { SimulationStage, StageScore } from "@/types";

type BadgeDef = {
  id: string;
  name: string;
  description: string;
};

type AchievementSection = {
  stageKey: SimulationStage;
  label: string;
  badges: readonly BadgeDef[];
};

const ACHIEVEMENT_SECTIONS: AchievementSection[] = [
  { stageKey: "prospecting", label: "Prospecting", badges: PROSPECTING_BADGES },
  { stageKey: "discovery", label: "Discovery", badges: DISCOVERY_BADGES },
  { stageKey: "presentation", label: "Presentation", badges: PRESENTATION_BADGES },
  { stageKey: "objections", label: "Objection Handling", badges: OBJECTION_BADGES },
  { stageKey: "close", label: "Negotiation", badges: NEGOTIATION_BADGES },
];

const TOTAL_BADGE_COUNT = ACHIEVEMENT_SECTIONS.reduce(
  (sum, section) => sum + section.badges.length,
  0
);

type AchievementProgressProps = {
  stageScores: StageScore[];
};

type BadgeCellProps = {
  badge: BadgeDef;
  isEarned: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

/**
 * Returns earned badge IDs for a stage, or [] if missing.
 */
function earnedIdsForStage(
  stageScores: StageScore[],
  stageKey: SimulationStage
): Set<string> {
  const row = stageScores.find((score) => score.stage === stageKey);
  const raw = row?.badges_earned;
  if (!Array.isArray(raw)) {
    return new Set();
  }
  return new Set(raw.filter((id): id is string => typeof id === "string"));
}

/**
 * Single badge cell with hover/focus/tap tooltip (earned or locked).
 */
function BadgeCell({
  badge,
  isEarned,
  isOpen,
  onToggle,
  onClose,
}: BadgeCellProps): React.ReactElement {
  const tipId = useId();
  const iconName = TEMPO_BADGE_ICONS[badge.id] ?? "military_tech";

  return (
    <div className="relative group">
      <button
        type="button"
        aria-describedby={isOpen ? tipId : undefined}
        aria-label={`${isEarned ? "Earned" : "Locked"}: ${badge.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        onBlur={(event) => {
          const next = event.relatedTarget as Node | null;
          if (next && event.currentTarget.parentElement?.contains(next)) {
            return;
          }
          onClose();
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 ${
          isEarned
            ? "bg-tertiary-fixed shadow-[0_0_12px_rgba(201,168,76,0.2)] border border-tertiary-container/30 hover:scale-110"
            : "border-2 border-dashed border-outline-variant bg-surface-container-low opacity-40 grayscale"
        }`}
      >
        <MaterialIcon
          name={isEarned ? iconName : "lock"}
          filled={isEarned}
          className={`text-[18px] ${
            isEarned ? "text-on-tertiary-fixed" : "text-outline"
          }`}
        />
      </button>

      <div
        id={tipId}
        role="tooltip"
        className={`absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-on-surface text-surface-container-lowest rounded-lg shadow-xl pointer-events-none transition-opacity duration-200 ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible"
        }`}
      >
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-on-surface"
          aria-hidden
        />
        <p
          className={`font-code-md text-[10px] uppercase tracking-wider mb-1 ${
            isEarned ? "text-tertiary-fixed" : "text-outline-variant"
          }`}
        >
          {isEarned ? "Earned Badge" : "Locked"}
        </p>
        <p className="text-body-md font-semibold text-[12px] text-surface-container-lowest leading-snug">
          {badge.name}
        </p>
        <p className="text-body-md text-[11px] text-outline-variant leading-tight mt-1">
          {badge.description}
        </p>
      </div>
    </div>
  );
}

/**
 * Achievement Progress card — earned vs locked Tempo badges by stage.
 */
export function AchievementProgress({
  stageScores,
}: AchievementProgressProps): React.ReactElement {
  const [openBadgeId, setOpenBadgeId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * Closes tap-opened tooltips when clicking outside the card.
     */
    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenBadgeId(null);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  let earnedTotal = 0;
  const sectionData = ACHIEVEMENT_SECTIONS.map((section) => {
    const earned = earnedIdsForStage(stageScores, section.stageKey);
    const earnedCount = section.badges.filter((badge) => earned.has(badge.id)).length;
    earnedTotal += earnedCount;
    return { section, earned, earnedCount };
  });

  const progressPct =
    TOTAL_BADGE_COUNT === 0 ? 0 : Math.round((earnedTotal / TOTAL_BADGE_COUNT) * 100);

  return (
    <div
      ref={rootRef}
      className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant p-5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-medium text-on-surface leading-7">Achievements</h3>
          <p className="text-body-md text-on-surface-variant">Simulation Mastery</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-code-md text-[13px] text-primary font-bold">
            {earnedTotal} / {TOTAL_BADGE_COUNT}
          </span>
          <div className="w-16 h-1.5 bg-surface-container-high rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage sections */}
      <div className="space-y-6">
        {sectionData.map(({ section, earned, earnedCount }) => (
          <section key={section.stageKey}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-body-md font-medium text-on-surface">{section.label}</span>
              <span className="font-code-md text-[11px] text-on-surface-variant">
                {earnedCount}/{section.badges.length}
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] gap-2">
              {section.badges.map((badge) => {
                const isEarned = earned.has(badge.id);
                return (
                  <BadgeCell
                    key={badge.id}
                    badge={badge}
                    isEarned={isEarned}
                    isOpen={openBadgeId === badge.id}
                    onToggle={() =>
                      setOpenBadgeId((prev) => (prev === badge.id ? null : badge.id))
                    }
                    onClose={() =>
                      setOpenBadgeId((prev) => (prev === badge.id ? null : prev))
                    }
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Footer — no Playbook route exists yet */}
      <div className="mt-8 pt-4 border-t border-outline-variant flex items-center justify-between">
        <span className="text-body-md text-on-surface-variant">Unlock more badges</span>
        <button
          type="button"
          disabled
          title="Playbook link coming soon"
          className="flex items-center gap-1 text-primary opacity-40 cursor-not-allowed"
        >
          <span className="text-body-md font-bold">Review Playbook</span>
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}
