/**
 * dashboard/page.tsx — teacher
 * Lists teacher simulations with publish, edit, delete actions.
 */

import Link from "next/link";
import { TeacherClassesSection } from "@/components/TeacherClassesSection";
import { TeacherDashboardClient } from "@/components/TeacherDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";
import type { Simulation } from "@/types";

/**
 * Teacher dashboard — manage simulations.
 */
export default async function TeacherDashboardPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();

  const { data: simulations } = await supabase
    .from("simulations")
    .select("*")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const list = (simulations ?? []) as Simulation[];

  return (
    <div>
      <TeacherClassesSection />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My simulations</h1>
          <p className="text-sm text-text-secondary mt-1">Create and manage training scenarios</p>
        </div>
        <Link href="/teacher/simulation/new" className="btn-primary shrink-0">
          Create New Simulation
        </Link>
      </div>

      <TeacherDashboardClient initialSimulations={list} />
    </div>
  );
}
