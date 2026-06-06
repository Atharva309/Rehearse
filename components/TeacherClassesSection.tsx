/**
 * TeacherClassesSection.tsx
 * Professor dashboard — list classes, create class modal, copy join links.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/useToast";
import { STUDENT_JOIN_PATH } from "@/lib/constants";
import type { Class } from "@/types";

type ClassWithCounts = Class & {
  student_count: number;
  simulation_count: number;
};

/**
 * Interactive classes section for the teacher dashboard.
 */
export function TeacherClassesSection(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<ClassWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadClasses = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/professor/classes");
    if (!res.ok) {
      setIsLoading(false);
      return;
    }
    const body = (await res.json()) as { classes: ClassWithCounts[] };
    setClasses(body.classes ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const copyToClipboard = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`, "success");
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  };

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsCreating(true);
    const res = await fetch("/api/professor/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setIsCreating(false);

    if (!res.ok) {
      showToast("Could not create class", "error");
      return;
    }

    setShowModal(false);
    setName("");
    setDescription("");
    showToast("Class created", "success");
    await loadClasses();
    router.refresh();
  };

  const joinUrl = (): string => {
    if (typeof window === "undefined") {
      return STUDENT_JOIN_PATH;
    }
    return `${window.location.origin}${STUDENT_JOIN_PATH}`;
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">My Classes</h2>
          <p className="text-sm text-text-secondary mt-1">
            Share the join link with students and give them the class code separately
          </p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="btn-primary shrink-0">
          Create New Class
        </button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-text-secondary">Loading classes…</p>
      ) : classes.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="👥"
            title="No classes yet."
            description="Create a class to get a join code and link for your students."
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {classes.map((classRow) => (
            <div key={classRow.id} className="card-surface p-5">
              <div>
                <h3 className="font-semibold text-text-primary">{classRow.name}</h3>
                {classRow.description && (
                  <p className="text-sm text-text-secondary mt-1">{classRow.description}</p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-widest text-accent">
                  {classRow.join_code}
                </span>
                <button
                  type="button"
                  aria-label="Copy join code"
                  onClick={() => void copyToClipboard(classRow.join_code, "Join code")}
                  className="text-text-secondary hover:text-primary text-sm font-medium"
                >
                  Copy
                </button>
              </div>

              <p className="mt-3 text-xs text-text-secondary">
                {classRow.student_count} student{classRow.student_count === 1 ? "" : "s"} ·{" "}
                {classRow.simulation_count} simulation{classRow.simulation_count === 1 ? "" : "s"}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void copyToClipboard(joinUrl(), "Join link")}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Copy Join Link
                </button>
                <Link
                  href={`/teacher/classes/${classRow.id}`}
                  className="text-sm font-semibold text-accent hover:underline ml-auto"
                >
                  Manage Class →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card-surface w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-text-primary">Create New Class</h3>
            <form onSubmit={(e) => void handleCreate(e)} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-text-primary">
                Class name
                <input
                  type="text"
                  required
                  className="input-field mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-text-primary">
                Description (optional)
                <textarea
                  className="input-field mt-1 min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-sm font-medium text-text-secondary hover:text-primary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? "Creating…" : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
