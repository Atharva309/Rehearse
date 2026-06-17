/**
 * simulation/[id]/edit/page.tsx — teacher
 * Edit existing simulation with Stitch form layout and live preview.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfessorSimulationFormView } from "@/components/shared/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Simulation } from "@/types";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("simulations").select("title").eq("id", params.id).single();
  const title = data?.title ?? "Simulation";
  return { title: `Edit: ${title} — Rehearse` };
}

/**
 * Edit existing simulation.
 */
export default async function EditSimulationPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", params.id)
    .eq("teacher_id", profile.id)
    .single();

  if (!data) redirect("/teacher/dashboard");

  return (
    <ProfessorSimulationFormView
      userName={profile.full_name}
      teacherId={profile.id}
      initial={data as Simulation}
      pageTitle="Edit Simulation"
    />
  );
}
