"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  INCOME_BANDS,
  deriveAffordability,
} from "@/lib/affordability";
import type { IncomeBand } from "@/lib/types";

const EMPLOYMENT_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

interface AffordabilityFormProps {
  userId: string;
  existing: {
    employmentStatus: string;
    incomeBand: string;
  } | null;
}

export function AffordabilityForm({ userId, existing }: AffordabilityFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [employmentStatus, setEmploymentStatus] = useState(
    existing?.employmentStatus ?? "",
  );
  const [incomeBand, setIncomeBand] = useState<IncomeBand | "">(
    (existing?.incomeBand as IncomeBand) || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const affordability = incomeBand ? deriveAffordability(incomeBand) : null;

  async function handleSubmit() {
    if (!employmentStatus || !incomeBand) return;
    setLoading(true);
    setError(null);

    const aff = deriveAffordability(incomeBand);

    // Write affordability consent
    const { error: consentErr } = await supabase
      .from("tenant_consents")
      .insert({
        tenant_id: userId,
        consent_type: "affordability",
        consent_text_version: "v1-2026-06",
      });

    if (consentErr) {
      console.error("[affordability] consent insert failed:", consentErr);
    }

    const { error: updateErr } = await supabase
      .from("tenant_profiles")
      .update({
        employment_status: employmentStatus,
        income_band: incomeBand,
        affordability_min_cents: aff.min,
        affordability_max_cents: aff.max,
        affordability_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding/verification");
  }

  return (
    <div className="space-y-6">
      {/* Privacy explanation card */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="text-base font-bold text-blue-900">
          Your information stays private
        </h3>
        <p className="mt-1.5 text-sm text-blue-800">
          Many landlords ask for payslips and proof of income. PropTrust keeps
          your information private and uses it to determine your affordability
          profile and recommend suitable homes.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs font-semibold text-green-700">
              Landlords see
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
              <li>Employment status</li>
              <li>Estimated affordability range</li>
              <li>Verification status</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs font-semibold text-red-700">
              Landlords never see
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
              <li>Your exact salary or income</li>
              <li>SA ID number</li>
              <li>Bank statements or documents</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="card p-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">
          Private affordability profile
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          This helps us match you to properties you can afford.
        </p>

        <div className="space-y-5">
          {/* Employment status */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Employment status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEmploymentStatus(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    employmentStatus === opt.value
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Income band */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Monthly income range
            </label>
            <div className="space-y-2">
              {INCOME_BANDS.map((band) => (
                <button
                  key={band.value}
                  type="button"
                  onClick={() => setIncomeBand(band.value)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    incomeBand === band.value
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {band.label}
                </button>
              ))}
            </div>
          </div>

          {/* Affordability preview */}
          {affordability && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated affordability
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Based on your income range, you can comfortably afford rent of{" "}
                <strong className="text-slate-900">
                  {fmtRand(affordability.min)}
                  {affordability.max
                    ? ` – ${fmtRand(affordability.max)}`
                    : "+"}
                </strong>{" "}
                /mo based on the income range you selected.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={loading || !employmentStatus || !incomeBand}
          onClick={handleSubmit}
          className="btn-primary mt-6"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
