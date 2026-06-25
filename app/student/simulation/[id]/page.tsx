/**
 * simulation/[id]/page.tsx — student
 * Starts or resumes an attempt and renders SimulationRunner.
 */

import { redirect } from "next/navigation";
import { DiscoveryStage } from "@/components/tempo/stages/DiscoveryStage";
import { ProspectingWizard } from "@/components/tempo/stages/ProspectingWizard";
import { SimulationRunner } from "@/components/SimulationRunner";
import { ATTEMPT_STATUS, DEFAULT_CLASS_ID } from "@/lib/constants";
import { isTempoDefaultSimulation } from "@/lib/tempo-simulation";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt, Simulation, StageScore } from "@/types";

type PageProps = {
  params: { id: string };
  searchParams: { attempt?: string; classId?: string; teststage?: string };
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

  const classId = searchParams.classId?.trim();
  if (!classId) {
    redirect("/student/dashboard");
  }

  const supabase = createServiceClient();

  const { data: enrollment } = await supabase
    .from("student_classes")
    .select("id")
    .eq("student_id", session.studentId)
    .eq("class_id", classId)
    .single();

  if (!enrollment) {
    redirect("/student/dashboard");
  }

  const { data: classRow } = await supabase
    .from("classes")
    .select("name")
    .eq("id", classId)
    .single();

  const { data: assignment } = await supabase
    .from("class_simulations")
    .select(
      `
      simulation_id,
      simulations (*)
    `
    )
    .eq("class_id", classId)
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
      .eq("class_id", classId)
      .single();
    if (data && data.status !== "abandoned") {
      attempt = data as Attempt;
    }
  }

  if (!attempt) {
    const { data: existing } = await supabase
      .from("attempts")
      .select("*")
      .eq("simulation_id", params.id)
      .eq("student_id", session.studentId)
      .eq("class_id", classId)
      .eq("status", ATTEMPT_STATUS.IN_PROGRESS)
      .maybeSingle();

    if (existing) {
      attempt = existing as Attempt;
    } else {
      const { data: created } = await supabase
        .from("attempts")
        .insert({
          student_id: session.studentId,
          class_id: classId,
          student_class_id: enrollment.id,
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

  const scores = (stageScores ?? []) as StageScore[];
  const hasProspectingScore = scores.some((s) => s.stage === "prospecting");
  const isTempoDefault =
    classId === DEFAULT_CLASS_ID && isTempoDefaultSimulation(simulation.id, simulation.title);
  // Dev shortcut: ?teststage=discovery jumps straight into Stage 2 for testing.
  const testStageDiscovery = searchParams.teststage?.trim() === "discovery";
  const showTempoProspectingWizard =
    isTempoDefault &&
    !testStageDiscovery &&
    !hasProspectingScore &&
    (attempt.current_stage === "lead_gen" || attempt.current_stage === "prospecting");

  const showTempoDiscovery =
    isTempoDefault && (attempt.current_stage === "discovery" || testStageDiscovery);

  if (showTempoProspectingWizard) {
    return (
      <ProspectingWizard
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
      />
    );
  }

  if (showTempoDiscovery) {
    return (
      <DiscoveryStage
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
        simliFaceId={simulation.simli_face_id}
      />
    );
  }

  return (
    <SimulationRunner
      simulation={simulation}
      attempt={attempt}
      stageScores={scores}
      classId={classId}
      className={classRow?.name}
    />
  );
}
