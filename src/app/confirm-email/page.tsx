"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ConfirmEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  async function verify(code: string) {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/verify-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailParam, code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Verification failed");
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login?reset=confirmed"), 1500);
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam }),
      });
      if (res.ok) {
        setResendMsg("New code sent. Check your inbox.");
        setDigits(Array(6).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setResendMsg("Failed to resend. Please try again.");
      }
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    }
    setResending(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Email confirmed</h2>
          <p className="text-slate-500">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-500">
            We sent a 6-digit code to{" "}
            <strong className="text-slate-900">{emailParam}</strong>
          </p>
        </div>

        <div className="card p-6">
          <p className="mb-5 text-center text-sm font-medium text-slate-700">
            Enter your confirmation code
          </p>

          <div className="mb-6 flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="h-14 w-12 rounded-lg border-2 border-slate-200 bg-white text-center text-2xl font-bold text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <p className="mb-4 text-center text-sm text-slate-500">Verifying…</p>
          )}

          <div className="text-center">
            <p className="mb-2 text-sm text-slate-500">
              Didn&apos;t receive the code? Check your spam folder.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
            {resendMsg && (
              <p className={`mt-2 text-sm ${resendMsg.startsWith("New code") ? "text-green-600" : "text-red-600"}`}>
                {resendMsg}
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          The code expires in 1 hour.
        </p>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailForm />
    </Suspense>
  );
}
