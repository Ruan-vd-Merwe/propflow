"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const LEASE_LENGTHS = [6, 12, 24];

interface PreferencesFormProps {
  userId: string;
  existing: {
    currentArea: string;
    currentProvince: string;
    lookingArea: string;
    lookingProvince: string;
    budgetMin: number;
    budgetMax: number;
    moveInDate: string;
    leaseLength: number;
  } | null;
}

export function PreferencesForm({ userId, existing }: PreferencesFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [currentArea, setCurrentArea] = useState(existing?.currentArea ?? "");
  const [currentProvince, setCurrentProvince] = useState(
    existing?.currentProvince ?? "",
  );
  const [lookingArea, setLookingArea] = useState(existing?.lookingArea ?? "");
  const [lookingProvince, setLookingProvince] = useState(
    existing?.lookingProvince ?? "",
  );
  const [budgetMin, setBudgetMin] = useState(existing?.budgetMin ?? 3000);
  const [budgetMax, setBudgetMax] = useState(existing?.budgetMax ?? 15000);
  const [moveInDate, setMoveInDate] = useState(existing?.moveInDate ?? "");
  const [leaseLength, setLeaseLength] = useState(existing?.leaseLength ?? 12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("tenant_profiles")
      .update({
        current_area: currentArea || null,
        current_province: currentProvince || null,
        looking_in_area: lookingArea || null,
        looking_in_province: lookingProvince || null,
        budget_min: budgetMin * 100,
        budget_max: budgetMax * 100,
        move_in_date: moveInDate || null,
        lease_length_months: leaseLength,
        preferences_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding/affordability");
  }

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-xl font-bold text-slate-900">
        Let&apos;s find your next home
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        We&apos;ll ask a few questions to recommend properties you&apos;ll
        actually qualify for and save you from repeatedly sharing personal
        information.
      </p>

      <div className="space-y-5">
        {/* Current location */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Where do you currently live?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Area / suburb"
              value={currentArea}
              onChange={(e) => setCurrentArea(e.target.value)}
            />
            <select
              className="input-field"
              value={currentProvince}
              onChange={(e) => setCurrentProvince(e.target.value)}
            >
              <option value="">Province...</option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desired location */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Where are you looking to rent?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Area / suburb"
              value={lookingArea}
              onChange={(e) => setLookingArea(e.target.value)}
            />
            <select
              className="input-field"
              value={lookingProvince}
              onChange={(e) => setLookingProvince(e.target.value)}
            >
              <option value="">Province...</option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            Monthly budget
            <span className="font-normal text-slate-500">
              R{budgetMin.toLocaleString()} – R{budgetMax.toLocaleString()}
            </span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-8 text-xs text-slate-400">Min</span>
              <input
                type="range"
                min={1000}
                max={50000}
                step={500}
                value={budgetMin}
                onChange={(e) =>
                  setBudgetMin(
                    Math.min(parseInt(e.target.value), budgetMax - 500),
                  )
                }
                className="flex-1 accent-blue-700"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 text-xs text-slate-400">Max</span>
              <input
                type="range"
                min={1000}
                max={50000}
                step={500}
                value={budgetMax}
                onChange={(e) =>
                  setBudgetMax(
                    Math.max(parseInt(e.target.value), budgetMin + 500),
                  )
                }
                className="flex-1 accent-blue-700"
              />
            </div>
          </div>
        </div>

        {/* Move-in date */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            When do you need to move in?
          </label>
          <input
            type="date"
            className="input-field"
            value={moveInDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setMoveInDate(e.target.value)}
          />
        </div>

        {/* Lease length */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Ideal lease length
          </label>
          <div className="flex gap-2">
            {LEASE_LENGTHS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLeaseLength(l)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                  leaseLength === l
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {l} months
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleSubmit}
        className="btn-primary mt-6"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
