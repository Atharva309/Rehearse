/**
 * classes/[classId]/page.tsx — teacher
 * Manage a single class — students, simulations, join link.
 */

import { BackButton } from "@/components/BackButton";
import { ClassManagementClient } from "@/components/ClassManagementClient";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import type { Simulation } from "@/types";

type PageProps = { params: { classId: string } };

/**
 * Class management page for professors.
 */
export default async function ClassManagementPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
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

  const { data: students } = await supabase
    .from("students")
    .select("id, username, display_name, joined_at")
    .eq("class_id", params.classId)
    .order("joined_at", { ascending: false });

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

  return (
    <div>
      <BackButton label="Back to Dashboard" href="/teacher/dashboard" />
      <h1 className="text-2xl font-bold text-text-primary mt-2">{classRow.name}</h1>
      {classRow.description && (
        <p className="text-sm text-text-secondary mt-1">{classRow.description}</p>
      )}

      <ClassManagementClient
        classId={classRow.id}
        joinCode={classRow.join_code}
        initialStudents={students ?? []}
        initialAssignments={(assignments ?? []) as Parameters<
          typeof ClassManagementClient
        >[0]["initialAssignments"]}
        professorSimulations={(professorSimulations ?? []) as Simulation[]}
      />
    </div>
  );
}
