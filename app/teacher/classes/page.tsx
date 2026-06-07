/**
 * classes/page.tsx — teacher
 * My Classes list page with create-class flow and cohort management links.
 */

import { ProfessorClassesView } from "@/components/shared/Sidebar";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Professor classes list page.
 */
export default async function TeacherClassesPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  return <ProfessorClassesView userName={profile.full_name} />;
}
