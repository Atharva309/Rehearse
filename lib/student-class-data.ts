/**
 * student-class-data.ts
 * Shared helpers for loading enrolled class data on the student side.
 */

import { resolveClassColorScheme } from "@/lib/class-appearance";
import { DEFAULT_CLASS_ID } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";
import type { ClassColorSchemeId, Simulation } from "@/types";

export type StudentEnrolledClass = {
  classId: string;
  className: string;
  description: string | null;
  cardImageUrl: string | null;
  cardColorScheme: ClassColorSchemeId;
  accentColor: string;
  simulationCount: number;
};

export type StudentClassDetail = StudentEnrolledClass & {
  simulations: Simulation[];
};

type ClassRow = {
  id: string;
  name: string;
  description: string | null;
  join_code?: string;
  card_image_url?: string | null;
  card_color_scheme?: ClassColorSchemeId | null;
};

/**
 * Loads all classes a student is enrolled in (with appearance when columns exist).
 */
export async function loadStudentEnrolledClasses(
  studentId: string
): Promise<StudentEnrolledClass[]> {
  const supabase = createServiceClient();

  let studentClasses = (
    await supabase
      .from("student_classes")
      .select("class_id, classes (*)")
      .eq("student_id", studentId)
  ).data;

  if (!studentClasses?.length) {
    const fallback = await supabase
      .from("student_classes")
      .select("class_id, classes ( id, name, description, join_code )")
      .eq("student_id", studentId);
    studentClasses = fallback.data ?? [];
  }

  if (!studentClasses.length) {
    return [];
  }

  const classIds = studentClasses.map((row) => row.class_id as string);
  const simCountByClass = new Map<string, number>();

  const { data: classSimRows } = await supabase
    .from("class_simulations")
    .select("class_id, simulations ( is_published )")
    .in("class_id", classIds);

  for (const row of classSimRows ?? []) {
    const simRaw = row.simulations;
    const sim = Array.isArray(simRaw) ? simRaw[0] : simRaw;
    if (!sim?.is_published) continue;
    const classId = row.class_id as string;
    simCountByClass.set(classId, (simCountByClass.get(classId) ?? 0) + 1);
  }

  return studentClasses.map((row) => {
    const classRaw = row.classes;
    const cls = (Array.isArray(classRaw) ? classRaw[0] : classRaw) as ClassRow | null;
    const classId = row.class_id as string;
    const scheme = resolveClassColorScheme(cls?.card_color_scheme ?? "default");
    return {
      classId,
      className: cls?.name ?? "Class",
      description: cls?.description ?? null,
      cardImageUrl: cls?.card_image_url ?? null,
      cardColorScheme: scheme.id,
      accentColor: scheme.accent,
      simulationCount: simCountByClass.get(classId) ?? 0,
    };
  }).sort((a, b) => {
    if (a.classId === DEFAULT_CLASS_ID) return -1;
    if (b.classId === DEFAULT_CLASS_ID) return 1;
    return 0;
  });
}

/**
 * Loads one enrolled class and its published simulations for a student.
 */
export async function loadStudentClassDetail(
  studentId: string,
  classId: string
): Promise<StudentClassDetail | null> {
  const supabase = createServiceClient();

  let enrollment = (
    await supabase
      .from("student_classes")
      .select("class_id, classes (*)")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .maybeSingle()
  ).data;

  if (!enrollment) {
    const fallback = await supabase
      .from("student_classes")
      .select("class_id, classes ( id, name, description, join_code )")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .maybeSingle();
    enrollment = fallback.data ?? null;
  }

  if (!enrollment) {
    return null;
  }

  const classRaw = enrollment.classes;
  const cls = (Array.isArray(classRaw) ? classRaw[0] : classRaw) as ClassRow | null;
  const scheme = resolveClassColorScheme(cls?.card_color_scheme ?? "default");

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
    .eq("class_id", classId);

  const simulations: Simulation[] = [];
  for (const row of classSimRows ?? []) {
    const simRaw = row.simulations;
    const sim = (Array.isArray(simRaw) ? simRaw[0] : simRaw) as Simulation | null;
    if (!sim?.is_published) continue;
    if (!simulations.some((s) => s.id === sim.id)) {
      simulations.push(sim);
    }
  }

  return {
    classId,
    className: cls?.name ?? "Class",
    description: cls?.description ?? null,
    cardImageUrl: cls?.card_image_url ?? null,
    cardColorScheme: scheme.id,
    accentColor: scheme.accent,
    simulationCount: simulations.length,
    simulations,
  };
}
