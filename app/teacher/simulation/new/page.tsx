/**
 * simulation/new/page.tsx — teacher
 * Create new simulation with Stitch form layout and live preview.
 */

import type { Metadata } from "next";
import { ProfessorSimulationFormView } from "@/components/shared/Sidebar";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Create Simulation — PitchLab" };

/**
 * Create new simulation.
 */
export default async function NewSimulationPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  return (
    <ProfessorSimulationFormView
      userName={profile.full_name}
      teacherId={profile.id}
      pageTitle="Create Simulation"
    />
  );
}
