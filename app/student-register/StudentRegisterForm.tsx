/**
 * StudentRegisterForm.tsx
 * Client form for new student registration with class join code.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/lib/constants";

/**
 * Registration form — POST /api/student/register then redirect to dashboard.
 */
export function StudentRegisterForm(): React.ReactElement {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    const res = await fetch("/api/student/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        username,
        password,
        joinCode: joinCode.toUpperCase(),
      }),
    });

    const body = (await res.json()) as { error?: string };
    setIsLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Registration failed.");
      return;
    }

    router.push("/student/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4" autoComplete="off">
      <label className="block text-sm font-medium text-text-primary">
        Display Name
        <input
          type="text"
          required
          className="input-field mt-1"
          placeholder="Name shown on leaderboard"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-text-primary">
        Username
        <input
          type="text"
          required
          minLength={USERNAME_MIN_LENGTH}
          maxLength={USERNAME_MAX_LENGTH}
          pattern="[a-zA-Z0-9_]+"
          className="input-field mt-1"
          placeholder="letters, numbers, underscores"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <span className="mt-1 block text-xs text-text-secondary">
          {USERNAME_MIN_LENGTH}–{USERNAME_MAX_LENGTH} chars, letters/numbers/underscores only
        </span>
      </label>

      <label className="block text-sm font-medium text-text-primary">
        Password
        <input
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          className="input-field mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-text-primary">
        Confirm Password
        <input
          type="password"
          required
          className="input-field mt-1"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-text-primary">
        Class Code
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

      <button type="submit" disabled={isLoading} className="w-full btn-primary">
        {isLoading ? "Creating account…" : "Create Account"}
      </button>

      <p className="text-sm text-text-secondary text-center">
        Already have an account?{" "}
        <Link href="/student-login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
