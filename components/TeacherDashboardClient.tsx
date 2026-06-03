/**
 * TeacherDashboardClient.tsx
 * Teacher simulation table with publish, edit, delete, and toasts.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import type { Simulation } from "@/types";

type TeacherDashboardClientProps = {
  initialSimulations: Simulation[];
};

/**
 * Interactive teacher dashboard — CRUD actions with confirmation and toasts.
 */
export function TeacherDashboardClient({
  initialSimulations,
}: TeacherDashboardClientProps): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [simulations, setSimulations] = useState(initialSimulations);
  const [deleteTarget, setDeleteTarget] = useState<Simulation | null>(null);
  const [isBusy, setIsBusy] = useState<string | null>(null);

  const handleTogglePublish = async (sim: Simulation): Promise<void> => {
    setIsBusy(sim.id);
    const supabase = createClient();
    const nextPublished = !sim.is_published;
    const { error } = await supabase
      .from("simulations")
      .update({ is_published: nextPublished })
      .eq("id", sim.id);

    setIsBusy(null);
    if (error) {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    setSimulations((prev) =>
      prev.map((s) => (s.id === sim.id ? { ...s, is_published: nextPublished } : s))
    );
    showToast(
      nextPublished ? "Simulation published" : "Simulation unpublished",
      "success"
    );
    router.refresh();
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;

    if (deleteTarget.is_published) {
      showToast("Unpublish this simulation before deleting it", "error");
      setDeleteTarget(null);
      return;
    }

    setIsBusy(deleteTarget.id);
    const supabase = createClient();
    const { error } = await supabase.from("simulations").delete().eq("id", deleteTarget.id);
    setIsBusy(null);
    setDeleteTarget(null);

    if (error) {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    setSimulations((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    showToast("Simulation deleted", "success");
    router.refresh();
  };

  if (simulations.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="You haven't created any simulations yet."
        description="Build a scenario for your students to practice."
        action={
          <Link href="/teacher/simulation/new" className="btn-primary inline-block">
            Create your first simulation
          </Link>
        }
      />
    );
  }

  return (
    <>
      {deleteTarget && (
        <ConfirmModal
          title="Delete simulation?"
          message="Are you sure you want to delete this simulation? This cannot be undone."
          confirmLabel="Delete"
          isDestructive
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="mt-8 card-surface overflow-hidden">
        <table className="w-full text-sm stitch-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Persona</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {simulations.map((sim) => (
              <tr key={sim.id} className="border-t border-border hover:bg-surface/50">
                <td className="font-medium text-text-primary">{sim.title}</td>
                <td className="text-text-secondary">{sim.persona_name}</td>
                <td>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      sim.is_published
                        ? "bg-success/10 text-success"
                        : "bg-surface text-text-secondary border border-border"
                    }`}
                  >
                    {sim.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/teacher/simulation/${sim.id}/edit`}
                      className="text-accent font-semibold hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/teacher/simulation/${sim.id}/results`}
                      className="text-text-secondary font-medium hover:underline"
                    >
                      Results
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy === sim.id}
                      onClick={() => void handleTogglePublish(sim)}
                      className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
                    >
                      {sim.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy === sim.id}
                      onClick={() => setDeleteTarget(sim)}
                      className="text-sm font-medium text-error hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
