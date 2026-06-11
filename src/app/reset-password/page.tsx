"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type State =
  | "checking"   // verifying the link / exchange in progress
  | "ready"      // recovery session confirmed — show password form
  | "expired"    // link invalid, expired, or already used
  | "submitting" // form submit in progress
  | "success"    // password updated
  | "error";     // password update failed

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [state, setState] = useState<State>("checking");
  const [formError, setFormError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Prevent React Strict Mode from double-consuming the one-time PKCE code
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    // Set up listener BEFORE any async call so PASSWORD_RECOVERY is never missed
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("ready");
      }
    });

    const code = searchParams.get("code");

    if (code) {
      // PKCE flow: exchange the single-use code for a recovery session.
      // On success Supabase fires PASSWORD_RECOVERY via onAuthStateChange above.
      // On failure the code was expired or already used.
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setState("expired");
        }
        // success → handled by onAuthStateChange
      });
    } else {
      // No code in URL. Either a hash-based implicit recovery (older Supabase
      // projects) which the client processes automatically, or the user landed
      // here directly. Check for an existing session.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          // Give the onAuthStateChange listener a tick to fire first (hash flow)
          setTimeout(() => {
            setState((prev) => (prev === "checking" ? "expired" : prev));
          }, 500);
        }
        // session exists → onAuthStateChange fired already (or will)
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setState("submitting");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setState("error");
      setFormError(error.message);
    } else {
      // Sign out the recovery session so the user starts fresh
      await supabase.auth.signOut();
      setState("success");
      setTimeout(() => router.push("/login?reset=success"), 2000);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PropTrust</h1>
          <p className="mt-1 text-sm text-slate-500">Set a new password</p>
        </div>

        <div className="card p-6">
          {/* Checking */}
          {state === "checking" && (
            <p className="text-center text-sm text-slate-500">
              Verifying reset link…
            </p>
          )}

          {/* Expired / invalid */}
          {state === "expired" && (
            <div className="text-center">
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                This reset link has expired or already been used. Please
                request a new one.
              </div>
              <Link
                href="/forgot-password"
                className="block text-sm font-semibold text-slate-900 hover:underline"
              >
                Request a new reset link
              </Link>
              <Link
                href="/login"
                className="mt-2 block text-sm text-slate-500 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-semibold text-slate-900">Password updated!</p>
              <p className="mt-2 text-sm text-slate-500">
                Redirecting you to sign in…
              </p>
            </div>
          )}

          {/* Password form (ready, submitting, error) */}
          {(state === "ready" ||
            state === "submitting" ||
            state === "error") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "submitting"}
                className="btn-primary mt-2"
              >
                {state === "submitting" ? "Updating…" : "Set new password"}
              </button>
            </form>
          )}
        </div>

        {state !== "success" && (
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link
              href="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
