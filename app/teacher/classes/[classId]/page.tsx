/**
 * classes/[classId]/page.tsx — teacher
 * Manage a single class — students, simulations, join link (Stitch layout).
 */

import type { Metadata } from "next";
import { ProfessorClassManagementView } from "@/components/shared/Sidebar";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { classAppearanceColumnsReady } from "@/lib/check-class-appearance-columns";
import type { ClassColorSchemeId } from "@/lib/class-appearance";
import { scorePercent } from "@/lib/grades";
import type { EnrolledStudent, Simulation } from "@/types";

type SimulationStats = {
  attempted: number;
  completed: number;
  avgPercent: number | null;
};

type PageProps = { params: { classId: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("classes").select("name").eq("id", params.classId).single();
  const name = data?.name ?? "Class";
  return { title: `${name} — PitchLab` };
}

type StudentClassRow = {
  joined_at: string;
  students:
    | { id: string; username: string; display_name: string; joined_at: string }
    | { id: string; username: string; display_name: string; joined_at: string }[]
    | null;
};

/**
 * Class management page for professors.
 */
export default async function ClassManagementPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const appearanceReady = await classAppearanceColumnsReady();
  const supabase = createClient();

  const { data: classRow } = await supabase
    .from("classes")
    .select("*")
    .eq("id", params.classId)
    .eq("professor_id", profile.id)
    .single();

  if (!classRow) {
    redirect("/teacher/dashboard");
  }

  // Service client: nested students join needs row access on students table (RLS after multi-class migration).
  const serviceSupabase = createServiceClient();
  const { data: enrollmentRows } = await serviceSupabase
    .from("student_classes")
    .select(
      `
      joined_at,
      students (
        id,
        username,
        display_name,
        joined_at
      )
    `
    )
    .eq("class_id", params.classId)
    .eq("professor_id", profile.id)
    .order("joined_at", { ascending: false });

  const students: EnrolledStudent[] = ((enrollmentRows ?? []) as StudentClassRow[])
    .map((row) => {
      const studentRaw = row.students;
      const student = Array.isArray(studentRaw) ? studentRaw[0] : studentRaw;
      if (!student) return null;
      return {
        id: student.id,
        username: student.username,
        displayName: student.display_name,
        joinedAt: row.joined_at,
      };
    })
    .filter((row): row is EnrolledStudent => row !== null);

  const { data: assignments } = await supabase
    .from("class_simulations")
    .select(
      `
      id,
      simulation_id,
      added_at,
      simulations (*)
    `
    )
    .eq("class_id", params.classId)
    .order("added_at", { ascending: false });

  const { data: professorSimulations } = await supabase
    .from("simulations")
    .select("*")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const assignedSimIds = ((assignments ?? []) as { simulation_id: string }[]).map(
    (a) => a.simulation_id
  );
  const statsBySim: Record<string, SimulationStats> = {};
  if (assignedSimIds.length > 0) {
    const { data: attempts } = await supabase
      .from("attempts")
      .select("simulation_id, status, total_score")
      .eq("class_id", params.classId)
      .in("simulation_id", assignedSimIds);

    for (const simId of assignedSimIds) {
      const simAttempts = (attempts ?? []).filter((a) => a.simulation_id === simId);
      const completed = simAttempts.filter((a) => a.status === "completed");
      const avgPercent =
        completed.length > 0
          ? Math.round(
              completed.reduce((sum, a) => sum + scorePercent(a.total_score), 0) /
                completed.length
            )
          : null;
      statsBySim[simId] = {
        attempted: simAttempts.length,
        completed: completed.length,
        avgPercent,
      };
    }
  }

  return (
    <ProfessorClassManagementView
      userName={profile.full_name}
      className={classRow.name}
      classDescription={classRow.description}
      classId={classRow.id}
      joinCode={classRow.join_code}
      cardImageUrl={(classRow.card_image_url as string | null) ?? null}
      cardColorScheme={
        ((classRow.card_color_scheme as ClassColorSchemeId | null) ?? "default") as ClassColorSchemeId
      }
      appearanceReady={appearanceReady}
      initialStudents={students}
      initialAssignments={(assignments ?? []) as Parameters<
        typeof ProfessorClassManagementView
      >[0]["initialAssignments"]}
      professorSimulations={(professorSimulations ?? []) as Simulation[]}
      simulationStats={statsBySim}
    />
  );
}
