/**
 * analytics/page.tsx — teacher
 * Professor analytics overview — classes, students, and simulation metrics.
 */

import type { Metadata } from "next";
import {
  ProfessorAnalyticsView,
  type ProfessorAnalyticsPayload,
} from "@/components/professor/ProfessorAnalyticsView";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Analytics — Rehearse" };

/**
 * Professor analytics page.
 */
export default async function TeacherAnalyticsPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("professor_id", profile.id)
    .order("name");

  const classIds = (classes ?? []).map((c) => c.id);

  const { data: simulations } = await supabase
    .from("simulations")
    .select("id, title, is_published")
    .eq("teacher_id", profile.id)
    .order("title");

  const simIds = (simulations ?? []).map((s) => s.id);

  let enrollmentRows: ProfessorAnalyticsPayload["enrollmentRows"] = [];
  let classSimulationRows: ProfessorAnalyticsPayload["classSimulationRows"] = [];

  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("student_classes")
      .select("class_id, student_id")
      .in("class_id", classIds);

    enrollmentRows = (enrollments ?? []) as ProfessorAnalyticsPayload["enrollmentRows"];

    const { data: classSims } = await supabase
      .from("class_simulations")
      .select("class_id, simulation_id")
      .in("class_id", classIds);

    classSimulationRows = (classSims ?? []) as ProfessorAnalyticsPayload["classSimulationRows"];
  }

  let attempts: ProfessorAnalyticsPayload["attempts"] = [];

  if (simIds.length > 0) {
    const { data: attemptRows } = await supabase
      .from("attempts")
      .select("simulation_id, student_id, status, total_score, started_at")
      .in("simulation_id", simIds);

    attempts = (attemptRows ?? []) as ProfessorAnalyticsPayload["attempts"];
  }

  const payload: ProfessorAnalyticsPayload = {
    classes: (classes ?? []).map((c) => ({ id: c.id as string, name: c.name as string })),
    simulations: (simulations ?? []).map((s) => ({
      id: s.id as string,
      title: s.title as string,
      is_published: Boolean(s.is_published),
    })),
    attempts,
    enrollmentRows,
    classSimulationRows,
  };

  return <ProfessorAnalyticsView userName={profile.full_name} payload={payload} />;
}
