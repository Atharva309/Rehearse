/**
 * dashboard/page.tsx — student
 * Lists simulations from all enrolled classes and completed attempt history.
 */

import { redirect } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { SimulationCard } from "@/components/SimulationCard";
import { StudentClassHeader } from "@/components/StudentClassHeader";
import { resolveClassColorScheme } from "@/lib/class-appearance";
import {
  StudentAttemptHistory,
  type StudentAttemptRow,
} from "@/components/StudentAttemptHistory";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt, ClassColorSchemeId, Simulation } from "@/types";
import { JoinClassButton } from "./JoinClassButton";

type ClassSection = {
  classId: string;
  className: string;
  cardImageUrl: string | null;
  cardColorScheme: ClassColorSchemeId;
  accentColor: string;
  simulations: Simulation[];
};

/**
 * Student home — browse simulations across all enrolled classes.
 */
export default async function StudentDashboardPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const supabase = createServiceClient();

  const { data: studentClasses } = await supabase
    .from("student_classes")
    .select(
      `
      class_id,
      classes (
        id,
        name,
        join_code,
        card_image_url,
        card_color_scheme
      )
    `
    )
    .eq("student_id", session.studentId);

  const classIds = (studentClasses ?? []).map((row) => row.class_id as string);

  let classSections: ClassSection[] = [];

  if (classIds.length > 0) {
    const { data: classSimRows } = await supabase
      .from("class_simulations")
      .select(
        `
        class_id,
        simulation_id,
        simulations (
          id, title, description,
          persona_name, persona_role,
          product_context, is_published,
          persona_system_prompt, simli_face_id, teacher_id, created_at
        )
      `
      )
      .in("class_id", classIds);

    const simsByClass = new Map<string, Simulation[]>();

    for (const row of classSimRows ?? []) {
      const simRaw = row.simulations;
      const sim = (Array.isArray(simRaw) ? simRaw[0] : simRaw) as Simulation | null;
      if (!sim?.is_published) continue;

      const list = simsByClass.get(row.class_id as string) ?? [];
      if (!list.some((s) => s.id === sim.id)) {
        list.push(sim);
        simsByClass.set(row.class_id as string, list);
      }
    }

    classSections = (studentClasses ?? [])
      .map((row) => {
        const classRaw = row.classes;
        const cls = Array.isArray(classRaw) ? classRaw[0] : classRaw;
        const classId = row.class_id as string;
        const scheme = resolveClassColorScheme(
          (cls?.card_color_scheme as ClassColorSchemeId | null) ?? "default"
        );
        return {
          classId,
          className: (cls?.name as string) ?? "Class",
          cardImageUrl: (cls?.card_image_url as string | null) ?? null,
          cardColorScheme: scheme.id,
          accentColor: scheme.accent,
          simulations: simsByClass.get(classId) ?? [],
        };
      })
      .filter((section) => section.simulations.length > 0);
  }

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*")
    .eq("student_id", session.studentId)
    .eq("status", "in_progress");

  const inProgressList = (attempts ?? []) as Attempt[];
  const attemptIds = inProgressList.map((a) => a.id);

  const stageCountByAttempt = new Map<string, number>();
  if (attemptIds.length > 0) {
    const { data: stageRows } = await supabase
      .from("stage_scores")
      .select("attempt_id")
      .in("attempt_id", attemptIds);

    (stageRows ?? []).forEach((row: { attempt_id: string }) => {
      const id = row.attempt_id;
      stageCountByAttempt.set(id, (stageCountByAttempt.get(id) ?? 0) + 1);
    });
  }

  const attemptKey = (simulationId: string, classId: string): string =>
    `${simulationId}:${classId}`;

  const attemptBySimClass = new Map<string, Attempt>();
  for (const attempt of inProgressList) {
    if (attempt.class_id) {
      attemptBySimClass.set(attemptKey(attempt.simulation_id, attempt.class_id), attempt);
    }
  }

  const { data: completedAttempts } = await supabase
    .from("attempts")
    .select("id, total_score, completed_at, simulations ( id, title, persona_name )")
    .eq("student_id", session.studentId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  const history: StudentAttemptRow[] = (completedAttempts ?? []).map((row) => {
    const sim = row.simulations;
    const simulation = Array.isArray(sim) ? sim[0] ?? null : sim;
    return {
      id: row.id as string,
      total_score: row.total_score as number,
      completed_at: row.completed_at as string | null,
      simulations: simulation as StudentAttemptRow["simulations"],
    };
  });

  const totalSimulations = classSections.reduce((sum, s) => sum + s.simulations.length, 0);
  const classCount = studentClasses?.length ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, {session.displayName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {classCount === 0
              ? "Join a class to see assigned simulations."
              : classCount === 1
                ? `${classSections[0]?.className ?? "Your class"} — choose a scenario to practice your pitch.`
                : `${classCount} classes enrolled — choose a scenario to practice your pitch.`}
          </p>
        </div>
        <JoinClassButton />
      </div>

      {classCount === 0 ? (
        <EmptyState
          icon="🎓"
          title="No classes yet."
          description="Use the Join a Class button above with your professor's class code to get started."
        />
      ) : totalSimulations === 0 ? (
        <EmptyState
          icon="🎯"
          title="No simulations available yet."
          description="Your professors haven't assigned any published simulations to your classes yet."
        />
      ) : (
        <div className="mt-8 space-y-10">
          {classSections.map((section) => (
            <section key={section.classId}>
              <StudentClassHeader
                className={section.className}
                cardImageUrl={section.cardImageUrl}
                cardColorScheme={section.cardColorScheme}
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.simulations.map((sim) => {
                  const existing = attemptBySimClass.get(attemptKey(sim.id, section.classId));
                  const stagesCompleted = existing
                    ? stageCountByAttempt.get(existing.id) ?? 0
                    : 0;
                  const query = new URLSearchParams({ classId: section.classId });
                  if (existing) {
                    query.set("attempt", existing.id);
                  }
                  return (
                    <SimulationCard
                      key={`${section.classId}-${sim.id}`}
                      simulation={sim}
                      className={section.className}
                      accentColor={section.accentColor}
                      actionLabel={existing ? "Continue" : "Start Simulation"}
                      href={`/student/simulation/${sim.id}?${query.toString()}`}
                      stagesCompleted={stagesCompleted}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <StudentAttemptHistory attempts={history} />
    </div>
  );
}
