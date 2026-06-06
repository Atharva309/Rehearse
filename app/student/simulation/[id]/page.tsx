/**
 * simulation/[id]/page.tsx — student
 * Starts or resumes an attempt and renders SimulationRunner.
 */

import { redirect } from "next/navigation";
import { SimulationRunner } from "@/components/SimulationRunner";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt, Simulation, StageScore } from "@/types";

type PageProps = {
  params: { id: string };
  searchParams: { attempt?: string };
};

/**
 * Student simulation session page — uses class-assigned simulations only.
 */
export default async function StudentSimulationPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const supabase = createServiceClient();

  const { data: assignment } = await supabase
    .from("class_simulations")
    .select(
      `
      simulation_id,
      simulations (*)
    `
    )
    .eq("class_id", session.classId)
    .eq("simulation_id", params.id)
    .single();

  const simRaw = assignment?.simulations;
  const simulation = (Array.isArray(simRaw) ? simRaw[0] : simRaw) as Simulation | null;

  if (!simulation || !simulation.is_published) {
    redirect("/student/dashboard");
  }

  let attempt: Attempt | null = null;

  if (searchParams.attempt) {
    const { data } = await supabase
      .from("attempts")
      .select("*")
      .eq("id", searchParams.attempt)
      .eq("student_id", session.studentId)
      .single();
    attempt = data as Attempt | null;
  }

  if (!attempt) {
    const { data: existing } = await supabase
      .from("attempts")
      .select("*")
      .eq("simulation_id", params.id)
      .eq("student_id", session.studentId)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing) {
      attempt = existing as Attempt;
    } else {
      const { data: created } = await supabase
        .from("attempts")
        .insert({
          student_id: session.studentId,
          class_id: session.classId,
          simulation_id: params.id,
          current_stage: "lead_gen",
        })
        .select()
        .single();
      attempt = created as Attempt;
    }
  }

  if (!attempt) {
    redirect("/student/dashboard");
  }

  if (attempt.status === "completed" || attempt.current_stage === "results") {
    redirect(`/student/simulation/${params.id}/complete?attempt=${attempt.id}`);
  }

  const { data: stageScores } = await supabase
    .from("stage_scores")
    .select("*")
    .eq("attempt_id", attempt.id);

  return (
    <SimulationRunner
      simulation={simulation}
      attempt={attempt}
      stageScores={(stageScores ?? []) as StageScore[]}
    />
  );
}
