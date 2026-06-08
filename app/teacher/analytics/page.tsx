/**
 * analytics/page.tsx — teacher
 * Professor analytics overview — classes, students, and simulation metrics.
 */

import type { Metadata } from "next";
import { ProfessorAnalyticsView, type ProfessorAnalyticsData } from "@/components/shared/Sidebar";

export const metadata: Metadata = { title: "Analytics — PitchLab" };
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import { scorePercent } from "@/lib/grades";
import type { Simulation } from "@/types";

/**
 * Professor analytics page.
 */
export default async function TeacherAnalyticsPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("id")
    .eq("professor_id", profile.id);

  const classIds = (classes ?? []).map((c) => c.id);
  let studentCount = 0;

  if (classIds.length > 0) {
    const { count } = await supabase
      .from("student_classes")
      .select("*", { count: "exact", head: true })
      .in("class_id", classIds);
    studentCount = count ?? 0;
  }

  const { data: simulations } = await supabase
    .from("simulations")
    .select("id, is_published")
    .eq("teacher_id", profile.id);

  const simList = (simulations ?? []) as Pick<Simulation, "id" | "is_published">[];
  const simIds = simList.map((s) => s.id);
  const publishedCount = simList.filter((s) => s.is_published).length;

  let totalAttempts = 0;
  let completedAttempts = 0;
  let avgScorePercent: number | null = null;

  if (simIds.length > 0) {
    const { data: attempts } = await supabase
      .from("attempts")
      .select("status, total_score")
      .in("simulation_id", simIds);

    totalAttempts = attempts?.length ?? 0;
    const completed = (attempts ?? []).filter((a) => a.status === "completed");
    completedAttempts = completed.length;

    if (completed.length > 0) {
      avgScorePercent = Math.round(
        completed.reduce((sum, a) => sum + scorePercent(a.total_score), 0) / completed.length
      );
    }
  }

  const data: ProfessorAnalyticsData = {
    classCount: classIds.length,
    studentCount,
    simulationCount: simList.length,
    publishedCount,
    totalAttempts,
    completedAttempts,
    avgScorePercent,
  };

  return <ProfessorAnalyticsView userName={profile.full_name} data={data} />;
}
