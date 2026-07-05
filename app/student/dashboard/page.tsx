/**
 * dashboard/page.tsx — student
 * My Simulations hub — classes grouped with simulation cards, join class, and dev shortcuts.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  ATTEMPT_STATUS,
  DEFAULT_CLASS_ID,
  DEFAULT_CLASS_NAME,
  TEMPO_SIMULATION_ID,
} from "@/lib/constants";
import {
  loadStudentClassDetail,
  loadStudentEnrolledClasses,
} from "@/lib/student-class-data";
import { getCurrentTempoStage, isTempoDefaultSimulation } from "@/lib/tempo-simulation";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt, Simulation, SimulationStage } from "@/types";
import { JoinClassButton } from "./JoinClassButton";
import { TestResultsDropdown } from "./TestResultsDropdown";

export const metadata: Metadata = {
  title: "My Simulations — Rehearse",
};

type SimulationCardModel = {
  simulation: Simulation;
  classId: string;
  className: string;
  isDefaultClass: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  href: string;
  completedHref: string;
  currentStageNumber: number;
};

/**
 * Builds simulation card models for one enrolled class.
 */
function buildSimulationCards(
  classId: string,
  className: string,
  simulations: Simulation[],
  inProgressByKey: Map<string, Attempt>,
  completedByKey: Map<string, Attempt>,
  stageCountByAttempt: Map<string, number>
): SimulationCardModel[] {
  return simulations.map((simulation) => {
    const key = `${classId}:${simulation.id}`;
    const inProgress = inProgressByKey.get(key);
    const completed = completedByKey.get(key);
    const isDefaultClass = classId === DEFAULT_CLASS_ID;
    const isTempo = isDefaultClass && isTempoDefaultSimulation(simulation.id, simulation.title);

    const isInProgress = !!inProgress;
    const isCompleted = !isInProgress && !!completed;

    let currentStageNumber = 1;
    if (inProgress) {
      if (isTempo) {
        const stage = getCurrentTempoStage(inProgress.current_stage as SimulationStage | null);
        currentStageNumber = stage?.number ?? 1;
      } else {
        const completedStages = stageCountByAttempt.get(inProgress.id) ?? 0;
        currentStageNumber = Math.min(5, Math.max(1, completedStages + 1));
      }
    }

    const query = new URLSearchParams({ classId });
    if (inProgress) {
      query.set("attempt", inProgress.id);
    }

    const href = isTempo
      ? `/student/simulation/${simulation.id}/entry?classId=${classId}`
      : `/student/simulation/${simulation.id}?${query.toString()}`;

    const completedHref = completed
      ? `/student/simulation/${simulation.id}/complete?attempt=${completed.id}&classId=${classId}`
      : href;

    return {
      simulation,
      classId,
      className,
      isDefaultClass,
      isInProgress,
      isCompleted,
      href,
      completedHref,
      currentStageNumber,
    };
  });
}

type SimulationCardProps = {
  card: SimulationCardModel;
};

/**
 * Renders one simulation card on the student dashboard.
 */
function SimulationCard({ card }: SimulationCardProps): React.ReactElement {
  const { simulation, className, isInProgress, isCompleted, href, completedHref, currentStageNumber } =
    card;
  const progressPct = Math.round((currentStageNumber / 5) * 100);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-all p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="px-2 py-0.5 bg-secondary-fixed text-secondary font-bold text-[10px] uppercase rounded-full truncate max-w-[60%]">
          {className}
        </span>
        {isCompleted && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 font-bold text-[10px] rounded-full shrink-0">
            <span
              className="material-symbols-outlined text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            Completed
          </span>
        )}
        {isInProgress && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary-fixed text-secondary font-bold text-[10px] rounded-full shrink-0">
            In Progress
          </span>
        )}
      </div>

      <div>
        <h3 className="font-headline-md text-headline-md text-on-surface">{simulation.title}</h3>
        <p className="text-on-surface-variant font-body-md mt-1">
          {simulation.persona_name} · {simulation.persona_role}
        </p>
      </div>

      {isInProgress && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-label-sm text-on-surface-variant">
              Stage {currentStageNumber} of 5
            </span>
            <span className="text-label-sm text-on-surface-variant">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto">
        {!isInProgress && !isCompleted && (
          <Link
            href={href}
            className="w-full h-10 bg-primary-container text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors"
          >
            Start Simulation
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        )}
        {isInProgress && (
          <Link
            href={href}
            className="w-full h-10 border-2 border-secondary text-secondary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-colors"
          >
            Continue
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        )}
        {isCompleted && (
          <Link
            href={completedHref}
            className="w-full h-10 border border-outline-variant text-on-surface-variant font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
          >
            View Results
            <MaterialIcon name="bar_chart" className="text-[18px]" />
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Student home — simulations grouped by enrolled class.
 */
export default async function StudentDashboardPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const enrolledClasses = await loadStudentEnrolledClasses(session.studentId);
  const supabase = createServiceClient();

  const { data: inProgressAttempts } = await supabase
    .from("attempts")
    .select("id, simulation_id, class_id, current_stage, status")
    .eq("student_id", session.studentId)
    .eq("status", ATTEMPT_STATUS.IN_PROGRESS);

  const { data: completedAttempts } = await supabase
    .from("attempts")
    .select("id, simulation_id, class_id, status, completed_at")
    .eq("student_id", session.studentId)
    .eq("status", ATTEMPT_STATUS.COMPLETED)
    .order("completed_at", { ascending: false });

  const inProgressByKey = new Map<string, Attempt>();
  for (const attempt of (inProgressAttempts ?? []) as Attempt[]) {
    const classId = attempt.class_id as string | undefined;
    if (!classId) continue;
    inProgressByKey.set(`${classId}:${attempt.simulation_id}`, attempt);
  }

  const completedByKey = new Map<string, Attempt>();
  for (const attempt of (completedAttempts ?? []) as Attempt[]) {
    const classId = attempt.class_id as string | undefined;
    if (!classId) continue;
    const key = `${classId}:${attempt.simulation_id}`;
    if (!completedByKey.has(key)) {
      completedByKey.set(key, attempt);
    }
  }

  const inProgressIds = (inProgressAttempts ?? []).map((row) => row.id as string);
  const stageCountByAttempt = new Map<string, number>();

  if (inProgressIds.length > 0) {
    const { data: stageRows } = await supabase
      .from("stage_scores")
      .select("attempt_id")
      .in("attempt_id", inProgressIds);

    for (const row of stageRows ?? []) {
      const id = row.attempt_id as string;
      stageCountByAttempt.set(id, (stageCountByAttempt.get(id) ?? 0) + 1);
    }
  }

  const classSections = await Promise.all(
    enrolledClasses.map(async (cls) => {
      const detail = await loadStudentClassDetail(session.studentId, cls.classId);
      const simulations = detail?.simulations ?? [];
      const cards = buildSimulationCards(
        cls.classId,
        cls.classId === DEFAULT_CLASS_ID ? DEFAULT_CLASS_NAME : cls.className,
        simulations,
        inProgressByKey,
        completedByKey,
        stageCountByAttempt
      );

      return {
        classId: cls.classId,
        className: cls.classId === DEFAULT_CLASS_ID ? DEFAULT_CLASS_NAME : cls.className,
        isDefaultClass: cls.classId === DEFAULT_CLASS_ID,
        simulationCount: simulations.length,
        cards,
      };
    })
  );

  return (
    <div className="min-h-full bg-surface animate-fade-in-up">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">My Simulations</h1>
            <p className="text-on-surface-variant font-body-md">
              Welcome back, {session.displayName}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <JoinClassButton />
            <Link
              href={`/student/simulation/${TEMPO_SIMULATION_ID}?classId=${DEFAULT_CLASS_ID}&teststage=discovery`}
              title="Test Stage 2"
              className="inline-flex items-center rounded-md bg-amber-500 px-2 py-1.5 text-xs font-bold text-black shadow-sm transition-colors hover:bg-amber-400"
            >
              🧪 2
            </Link>
            <Link
              href={`/student/simulation/${TEMPO_SIMULATION_ID}?classId=${DEFAULT_CLASS_ID}&teststage=presentation`}
              title="Test Stage 3"
              className="inline-flex items-center rounded-md bg-violet-600 px-2 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-violet-500"
            >
              🧪 3
            </Link>
            <Link
              href={`/student/simulation/${TEMPO_SIMULATION_ID}?classId=${DEFAULT_CLASS_ID}&teststage=objections`}
              title="Test Stage 4"
              className="inline-flex items-center rounded-md bg-indigo-700 px-2 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-600"
            >
              🧪 4
            </Link>
            <div className="inline-flex items-stretch rounded-md overflow-hidden shadow-sm">
              <Link
                href={`/student/simulation/${TEMPO_SIMULATION_ID}?classId=${DEFAULT_CLASS_ID}&teststage=negotiation`}
                title="Test Stage 5"
                className="inline-flex items-center bg-emerald-700 px-2 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-600 border-r border-emerald-900/30"
              >
                🧪 5
              </Link>
              <TestResultsDropdown
                simulationId={TEMPO_SIMULATION_ID}
                classId={DEFAULT_CLASS_ID}
              />
            </div>
          </div>
        </div>

        {enrolledClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
              school
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
              No classes yet
            </h3>
            <p className="text-on-surface-variant font-body-md max-w-xs mb-6">
              Use your professor&apos;s join link or enter a class code to get started.
            </p>
            <JoinClassButton />
          </div>
        ) : (
          <div className="space-y-12">
            {classSections.map((section) => (
              <section key={section.classId}>
                {section.isDefaultClass ? (
                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-outline-variant">
                    <span className="material-symbols-outlined text-tertiary-container text-[20px]">
                      auto_awesome
                    </span>
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      {section.className}
                    </h2>
                    <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[10px] uppercase rounded-full">
                      Available to all students
                    </span>
                    <span className="text-label-sm text-on-surface-variant ml-auto">
                      {section.simulationCount}{" "}
                      {section.simulationCount === 1 ? "simulation" : "simulations"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                      {section.className}
                    </h2>
                    <span className="text-label-sm text-on-surface-variant">
                      {section.simulationCount}{" "}
                      {section.simulationCount === 1 ? "simulation" : "simulations"}
                    </span>
                  </div>
                )}

                {section.cards.length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-outline-variant rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">
                      rocket_launch
                    </span>
                    <p className="font-body-md text-on-surface-variant">
                      No simulations assigned yet
                    </p>
                    <p className="text-label-sm text-on-surface-variant/60 mt-1">
                      Check back when your professor assigns one.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.cards.map((card) => (
                      <SimulationCard key={card.simulation.id} card={card} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
