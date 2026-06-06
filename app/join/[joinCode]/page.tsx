/**
 * join/[joinCode]/page.tsx
 * Legacy URLs with embedded codes redirect to the generic join page.
 */

import { redirect } from "next/navigation";

type PageProps = { params: { joinCode: string } };

/**
 * Old share links included the class code in the path — redirect without exposing it.
 */
export default function LegacyJoinRedirect(_props: PageProps): never {
  redirect("/join");
}
