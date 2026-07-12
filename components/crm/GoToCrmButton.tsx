/**
 * GoToCrmButton.tsx
 * Fixed floating control — opens Rehearse CRM from any Tempo stage (including full-screen calls).
 */

"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type GoToCrmButtonProps = {
  simulationId: string;
  classId: string;
  attemptId: string;
};

/**
 * Persistent “Go to CRM” link visible above Tempo stage UIs.
 */
export function GoToCrmButton({
  simulationId,
  classId,
  attemptId,
}: GoToCrmButtonProps): React.ReactElement {
  const href = `/student/simulation/${simulationId}/crm?classId=${encodeURIComponent(classId)}&attempt=${encodeURIComponent(attemptId)}`;

  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-xl bg-[#0f4c4c] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:brightness-110 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      aria-label="Go to CRM"
    >
      <MaterialIcon name="hub" className="text-[18px]" />
      Go to CRM
    </Link>
  );
}
