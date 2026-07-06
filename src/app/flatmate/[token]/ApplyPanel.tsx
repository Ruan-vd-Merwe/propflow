"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setFlatmateReturnToken } from "@/lib/flatmate/return-continuation";

type ListingDisplay = {
  status: string;
  note: string | null;
  rentPortionCents: number;
  moveInDate: string;
  suburb: string | null;
  province: string | null;
};

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ApplyPanel({
  token,
  listing,
  visitorVerificationStatus,
}: {
  token: string;
  listing: ListingDisplay;
  visitorVerificationStatus: string | null;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToTrustScore() {
    setFlatmateReturnToken(token);
    router.push("/onboarding/verification");
  }

  function goToAuth(destination: "/register" | "/login") {
    setFlatmateReturnToken(token);
    router.push(destination);
  }

  async function handleApply() {
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/flatmate/${token}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.needs_verification) {
          goToTrustScore();
          return;
        }
        if (json.needs_auth) {
          goToAuth("/register");
          return;
        }
        setError(json.error ?? "Failed to submit application");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const areaLabel = [listing.suburb, listing.province].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Room available
        </p>
        {areaLabel && (
          <p className="mt-1 text-sm text-slate-500">{areaLabel}</p>
        )}
        <p className="mt-3 text-2xl font-bold text-slate-900">
          {fmtRand(listing.rentPortionCents)}
          <span className="text-sm font-normal text-slate-400">/mo</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Move in from {fmtDate(listing.moveInDate)}
        </p>
        {listing.note && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            {listing.note}
          </p>
        )}
      </div>

      {listing.status !== "active" ? (
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            This listing is no longer accepting applicants.
          </p>
        </div>
      ) : submitted ? (
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">
            Application sent
          </p>
          <p className="mt-1 text-sm text-slate-500">
            The current tenant will review your application and get back to you.
          </p>
        </div>
      ) : visitorVerificationStatus === null ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Sign in to apply
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Applying requires a PropTrust TrustScore, which needs an account.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => goToAuth("/register")}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Create an account
            </button>
            <button
              onClick={() => goToAuth("/login")}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Log in
            </button>
          </div>
        </div>
      ) : visitorVerificationStatus === "unverified" ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Build your TrustScore to apply
          </p>
          <p className="mt-1 text-sm text-slate-500">
            The current tenant reviews applicants by TrustScore, not by a
            landlord approval step. Verifying takes a few minutes.
          </p>
          <button
            onClick={goToTrustScore}
            className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Build your TrustScore
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            Apply for this room
          </p>
          <div className="space-y-3">
            <input
              className="input-field w-full"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="input-field w-full"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input-field w-full"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            disabled={submitting}
            onClick={handleApply}
            className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}
