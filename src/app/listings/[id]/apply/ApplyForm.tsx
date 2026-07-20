"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VerificationStatus } from "@/lib/types";
import { canApplyWithTrustScore, trustScoreLabel } from "@/lib/listings/trustscore";
import { APPLY_CONSENT_COPY } from "@/lib/listings/consent";

export function ApplyForm({
  listingId,
  alreadyApplied,
  verificationStatus,
}: {
  listingId: string;
  alreadyApplied: boolean;
  verificationStatus: VerificationStatus;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (alreadyApplied || submitted) {
    return (
      <div className="rounded-2xl border border-[rgba(30,42,46,0.13)] bg-white p-6 text-center">
        <p className="text-base font-semibold text-[#2A5462]">
          You have applied for this property
        </p>
        <p className="mt-1.5 text-sm text-[#1E2A2E]/60">
          The landlord will review your TrustScore and get back to you through PropTrust.
        </p>
        <Link
          href={`/listings/${listingId}`}
          className="mt-4 inline-block text-sm font-medium text-[#B5613E] hover:underline"
        >
          Back to listing
        </Link>
      </div>
    );
  }

  const canApply = canApplyWithTrustScore(verificationStatus);

  if (!canApply) {
    return (
      <div className="rounded-2xl border border-[rgba(30,42,46,0.13)] bg-white p-6">
        <p className="text-base font-semibold text-[#2A5462]">
          {trustScoreLabel(verificationStatus)}
        </p>
        <p className="mt-1.5 text-sm text-[#1E2A2E]/60">
          Build your TrustScore first so the landlord can review your rental history alongside
          this application.
        </p>
        <Link
          href="/onboarding/verification"
          className="mt-4 block w-full rounded-xl bg-[#B5613E] py-3 text-center text-sm font-bold text-white transition hover:bg-[#9c5033]"
        >
          Build your TrustScore
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/listings/${listingId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() || undefined }),
    });

    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      console.error("[listings/apply] submit failed:", body.error ?? res.statusText);
      if (res.status === 409) {
        setSubmitted(true);
        return;
      }
      setError(body.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[rgba(30,42,46,0.13)] bg-white p-6">
      <p className="text-sm font-semibold text-[#2A5462]">{trustScoreLabel(verificationStatus)}</p>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-[#1E2A2E]">
          Message to the landlord (optional)
        </label>
        <textarea
          className="w-full rounded-xl border border-[rgba(30,42,46,0.2)] bg-white px-3.5 py-2.5 text-sm text-[#1E2A2E] focus:border-[#2A5462] focus:outline-none"
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the landlord a bit about yourself..."
        />
      </div>

      <p className="mt-4 text-xs text-[#1E2A2E]/60">{APPLY_CONSENT_COPY}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className="mt-4 block w-full rounded-xl bg-[#B5613E] py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#9c5033] disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Confirm application"}
      </button>
    </div>
  );
}
