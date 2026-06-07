/**
 * support/page.tsx — teacher
 * Professor support and FAQ page.
 */

import { ProfessorSupportView } from "@/components/shared/Sidebar";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Professor support page.
 */
export default async function TeacherSupportPage(): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  return <ProfessorSupportView userName={profile.full_name} />;
}
