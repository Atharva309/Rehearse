/**
 * JoinClassButton.tsx
 * Modal for logged-in students to enroll in an additional class.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

/**
 * Opens a modal to join a class by code — POST /api/student/join-class.
 */
export function JoinClassButton(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = (): void => {
    setOpen(false);
    setJoinCode("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await fetch("/api/student/join-class", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
    });

    const body = (await res.json()) as { error?: string; className?: string };
    setIsLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Could not join class.");
      return;
    }

    showToast(`Joined ${body.className ?? "class"}!`, "success");
    handleClose();
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-accent whitespace-nowrap"
      >
        Join a Class
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          role="presentation"
        >
          <div className="bg-page w-full max-w-md rounded-xl border border-border shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-text-primary">Join a Class</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-text-secondary hover:text-text-primary"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <label className="block text-sm font-medium text-text-primary">
                Enter class code
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="input-field mt-1 uppercase tracking-widest"
                  placeholder="6-character code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
              </label>

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-surface"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? "Joining…" : "Join Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
