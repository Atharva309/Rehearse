/**
 * ClassManagementClient.tsx
 * Class detail page — manage students list and simulation assignments.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import type { Simulation, Student } from "@/types";

type AssignedSimulation = {
  id: string;
  simulation_id: string;
  added_at: string;
  simulations: Simulation | Simulation[] | null;
};

type ClassManagementClientProps = {
  classId: string;
  joinCode: string;
  initialStudents: Pick<Student, "id" | "username" | "display_name" | "joined_at">[];
  initialAssignments: AssignedSimulation[];
  professorSimulations: Simulation[];
};

/**
 * Client UI for assigning simulations and viewing enrolled students.
 */
export function ClassManagementClient({
  classId,
  joinCode,
  initialStudents,
  initialAssignments,
  professorSimulations,
}: ClassManagementClientProps): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedSimId, setSelectedSimId] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const assignedIds = new Set(assignments.map((a) => a.simulation_id));
  const availableSims = professorSimulations.filter((s) => !assignedIds.has(s.id));

  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/join/${joinCode}` : `/join/${joinCode}`;

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      showToast("Join link copied", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const resolveSim = (row: AssignedSimulation): Simulation | null => {
    const sim = row.simulations;
    return Array.isArray(sim) ? sim[0] ?? null : sim;
  };

  const handleAdd = async (): Promise<void> => {
    if (!selectedSimId) return;
    setIsBusy(true);
    const res = await fetch(`/api/professor/classes/${classId}/simulations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulationId: selectedSimId }),
    });
    setIsBusy(false);

    if (!res.ok) {
      showToast("Could not assign simulation", "error");
      return;
    }

    showToast("Simulation assigned", "success");
    setSelectedSimId("");
    router.refresh();
  };

  const handleRemove = async (simulationId: string): Promise<void> => {
    setIsBusy(true);
    const res = await fetch(`/api/professor/classes/${classId}/simulations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulationId }),
    });
    setIsBusy(false);

    if (!res.ok) {
      showToast("Could not remove simulation", "error");
      return;
    }

    setAssignments((prev) => prev.filter((a) => a.simulation_id !== simulationId));
    showToast("Simulation removed", "success");
    router.refresh();
  };

  return (
    <div>
      <div className="card-surface p-5 mt-6">
        <p className="text-sm font-medium text-text-primary">Join link</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="text-sm text-text-secondary break-all">{joinUrl}</code>
          <button type="button" onClick={() => void copyLink()} className="btn-accent text-sm">
            Copy
          </button>
        </div>
        {/* TODO: QR code for join link */}
        <p className="mt-4 text-sm text-text-secondary">
          Join code:{" "}
          <span className="font-mono text-2xl font-bold tracking-widest text-accent">{joinCode}</span>
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">Students</h2>
            <p className="text-xs text-text-secondary mt-1">{initialStudents.length} enrolled</p>
          </div>
          {initialStudents.length === 0 ? (
            <p className="p-5 text-sm text-text-secondary">No students enrolled yet.</p>
          ) : (
            <table className="w-full text-sm stitch-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Display Name</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {initialStudents.map((student) => (
                  <tr key={student.id} className="border-t border-border">
                    <td className="font-mono text-text-primary">{student.username}</td>
                    <td>{student.display_name}</td>
                    <td className="text-text-secondary">
                      {new Date(student.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">Simulations</h2>
          </div>
          <div className="p-5 border-b border-border flex flex-wrap gap-2">
            <select
              className="input-field flex-1 min-w-[180px]"
              value={selectedSimId}
              onChange={(e) => setSelectedSimId(e.target.value)}
              disabled={isBusy || availableSims.length === 0}
            >
              <option value="">Add simulation…</option>
              {availableSims.map((sim) => (
                <option key={sim.id} value={sim.id}>
                  {sim.title} {sim.is_published ? "" : "(draft)"}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedSimId || isBusy}
              onClick={() => void handleAdd()}
              className="btn-primary shrink-0"
            >
              Add
            </button>
          </div>
          {assignments.length === 0 ? (
            <p className="p-5 text-sm text-text-secondary">No simulations assigned yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {assignments.map((row) => {
                const sim = resolveSim(row);
                if (!sim) return null;
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="font-medium text-text-primary">{sim.title}</p>
                      <p className="text-xs text-text-secondary">{sim.persona_name}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleRemove(row.simulation_id)}
                      className="text-sm font-medium text-error hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
