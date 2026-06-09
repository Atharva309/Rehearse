/**
 * classes/[classId]/page.tsx — student
 * Simulations assigned to one enrolled class.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { SimulationCard } from "@/components/SimulationCard";
import { StudentClassHeader } from "@/components/StudentClassHeader";
import { loadStudentClassDetail } from "@/lib/student-class-data";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt } from "@/types";

type PageProps = { params: { classId: string } };

/**
 * Class detail — student picks a simulation inside one class.
 */
export default async function StudentClassPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const classDetail = await loadStudentClassDetail(session.studentId, params.classId);
  if (!classDetail) {
    redirect("/student/dashboard");
  }

  const supabase = createServiceClient();
  const { data: attempts } = await supabase
    .from("attempts")
    .select("*")
    .eq("student_id", session.studentId)
    .eq("class_id", params.classId)
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

  const attemptBySim = new Map<string, Attempt>();
  for (const attempt of inProgressList) {
    attemptBySim.set(attempt.simulation_id, attempt);
  }

  return (
    <div>
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:underline mb-6 transition-colors"
      >
        <span aria-hidden>←</span>
        All classes
      </Link>

      <StudentClassHeader
        className={classDetail.className}
        cardImageUrl={classDetail.cardImageUrl}
        cardColorScheme={classDetail.cardColorScheme}
      />

      {classDetail.description && (
        <p className="text-sm text-text-secondary mb-6 -mt-2">{classDetail.description}</p>
      )}

      {classDetail.simulations.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No simulations yet."
          description="Your professor hasn't assigned any published simulations to this class yet. Check back later."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classDetail.simulations.map((sim) => {
            const existing = attemptBySim.get(sim.id);
            const stagesCompleted = existing
              ? stageCountByAttempt.get(existing.id) ?? 0
              : 0;
            const query = new URLSearchParams({ classId: params.classId });
            if (existing) {
              query.set("attempt", existing.id);
            }
            return (
              <SimulationCard
                key={sim.id}
                simulation={sim}
                className={classDetail.className}
                accentColor={classDetail.accentColor}
                actionLabel={existing ? "Continue" : "Start Simulation"}
                href={`/student/simulation/${sim.id}?${query.toString()}`}
                stagesCompleted={stagesCompleted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
