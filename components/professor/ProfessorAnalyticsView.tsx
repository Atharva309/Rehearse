/**
 * ProfessorAnalyticsView.tsx
 * Professor analytics dashboard with date, class, and simulation filters.
 */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FadeIn } from "@/components/professor/FadeIn";
import { ProfessorPortalLayout } from "@/components/shared/Sidebar";
import { scorePercent } from "@/lib/grades";

export type ProfessorAnalyticsPayload = {
  classes: { id: string; name: string }[];
  simulations: { id: string; title: string; is_published: boolean }[];
  attempts: {
    simulation_id: string;
    student_id: string;
    status: string;
    total_score: number;
    started_at: string;
  }[];
  enrollmentRows: { class_id: string; student_id: string }[];
  classSimulationRows: { class_id: string; simulation_id: string }[];
};

type DateRangeId = "30d" | "7d" | "all";

type FilteredMetrics = {
  classCount: number;
  studentCount: number;
  simulationCount: number;
  publishedCount: number;
  totalAttempts: number;
  completedAttempts: number;
  avgScorePercent: number | null;
};

type ProfessorAnalyticsViewProps = {
  userName: string;
  payload: ProfessorAnalyticsPayload;
};

const DATE_OPTIONS: { id: DateRangeId; label: string }[] = [
  { id: "30d", label: "Last 30 Days" },
  { id: "7d", label: "Last 7 Days" },
  { id: "all", label: "All Time" },
];

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

function analyticsPercentGrade(percent: number): string {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

function analyticsScoreColorClass(percent: number | null): string {
  if (percent == null) return "text-secondary";
  if (percent >= 80) return "text-tertiary";
  if (percent >= 60) return "text-secondary";
  return "text-error";
}

function computeFilteredMetrics(
  payload: ProfessorAnalyticsPayload,
  dateRange: DateRangeId,
  classId: string,
  simulationId: string
): FilteredMetrics {
  const now = Date.now();
  const cutoffMs =
    dateRange === "30d"
      ? now - 30 * 24 * 60 * 60 * 1000
      : dateRange === "7d"
        ? now - 7 * 24 * 60 * 60 * 1000
        : 0;

  let attempts = payload.attempts.filter((a) => {
    if (dateRange === "all") return true;
    return new Date(a.started_at).getTime() >= cutoffMs;
  });

  if (classId !== "all") {
    const studentIds = new Set(
      payload.enrollmentRows
        .filter((e) => e.class_id === classId)
        .map((e) => e.student_id)
    );
    const simIds = new Set(
      payload.classSimulationRows
        .filter((cs) => cs.class_id === classId)
        .map((cs) => cs.simulation_id)
    );
    attempts = attempts.filter(
      (a) => studentIds.has(a.student_id) && simIds.has(a.simulation_id)
    );
  }

  if (simulationId !== "all") {
    attempts = attempts.filter((a) => a.simulation_id === simulationId);
  }

  let simsScope = payload.simulations;
  if (classId !== "all") {
    const assignedSimIds = new Set(
      payload.classSimulationRows
        .filter((cs) => cs.class_id === classId)
        .map((cs) => cs.simulation_id)
    );
    simsScope = simsScope.filter((s) => assignedSimIds.has(s.id));
  }
  if (simulationId !== "all") {
    simsScope = simsScope.filter((s) => s.id === simulationId);
  }

  const studentCount =
    classId === "all"
      ? payload.enrollmentRows.length
      : new Set(
          payload.enrollmentRows
            .filter((e) => e.class_id === classId)
            .map((e) => e.student_id)
        ).size;

  const completed = attempts.filter((a) => a.status === "completed");
  let avgScorePercent: number | null = null;
  if (completed.length > 0) {
    avgScorePercent = Math.round(
      completed.reduce((sum, a) => sum + scorePercent(a.total_score), 0) / completed.length
    );
  }

  return {
    classCount: classId === "all" ? payload.classes.length : 1,
    studentCount,
    simulationCount: simsScope.length,
    publishedCount: simsScope.filter((s) => s.is_published).length,
    totalAttempts: attempts.length,
    completedAttempts: completed.length,
    avgScorePercent,
  };
}

type AnalyticsFilterMenuProps = {
  icon: string;
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
};

function AnalyticsFilterMenu({
  icon,
  label,
  options,
  value,
  onChange,
}: AnalyticsFilterMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value)?.label ?? label;

  useEffect(() => {
    const onDocClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-sm px-md py-xs border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors text-on-surface-variant"
      >
        <MaterialIcon name={icon} className="text-body-lg" />
        <span className="font-label-md">{selected}</span>
        <MaterialIcon
          name="expand_more"
          className={`text-body-lg transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[180px] bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={`w-full text-left px-md py-2 font-body-md hover:bg-surface-container-low transition-colors ${
                value === option.id ? "bg-surface-container-low font-medium" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Analytics overview with working date, class, and simulation filters.
 */
export function ProfessorAnalyticsView({
  userName,
  payload,
}: ProfessorAnalyticsViewProps): React.ReactElement {
  const [dateRange, setDateRange] = useState<DateRangeId>("30d");
  const [classId, setClassId] = useState("all");
  const [simulationId, setSimulationId] = useState("all");

  const classOptions = useMemo(
    () => [
      { id: "all", label: "All Classes" },
      ...payload.classes.map((c) => ({ id: c.id, label: c.name })),
    ],
    [payload.classes]
  );

  const simulationOptions = useMemo(() => {
    let sims = payload.simulations;
    if (classId !== "all") {
      const assigned = new Set(
        payload.classSimulationRows
          .filter((cs) => cs.class_id === classId)
          .map((cs) => cs.simulation_id)
      );
      sims = sims.filter((s) => assigned.has(s.id));
    }
    return [
      { id: "all", label: "All Simulations" },
      ...sims.map((s) => ({ id: s.id, label: s.title })),
    ];
  }, [payload.simulations, payload.classSimulationRows, classId]);

  useEffect(() => {
    if (simulationId !== "all" && !simulationOptions.some((o) => o.id === simulationId)) {
      setSimulationId("all");
    }
  }, [simulationId, simulationOptions]);

  const data = useMemo(
    () => computeFilteredMetrics(payload, dateRange, classId, simulationId),
    [payload, dateRange, classId, simulationId]
  );

  const completionRate =
    data.totalAttempts > 0
      ? Math.round((data.completedAttempts / data.totalAttempts) * 100)
      : null;
  const inProgressAttempts = data.totalAttempts - data.completedAttempts;
  const draftCount = data.simulationCount - data.publishedCount;
  const hasNoData =
    payload.enrollmentRows.length === 0 && payload.attempts.length === 0;
  const completedBarWidth =
    data.totalAttempts > 0 ? (data.completedAttempts / data.totalAttempts) * 100 : 0;
  const inProgressBarWidth =
    data.totalAttempts > 0 ? (inProgressAttempts / data.totalAttempts) * 100 : 0;
  const ringOffset =
    completionRate != null ? 440 - (440 * completionRate) / 100 : 440;
  const avgGrade =
    data.avgScorePercent != null ? analyticsPercentGrade(data.avgScorePercent) : null;
  const scoreColor = analyticsScoreColorClass(data.avgScorePercent);

  return (
    <ProfessorPortalLayout userName={userName} activeNav="analytics">
      <FadeIn className="max-w-[1440px] mx-auto p-lg lg:p-xl">
        <header className="mb-xl">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">Analytics</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Track enrollment, simulation usage, and student performance across your portal.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-end gap-md mb-xl pb-md border-b border-outline-variant">
          <AnalyticsFilterMenu
            icon="calendar_today"
            label="Last 30 Days"
            options={DATE_OPTIONS}
            value={dateRange}
            onChange={(id) => setDateRange(id as DateRangeId)}
          />
          <AnalyticsFilterMenu
            icon="school"
            label="All Classes"
            options={classOptions}
            value={classId}
            onChange={setClassId}
          />
          <AnalyticsFilterMenu
            icon="model_training"
            label="All Simulations"
            options={simulationOptions}
            value={simulationId}
            onChange={setSimulationId}
          />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
          <div className="analytics-card bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm hover:border-secondary transition-all">
            <div className="flex items-start justify-between mb-md">
              <div className="p-sm bg-secondary-fixed rounded-lg">
                <MaterialIcon name="school" className="text-secondary" />
              </div>
              <span className="text-secondary font-label-sm flex items-center gap-1">
                Live <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              </span>
            </div>
            <div className="font-display text-display text-primary leading-none mb-xs">{data.classCount}</div>
            <div className="font-headline-md text-headline-md mb-xs">Active Classes</div>
            <div className="font-body-md text-on-surface-variant">Teaching cohorts</div>
          </div>

          <div className="analytics-card bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm hover:border-tertiary transition-all">
            <div className="flex items-start justify-between mb-md">
              <div className="p-sm bg-tertiary-fixed rounded-lg">
                <MaterialIcon name="groups" className="text-tertiary" />
              </div>
            </div>
            <div className="font-display text-display text-primary leading-none mb-xs">{data.studentCount}</div>
            <div className="font-headline-md text-headline-md mb-xs">Enrolled Students</div>
            <div className="font-body-md text-on-surface-variant">Across all classes</div>
          </div>

          <div className="analytics-card bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm hover:border-tertiary-container transition-all">
            <div className="flex items-start justify-between mb-md">
              <div className="p-sm bg-tertiary-fixed-dim rounded-lg">
                <MaterialIcon name="model_training" className="text-on-tertiary-fixed" />
              </div>
            </div>
            <div className="font-display text-display text-primary leading-none mb-xs">{data.simulationCount}</div>
            <div className="font-headline-md text-headline-md mb-xs">Simulations</div>
            <div className="font-body-md text-on-surface-variant">Total in your library</div>
          </div>

          <div className="analytics-card bg-primary-container border border-outline-variant p-md rounded-xl shadow-sm hover:bg-primary transition-all group">
            <div className="flex items-start justify-between mb-md">
              <div className="p-sm bg-on-primary-container rounded-lg">
                <MaterialIcon name="visibility" className="text-primary-fixed" />
              </div>
              {draftCount > 0 && (
                <span className="bg-on-primary-fixed-variant text-primary-fixed px-sm py-xs rounded-full font-label-sm">
                  {draftCount} draft{draftCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="font-display text-display text-white leading-none mb-xs">
              {data.publishedCount}
            </div>
            <div className="font-headline-md text-headline-md mb-xs text-white">Published</div>
            <div className="font-body-md text-on-primary-container group-hover:text-primary-fixed-dim">
              Visible to students
            </div>
          </div>
        </section>

        {hasNoData && (
          <div className="bg-secondary-fixed/30 border border-secondary-fixed rounded-xl p-lg flex flex-col lg:flex-row items-start gap-md mb-xl">
            <MaterialIcon name="info" className="text-secondary shrink-0" />
            <div className="flex-1">
              <p className="font-label-md font-bold text-on-surface mb-1">
                Your analytics will populate as students join and complete simulations
              </p>
              <p className="font-body-md text-on-surface-variant">
                Start by creating a class, sharing the join code, and assigning a published simulation.
              </p>
            </div>
            <div className="flex items-center gap-sm shrink-0">
              <Link
                href="/teacher/classes"
                className="bg-primary-container text-white font-bold rounded-lg px-md h-9 flex items-center text-label-md hover:opacity-90 transition-opacity"
              >
                Create a Class
              </Link>
              <Link
                href="/teacher/simulation/new"
                className="border border-outline-variant text-on-surface font-bold rounded-lg px-md h-9 flex items-center text-label-md hover:bg-surface-container transition-colors"
              >
                Create a Simulation
              </Link>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-xl">
          <div className="analytics-card bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md">Total Attempts</h3>
              <MaterialIcon name="query_stats" className="opacity-40" />
            </div>
            <div className="p-lg">
              <div className="flex items-baseline gap-md mb-lg">
                <span className="font-display text-[48px] font-bold text-primary">{data.totalAttempts}</span>
                <span className="font-body-md text-on-surface-variant">Started or completed</span>
              </div>
              <div className="space-y-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-on-surface-variant">Completed</span>
                    <span className="font-code-md text-secondary">{data.completedAttempts}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${completedBarWidth}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-on-surface-variant">In progress</span>
                    <span className="font-code-md text-tertiary">{inProgressAttempts}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-tertiary opacity-60"
                      style={{ width: `${inProgressBarWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md">Completion Rate</h3>
              <MaterialIcon name="task_alt" className="opacity-40" />
            </div>
            <div className="p-lg flex flex-col items-center justify-center min-h-[220px]">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160" aria-hidden>
                  <circle
                    className="text-surface-variant"
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                  />
                  <circle
                    className="text-secondary transition-all duration-1000"
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray="440"
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-display text-primary">
                    {completionRate != null ? `${completionRate}%` : "—"}
                  </span>
                  <span className="font-label-sm text-on-surface-variant">Efficiency</span>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md">Average Score</h3>
              <MaterialIcon name="grade" className="opacity-40" />
            </div>
            <div className="p-lg">
              <div className="mb-xl">
                <div className="flex items-start justify-between gap-md">
                  <div className={`font-display text-[48px] font-bold leading-none ${scoreColor}`}>
                    {data.avgScorePercent != null ? `${data.avgScorePercent}%` : "—"}
                  </div>
                  {avgGrade && (
                    <div className="w-20 h-20 rounded-2xl bg-secondary-fixed flex items-center justify-center shrink-0">
                      <span className={`font-display text-display ${scoreColor}`}>{avgGrade}</span>
                    </div>
                  )}
                </div>
                <p className="font-label-sm text-on-surface-variant mt-4">
                  Based on {data.completedAttempts} completed run
                  {data.completedAttempts === 1 ? "" : "s"}
                </p>
              </div>
              <div className="bg-surface-container-low p-md rounded-lg">
                <div className="flex items-center gap-md text-on-surface-variant">
                  <MaterialIcon name="info" className="text-secondary shrink-0" />
                  <p className="font-label-sm">
                    {data.avgScorePercent != null
                      ? "Average score reflects all completed runs across your simulations."
                      : "Complete more simulations to see score trends."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <Link
            href="/teacher/classes"
            className="analytics-card group block p-xl bg-white border border-outline-variant rounded-xl shadow-sm hover:border-secondary hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-xl">
              <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <MaterialIcon name="view_list" className="!text-3xl" />
              </div>
              <div>
                <h4 className="font-headline-md text-headline-md text-primary group-hover:text-secondary transition-colors">
                  View Classes →
                </h4>
                <p className="font-body-md text-on-surface-variant mt-1">
                  Manage enrollments, rosters, and specific class cohorts.
                </p>
              </div>
            </div>
          </Link>
          <Link
            href="/teacher/library"
            className="analytics-card group block p-xl bg-white border border-outline-variant rounded-xl shadow-sm hover:border-tertiary hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-xl">
              <div className="w-14 h-14 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                <MaterialIcon name="rocket_launch" className="!text-3xl" />
              </div>
              <div>
                <h4 className="font-headline-md text-headline-md text-primary group-hover:text-tertiary transition-colors">
                  View Simulations →
                </h4>
                <p className="font-body-md text-on-surface-variant mt-1">
                  Review active scenario libraries and edit case studies.
                </p>
              </div>
            </div>
          </Link>
        </section>
      </FadeIn>
    </ProfessorPortalLayout>
  );
}
