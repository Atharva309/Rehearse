/**
 * settings/page.tsx — teacher
 * Professor account settings page.
 */

import type { Metadata } from "next";
import { ProfessorSettingsView } from "@/components/shared/Sidebar";

export const metadata: Metadata = { title: "Settings — Rehearse" };
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Professor settings page.
 */
export default async function TeacherSettingsPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email ?? "—";

  return <ProfessorSettingsView userName={profile.full_name} email={email} />;
}
