"use client";

import { useState } from "react";
import Link from "next/link";
import { ObligationStatusBadge } from "@/components/ObligationStatusBadge";
import type { RentObligation, PaymentAttempt } from "@/lib/types";

type ObligationWithAttempt = RentObligation & {
  latest_attempt: PaymentAttempt | null;
};

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * "Next rent payment" card for the authenticated tenant home page. Mirrors
 * the Pay Rent / Retry / dev-simulate flow already shipped in the tenant
 * portal (src/app/tenant/[token]/TenantPortal.tsx) so both surfaces drive
 * the same backend — this just gives it a home outside the tokenized share
 * link, on the tenant's actual dashboard.
 */
export function RentPaymentCard({
  token,
  initialObligation,
  devMode,
}: {
  token: string;
  initialObligation: ObligationWithAttempt | null;
  devMode: boolean;
}) {
  const [obligation, setObligation] = useState(initialObligation);
  const [paying, setPaying] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!obligation) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          No rent payment is due yet.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Once your landlord sets up rent tracking, your next payment will
          appear here.
        </p>
      </div>
    );
  }

  const attempt = obligation.latest_attempt;
  const attemptInFlight =
    !!attempt && (attempt.status === "pending" || attempt.status === "processing");
  const outstanding = obligation.amount_due_cents - obligation.amount_paid_cents;
  const isRetry = attempt?.status === "failed" || attempt?.status === "cancelled";
  const payable = obligation.status !== "paid" && obligation.status !== "waived";

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/rent/obligations/${obligation!.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to start payment");
        return;
      }
      setObligation((prev) =>
        prev
          ? { ...prev, status: "processing", latest_attempt: json.payment_attempt }
          : prev,
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  async function handleSimulate(outcome: "succeeded" | "failed" | "cancelled") {
    if (!attempt) return;
    setSimulating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rent/payment-attempts/${attempt.id}/simulate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outcome, token }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Simulation failed");
        return;
      }
      setObligation((prev) =>
        prev
          ? { ...prev, ...json.obligation, latest_attempt: json.payment_attempt }
          : prev,
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Next rent payment
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {fmtRand(obligation.amount_due_cents)}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            due {fmtDate(obligation.due_date)}
          </p>
        </div>
        <ObligationStatusBadge status={obligation.status} />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {obligation.status === "paid" && (
        <button
          disabled
          className="mt-4 w-full cursor-not-allowed rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-400"
        >
          📄 Receipt (coming soon)
        </button>
      )}

      {obligation.status === "waived" && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Waived by your landlord — nothing due.
        </p>
      )}

      {payable && !attemptInFlight && (
        <button
          disabled={paying}
          onClick={handlePay}
          className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 active:scale-95"
        >
          {paying
            ? "Starting…"
            : isRetry
              ? `↻ Retry — pay ${fmtRand(outstanding)}`
              : `Pay rent — ${fmtRand(outstanding)}`}
        </button>
      )}

      {attemptInFlight && (
        <div className="mt-4 rounded-xl bg-indigo-50 px-3 py-2.5 text-center text-sm font-medium text-indigo-700">
          ⏳{" "}
          {attempt!.status === "processing"
            ? "Processing payment…"
            : "Waiting for payment to complete…"}
        </div>
      )}

      {devMode && attemptInFlight && attempt && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dev checkout — simulate provider response
          </p>
          <div className="flex gap-2">
            <button
              disabled={simulating}
              onClick={() => handleSimulate("succeeded")}
              className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Succeed
            </button>
            <button
              disabled={simulating}
              onClick={() => handleSimulate("failed")}
              className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Fail
            </button>
            <button
              disabled={simulating}
              onClick={() => handleSimulate("cancelled")}
              className="flex-1 rounded-lg border border-slate-300 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Link
        href={`/tenant/${token}?tab=payments`}
        className="mt-4 block text-center text-xs font-medium text-blue-600 hover:underline"
      >
        View full payment history →
      </Link>
    </div>
  );
}
