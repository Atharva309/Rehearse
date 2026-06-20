/**
 * TempoSimulationEntryView.tsx
 * Stitch entry layout for the Tempo simulation in Rehearse Essentials —
 * hero, assignment, 5-stage timeline, scoring, ground rules, and CTA.
 */

import Link from "next/link";
import { RestartSimulationButton } from "@/components/simulation/RestartSimulationButton";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { COLORS } from "@/lib/design-tokens";
import {
  TEMPO_PRODUCT_VALUE_DRIVERS,
  TEMPO_STAGES,
  getTempoStageStatus,
  type TempoStageDefinition,
} from "@/lib/tempo-simulation";
import type { SimulationStage } from "@/types";

type TempoSimulationEntryViewProps = {
  classId: string;
  simulationId: string;
  simulationTitle: string;
  ctaHref: string;
  ctaLabel: string;
  hasInProgressAttempt: boolean;
  restartAttemptId: string | null;
  completedStageKeys: ReadonlySet<string>;
  currentStage: SimulationStage | null;
  lastStageScore: number | null;
};

type TempoStageCardProps = {
  stage: TempoStageDefinition;
  status: "static" | "completed" | "current" | "upcoming";
};

/**
 * Renders one stage node in the Tempo entry timeline.
 */
function TempoStageCard({ stage, status }: TempoStageCardProps): React.ReactElement {
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const isUpcoming = status === "upcoming" || status === "static";

  const circleClass = isCompleted
    ? "bg-tertiary-container text-white border-tertiary-container"
    : isCurrent
      ? "bg-secondary text-white border-secondary animate-pulse"
      : "bg-white text-on-surface-variant border-outline-variant";

  const modalityClass =
    stage.modality === "Live Voice Call"
      ? "bg-blue-100 text-blue-700"
      : stage.modality === "Written Scenarios"
        ? "bg-tertiary-container/20 text-tertiary"
        : "bg-surface-container-highest text-on-surface-variant";

  return (
    <div
      className={`flex flex-col rounded-xl border border-outline-variant bg-white p-4 shadow-sm ${
        isUpcoming && status !== "static" ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${circleClass}`}
        >
          {isCompleted ? (
            <MaterialIcon name="check_circle" className="text-[20px]" filled />
          ) : isCurrent ? (
            <MaterialIcon name="play_arrow" className="text-[20px]" filled />
          ) : (
            <MaterialIcon name={stage.icon} className="text-[20px]" />
          )}
        </div>
        <div>
          <p className="font-headline-md text-headline-md font-bold text-primary">
            {stage.number}. {stage.title}
          </p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${modalityClass}`}>
            {stage.modality}
          </span>
        </div>
      </div>
      <p className="font-body-md text-on-surface-variant text-sm leading-relaxed flex-1">
        {stage.description}
      </p>
      <p className="font-label-sm text-on-surface-variant mt-3">{stage.time}</p>
      {stage.noAI && (
        <p className="font-label-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
          No AI assistance during this call
        </p>
      )}
    </div>
  );
}

/**
 * Full Tempo simulation entry page body (student header comes from layout).
 */
export function TempoSimulationEntryView({
  classId,
  simulationId,
  simulationTitle,
  ctaHref,
  ctaLabel,
  hasInProgressAttempt,
  restartAttemptId,
  completedStageKeys,
  currentStage,
  lastStageScore,
}: TempoSimulationEntryViewProps): React.ReactElement {
  const entryRedirectHref = `/student/simulation/${simulationId}/entry?classId=${classId}`;

  return (
    <div>
      {/* Hero — full bleed */}
      <section className="relative w-full bg-primary-container px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {hasInProgressAttempt && restartAttemptId && (
          <div className="absolute top-6 right-6 z-10">
            <RestartSimulationButton
              attemptId={restartAttemptId}
              simulationId={simulationId}
              classId={classId}
              simulationTitle={simulationTitle}
              variant="onDark"
              redirectHref={entryRedirectHref}
            />
          </div>
        )}

        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-12">
          <div className="flex-1 min-w-0">
            {hasInProgressAttempt ? (
              <span className="font-code-md text-tertiary-container text-sm uppercase tracking-widest">
                IN PROGRESS
              </span>
            ) : (
              <span className="font-code-md text-tertiary-container text-sm uppercase tracking-widest">
                NEW SIMULATION
              </span>
            )}

            <h1 className="mt-3 text-white font-display text-[32px] sm:text-[40px] leading-tight font-bold">
              <span className="opacity-70 font-normal block sm:inline">Sell Tempo to</span>
              <span className="block">Summit Dental Group</span>
            </h1>

            <p className="mt-4 text-on-primary-container font-body-lg max-w-lg leading-relaxed">
              You&apos;re a newly hired Account Executive at Tempo. You&apos;ve been assigned your
              first account. Work the deal from first contact to close — five stages, one continuous
              account, one shot to prove you can sell.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              {[
                { icon: "location_on", text: "Denver, CO" },
                { icon: "business", text: "8 dental practices" },
                { icon: "schedule", text: "~60 minutes total" },
              ].map((pill) => (
                <span
                  key={pill.text}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white rounded-full font-label-sm text-label-sm"
                >
                  <MaterialIcon name={pill.icon} className="text-[16px]" />
                  {pill.text}
                </span>
              ))}
            </div>
          </div>

          {/* CRM card — crmCardDepth token */}
          <div
            className="w-full lg:w-72 shrink-0 border border-white/10 rounded-xl p-6 font-code-md"
            style={{ backgroundColor: COLORS.crmCardDepth }}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">ACCOUNT</p>
            <p className="text-white font-bold text-lg mb-4">Summit Dental Group</p>
            <div className="space-y-2 border-t border-white/10 pt-4">
              {[
                { label: "Industry", value: "Dental" },
                { label: "Locations", value: "8 practices" },
                { label: "Region", value: "Colorado Front Range" },
                { label: "Founded", value: "2009" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <span className="text-white/40 text-xs">{row.label}</span>
                  <span className="text-white text-xs text-right">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">YOUR CONTACT</p>
              <p className="text-white font-bold text-sm">Dana Reyes</p>
              <p className="text-white/60 text-xs">Director of Operations</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/40 text-xs">Available for discovery call</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto text-center pt-10 lg:pt-12 mt-10 lg:mt-12 border-t border-white/10">
          <h2 className="text-white font-display text-display">Ready to start?</h2>
          <p className="text-on-primary-container font-body-lg mt-3 mb-8">
            Stage 1 takes about 15 minutes. Your progress is saved automatically.
          </p>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 px-10 py-5 bg-tertiary-container text-on-tertiary-fixed font-bold text-lg rounded-xl transition-all active:scale-95 duration-150 shadow-xl hover:opacity-90"
          >
            {ctaLabel}
            <MaterialIcon name="arrow_forward" />
          </Link>

          <p className="text-white/40 font-label-sm mt-4">Estimated total time: ~60 minutes</p>

          {hasInProgressAttempt && lastStageScore !== null && (
            <p className="text-white/40 font-label-sm mt-2">Last stage score: {lastStageScore}/100</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-surface py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1100px] mx-auto space-y-12 lg:space-y-16">
          {/* Assignment */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-7 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
              <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2 text-primary">
                <MaterialIcon name="assignment" className="text-secondary" />
                Your Assignment
              </h3>
              <div className="font-body-md text-on-surface-variant leading-relaxed space-y-4">
                <p>
                  Summit Dental Group is Denver&apos;s fastest-growing dental network. They&apos;ve
                  expanded from 3 to 8 locations in 18 months, but their technology stack hasn&apos;t
                  kept pace. Front desk turnover is at an all-time high, and patient no-shows are
                  eating 15% of their monthly revenue.
                </p>
                <p>
                  As the Tempo AE, your goal is to guide Dana Reyes through the realization that
                  manual appointment management is no longer sustainable. You&apos;ll need to
                  demonstrate how Tempo&apos;s AI-driven scheduling layer integrates with their
                  legacy PMP to recover lost revenue and stabilize operations.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
              <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2 text-primary">
                <MaterialIcon name="inventory_2" className="text-secondary" />
                Your Product: Tempo AI
              </h3>
              <p className="font-body-md text-on-surface-variant mb-4">
                AI-powered scheduling that integrates with practice management systems to cut
                no-shows and free your front desk.
              </p>
              <ul className="space-y-4">
                {TEMPO_PRODUCT_VALUE_DRIVERS.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <MaterialIcon
                      name={item.icon}
                      className="text-green-600 bg-green-50 p-1 rounded shrink-0 text-[20px]"
                    />
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{item.title}</p>
                      <p className="font-body-md text-on-surface-variant text-sm">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5 stages */}
          <div className="space-y-6">
            <h3 className="font-headline-md text-headline-md flex items-center gap-2 text-primary">
              <MaterialIcon name="reorder" className="text-secondary" />
              The 5 Stages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {TEMPO_STAGES.map((stage) => {
                const status = hasInProgressAttempt
                  ? getTempoStageStatus(stage, completedStageKeys, currentStage)
                  : "static";
                return <TempoStageCard key={stage.number} stage={stage} status={status} />;
              })}
            </div>
          </div>

          {/* Scoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl border border-outline-variant p-6">
              <h3 className="font-headline-md text-headline-md mb-4 text-primary">How You&apos;re Scored</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm text-on-surface">Substance</span>
                    <span className="text-on-surface-variant text-xs italic">Accuracy, product knowledge</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-[70%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-sm text-on-surface">Style</span>
                    <span className="text-on-surface-variant text-xs italic">Tone, clarity, empathy</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[30%]" />
                  </div>
                </div>
              </div>
              <p className="font-body-md text-on-surface-variant mt-4">
                Rehearse AI analyzes your transcript and tone across sales competencies. A strong
                score on each stage helps you pass the simulation.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant p-6">
              <h3 className="font-headline-md text-headline-md mb-4 text-primary">Achievable Badges</h3>
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: "workspace_premium", label: "Objection Master", tone: "tertiary" },
                  { icon: "speed", label: "Deal Velocity", tone: "secondary" },
                  { icon: "psychology", label: "Empathy Pro", tone: "muted" },
                ].map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                        badge.tone === "muted"
                          ? "bg-gray-50 border-gray-200 opacity-50 grayscale"
                          : badge.tone === "tertiary"
                            ? "bg-tertiary-container/10 border-tertiary-container/30"
                            : "bg-blue-50 border-blue-100"
                      }`}
                    >
                      <MaterialIcon
                        name={badge.icon}
                        className={`text-2xl ${
                          badge.tone === "muted"
                            ? "text-on-surface-variant"
                            : badge.tone === "tertiary"
                              ? "text-tertiary-fixed-dim"
                              : "text-secondary"
                        }`}
                        filled={badge.tone !== "muted"}
                      />
                    </div>
                    <span
                      className={`font-label-sm text-center ${
                        badge.tone === "muted" ? "text-on-surface-variant" : "text-on-surface"
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ground rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "smart_toy",
                title: "AI helps you prepare",
                body: "Stages 1, 3, and 5 — use AI tools to research, draft, and refine your work.",
                border: "border-l-secondary",
              },
              {
                icon: "videocam_off",
                title: "Live calls are yours alone",
                body: "Stages 2 and 4 — no AI assistance during live voice calls with the prospect.",
                border: "border-l-amber-500",
              },
              {
                icon: "history",
                title: "You can retry",
                body: "Start fresh with a new attempt if you want another shot at the deal.",
                border: "border-l-green-500",
              },
            ].map((rule) => (
              <div
                key={rule.title}
                className={`flex gap-4 bg-white rounded-xl border border-outline-variant p-5 border-l-4 ${rule.border}`}
              >
                <MaterialIcon name={rule.icon} className="text-secondary text-3xl shrink-0" />
                <div>
                  <h4 className="font-bold text-on-surface mb-1">{rule.title}</h4>
                  <p className="font-body-md text-on-surface-variant text-sm">{rule.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
