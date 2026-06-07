/**
 * library/page.tsx — teacher
 * Simulation library — manage all professor scenarios.
 */

import { ProfessorLibraryView } from "@/components/shared/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import { scorePercent } from "@/lib/grades";
import type { Simulation } from "@/types";

type SimulationStats = {
  attempted: number;
  completed: number;
  avgPercent: number | null;
};

/**
 * Professor simulation library page.
 */
export default async function TeacherLibraryPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data: simulations } = await supabase
    .from("simulations")
    .select("*")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const list = (simulations ?? []) as Simulation[];
  const simIds = list.map((s) => s.id);

  const statsBySim: Record<string, SimulationStats> = {};
  if (simIds.length > 0) {
    const { data: attempts } = await supabase
      .from("attempts")
      .select("simulation_id, status, total_score")
      .in("simulation_id", simIds);

    for (const sim of list) {
      const simAttempts = (attempts ?? []).filter((a) => a.simulation_id === sim.id);
      const completed = simAttempts.filter((a) => a.status === "completed");
      const avgPercent =
        completed.length > 0
          ? Math.round(
              completed.reduce((sum, a) => sum + scorePercent(a.total_score), 0) / completed.length
            )
          : null;
      statsBySim[sim.id] = {
        attempted: simAttempts.length,
        completed: completed.length,
        avgPercent,
      };
    }
  }

  return (
    <ProfessorLibraryView
      userName={profile.full_name}
      initialSimulations={list}
      simulationStats={statsBySim}
    />
  );
}
