/**
 * crm/page.tsx
 * Rehearse CRM opportunities list for the Tempo / Summit Dental simulation.
 */

import { redirect } from "next/navigation";
import { CrmOpportunitiesTable } from "@/components/crm/CrmOpportunitiesTable";
import { ATTEMPT_STATUS, DEFAULT_CLASS_ID } from "@/lib/constants";
import { isTempoDefaultSimulation } from "@/lib/tempo-simulation";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import type { Attempt, Simulation, SimulationStage } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rehearse CRM — Opportunities",
};

type PageProps = {
  params: { id: string };
  searchParams: { attempt?: string; classId?: string };
};

/**
 * Loads the student's Tempo attempt and renders the CRM opportunities screen.
 */
export default async function StudentCrmPage({
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

  const isTempoDefault =
    classId === DEFAULT_CLASS_ID && isTempoDefaultSimulation(simulation.id, simulation.title);

  if (!isTempoDefault) {
    redirect(`/student/simulation/${params.id}?classId=${classId}`);
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
    }
  }

  if (!attempt) {
    redirect(`/student/simulation/${params.id}?classId=${classId}`);
  }

  if (attempt.status === "completed" || attempt.current_stage === "results") {
    redirect(`/student/simulation/${params.id}/complete?attempt=${attempt.id}`);
  }

  return (
    <CrmOpportunitiesTable
      simulationId={simulation.id}
      classId={classId}
      attemptId={attempt.id}
      displayName={session.displayName}
      currentStage={attempt.current_stage as SimulationStage}
    />
  );
}
