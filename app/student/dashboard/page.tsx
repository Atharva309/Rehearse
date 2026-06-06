/**
 * dashboard/page.tsx — student
 * Lists class-assigned simulations and completed attempt history.
 */

import { redirect } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { SimulationCard } from "@/components/SimulationCard";
import {
  StudentAttemptHistory,
  type StudentAttemptRow,
} from "@/components/StudentAttemptHistory";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt, Simulation } from "@/types";

/**
 * Student home — browse class simulations and review past scores.
 */
export default async function StudentDashboardPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const supabase = createServiceClient();

  const { data: classRow } = await supabase
    .from("classes")
    .select("name")
    .eq("id", session.classId)
    .single();

  const { data: classSimRows } = await supabase
    .from("class_simulations")
    .select(
      `
      simulation_id,
      simulations (
        id, title, description,
        persona_name, persona_role,
        product_context, is_published,
        persona_system_prompt, simli_face_id, teacher_id, created_at
      )
    `
    )
    .eq("class_id", session.classId);

  const simulations = (classSimRows ?? [])
    .map((row) => {
      const sim = row.simulations;
      return Array.isArray(sim) ? sim[0] : sim;
    })
    .filter((sim): sim is Simulation => Boolean(sim?.is_published));

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

  const { data: completedAttempts } = await supabase
    .from("attempts")
    .select("id, total_score, completed_at, simulations ( id, title, persona_name )")
    .eq("student_id", session.studentId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  const attemptBySim = new Map(inProgressList.map((a) => [a.simulation_id, a]));
  const list = simulations as Simulation[];

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, {session.displayName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {classRow?.name ?? "Your class"} — choose a scenario to practice your pitch.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search simulations…"
          disabled
          aria-label="Search simulations"
          className="input-field max-w-xs opacity-60 cursor-not-allowed"
          title="Search coming soon"
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No simulations available yet."
          description="Your professor hasn't assigned any published simulations to your class yet."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {list.map((sim) => {
            const existing = attemptBySim.get(sim.id);
            const stagesCompleted = existing
              ? stageCountByAttempt.get(existing.id) ?? 0
              : 0;
            return (
              <SimulationCard
                key={sim.id}
                simulation={sim}
                actionLabel={existing ? "Continue" : "Start Simulation"}
                href={`/student/simulation/${sim.id}${existing ? `?attempt=${existing.id}` : ""}`}
                stagesCompleted={stagesCompleted}
              />
            );
          })}
        </div>
      )}

      <StudentAttemptHistory attempts={history} />
    </div>
  );
}
