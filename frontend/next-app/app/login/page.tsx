"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LockKeyhole, UserRound } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f6] px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#202327] text-xl font-bold text-white">
            L
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Lafarge Employee Workspace</h1>
          <p className="mt-1.5 text-sm text-[#737b85]">Sign in to continue</p>
        </div>

        <form onSubmit={onSubmit} className="surface space-y-4 p-6 sm:p-7">
          {error && (
            <div className="rounded-xl border border-[#f1d7d4] bg-[#fff8f7] px-4 py-3 text-sm text-[#9f2f25]">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#4c535c]">Username</span>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c949e]" size={17} />
              <input
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="soft-input !pl-10"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#4c535c]">Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c949e]" size={17} />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="soft-input !pl-10"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <button className="btn-primary mt-2 w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
