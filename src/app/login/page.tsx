"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPostAuthPath, resolveRoleFlags } from "@/lib/auth/roles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnconfirmedEmail(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(email);
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    const m = data.user?.user_metadata ?? {};
    const { isLandlord, isTenant } = resolveRoleFlags(m);
    router.push(getPostAuthPath(isLandlord, isTenant));
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    setSendingCode(true);
    setResendMsg(null);
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Flogin%3Fconfirmed%3Dtrue`,
      },
    });
    setSendingCode(false);
    if (resendErr) {
      console.error("[login] resend confirmation failed:", resendErr.message);
      setResendMsg("Failed to resend. Please try again.");
    } else {
      setResendMsg("Confirmation link sent — check your inbox.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">PropTrust</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        {/* Password reset success banner */}
        {searchParams.get("reset") === "success" && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold">Password updated.</p>
            <p className="mt-0.5">Sign in with your new password.</p>
          </div>
        )}

        {/* Email confirmed banner */}
        {searchParams.get("reset") === "confirmed" && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold">Email confirmed.</p>
            <p className="mt-0.5">Sign in to get started.</p>
          </div>
        )}

        {/* Email confirmation success banner */}
        {searchParams.get("confirmed") === "true" && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold">Email confirmed.</p>
            <p className="mt-0.5">Please log in to get started.</p>
          </div>
        )}

        {/* Email confirmation failure banners */}
        {(errorParam === "confirmation_failed" ||
          errorParam === "missing_confirmation_code") && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">
              We could not confirm your email.
            </p>
            <p className="mt-0.5">
              Please try again or{" "}
              <Link href="/register" className="font-medium underline">
                request a new confirmation email
              </Link>
              .
            </p>
          </div>
        )}

        {/* Auth callback error banners */}
        {errorParam === "missing_auth_code" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Invalid confirmation link.</p>
            <p className="mt-0.5">
              The link is missing required information. Please{" "}
              <Link href="/register" className="font-medium underline">
                sign up again
              </Link>{" "}
              to receive a new confirmation email.
            </p>
          </div>
        )}
        {errorParam === "auth_callback_failed" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">That link has expired or already been used.</p>
            <p className="mt-0.5">
              Confirmation links are single-use and expire after 24 hours. Sign
              in below if your account is active, or{" "}
              <Link href="/register" className="font-medium underline">
                sign up again
              </Link>{" "}
              to get a new link.
            </p>
          </div>
        )}

        {/* From register banner */}
        {searchParams.get("from") === "register" && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold">Welcome back.</p>
            <p className="mt-0.5">Sign in to your existing account.</p>
          </div>
        )}

        {/* Expired link banner */}
        {errorParam === "expired" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Your confirmation link has expired.</p>
            <p className="mt-0.5">
              <Link href="/register" className="font-medium underline">
                Sign up again
              </Link>{" "}
              to get a new one.
            </p>
          </div>
        )}

        {/* Unconfirmed email banner */}
        {errorParam === "unconfirmed" && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Please confirm your email first. Check your inbox or spam folder.
          </div>
        )}

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {unconfirmedEmail && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                <p>
                  Please confirm your email first. Check your inbox for a confirmation link.
                </p>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={sendingCode}
                  className="mt-2 font-semibold underline disabled:opacity-50"
                >
                  {sendingCode ? "Sending…" : "Resend confirmation email"}
                </button>
                {resendMsg && (
                  <p className={`mt-1 text-xs ${resendMsg.startsWith("Confirmation") ? "text-green-700" : "text-red-700"}`}>
                    {resendMsg}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm">
          <span className="text-slate-600">Don&apos;t have an account?</span>{" "}
          <Link
            href="/register"
            className="font-bold text-blue-700 hover:underline"
          >
            Sign up free
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          PropTrust · South Africa&apos;s trusted property platform
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
