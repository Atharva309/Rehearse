/**
 * simulation/[id]/page.tsx — student
 * Starts or resumes an attempt and renders SimulationRunner.
 */

import { redirect } from "next/navigation";
import { CrmAccess } from "@/components/crm/CrmOverlay";
import { DiscoveryStage } from "@/components/tempo/stages/DiscoveryStage";
import { NegotiationStage } from "@/components/tempo/stages/NegotiationStage";
import { ObjectionHandlingStage } from "@/components/tempo/stages/ObjectionHandlingStage";
import { PresentationStage } from "@/components/tempo/stages/PresentationStage";
import { ProspectingWizard } from "@/components/tempo/stages/ProspectingWizard";
import { SimulationRunner } from "@/components/SimulationRunner";
import { ATTEMPT_STATUS, DEFAULT_CLASS_ID } from "@/lib/constants";
import { parseDiscoverySummaryFromTranscript, parsePresentationFormFromTranscript } from "@/lib/tempo-presentation";
import { parseObjectionSummaryFromTranscript } from "@/lib/tempo-negotiation";
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
  // Dev shortcuts for testing individual Tempo stages.
  const testStageProspecting = searchParams.teststage?.trim() === "prospecting";
  const testStageDiscovery = searchParams.teststage?.trim() === "discovery";
  const testStagePresentation = searchParams.teststage?.trim() === "presentation";
  const testStageObjections = searchParams.teststage?.trim() === "objections";
  const testStageNegotiation =
    searchParams.teststage?.trim() === "negotiation" ||
    searchParams.teststage?.trim() === "close";
  const showTempoProspectingWizard =
    isTempoDefault &&
    (testStageProspecting ||
      (!testStageDiscovery &&
        !testStagePresentation &&
        !testStageObjections &&
        !testStageNegotiation &&
        !hasProspectingScore &&
        (attempt.current_stage === "lead_gen" || attempt.current_stage === "prospecting")));

  const showTempoDiscovery =
    isTempoDefault && (attempt.current_stage === "discovery" || testStageDiscovery);

  const discoveryScore = scores.find((s) => s.stage === "discovery");
  const discoverySummary = parseDiscoverySummaryFromTranscript(discoveryScore?.transcript);

  const showTempoPresentation =
    isTempoDefault && (attempt.current_stage === "presentation" || testStagePresentation);

  const presentationScore = scores.find((s) => s.stage === "presentation");
  const presentationSummary = parsePresentationFormFromTranscript(presentationScore?.transcript);

  const showTempoObjections =
    isTempoDefault && (attempt.current_stage === "objections" || testStageObjections);

  const showTempoNegotiation =
    isTempoDefault && (attempt.current_stage === "close" || testStageNegotiation);

  const objectionScore = scores.find((s) => s.stage === "objections");
  const objectionSummary = parseObjectionSummaryFromTranscript(objectionScore?.transcript);

  let stageView: React.ReactElement;

  if (showTempoProspectingWizard) {
    stageView = (
      <ProspectingWizard
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
      />
    );
  } else if (showTempoDiscovery) {
    stageView = (
      <DiscoveryStage
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
        simliFaceId={simulation.simli_face_id}
      />
    );
  } else if (showTempoPresentation) {
    stageView = (
      <PresentationStage
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
        discoverySummary={discoverySummary}
      />
    );
  } else if (showTempoObjections) {
    stageView = (
      <ObjectionHandlingStage
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
        presentationSummary={presentationSummary}
        simliFaceId={simulation.simli_face_id}
      />
    );
  } else if (showTempoNegotiation) {
    stageView = (
      <NegotiationStage
        attemptId={attempt.id}
        simulationId={simulation.id}
        classId={classId}
        simulationTitle={simulation.title}
        discoverySummary={discoverySummary}
        presentationSummary={presentationSummary}
        objectionSummary={objectionSummary}
      />
    );
  } else {
    stageView = (
      <SimulationRunner
        simulation={simulation}
        attempt={attempt}
        stageScores={scores}
        classId={classId}
        className={classRow?.name}
      />
    );
  }

  if (!isTempoDefault) {
    return stageView;
  }

  return (
    <CrmAccess
      simulationId={simulation.id}
      classId={classId}
      attemptId={attempt.id}
      currentStage={attempt.current_stage}
      displayName={session.displayName}
    >
      {stageView}
    </CrmAccess>
  );
}
