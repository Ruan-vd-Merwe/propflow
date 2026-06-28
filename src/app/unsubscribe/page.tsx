"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "pending" | "unsubscribed" | "error" | "resubscribed"
  >("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => (r.ok ? setStatus("unsubscribed") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, [token]);

  async function resubscribe() {
    if (!token) return;
    // Re-enable subscription by matching token
    const res = await fetch("/api/newsletter/resubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) setStatus("resubscribed");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketingNav />

      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        {status === "pending" && (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        )}

        {status === "unsubscribed" && (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-8 w-8 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              You have been unsubscribed
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              You will no longer receive PropTrust property market updates.
            </p>
            <button
              onClick={resubscribe}
              className="mt-6 text-sm font-medium text-blue-600 hover:underline"
            >
              Resubscribe
            </button>
            <Link
              href="/"
              className="mt-3 block text-sm text-slate-400 hover:text-slate-700"
            >
              Back to PropTrust
            </Link>
          </>
        )}

        {status === "resubscribed" && (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">You are back</h1>
            <p className="mt-3 text-sm text-slate-500">
              You have been resubscribed to PropTrust property market updates.
            </p>
            <Link
              href="/"
              className="mt-6 block text-sm text-blue-600 hover:underline"
            >
              Back to PropTrust
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Link not found</h1>
            <p className="mt-3 text-sm text-slate-500">
              This unsubscribe link is invalid or has already been used.
            </p>
            <Link
              href="/"
              className="mt-6 block text-sm text-blue-600 hover:underline"
            >
              Back to PropTrust
            </Link>
          </>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <UnsubscribeContent />
    </Suspense>
  );
}
