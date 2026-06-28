"use client";

import { useState } from "react";

type YesNo = true | false | null;

export function CheckinForm({ token }: { token: string }) {
  const [unitWorking, setUnitWorking] = useState<YesNo>(null);
  const [maintenanceNeeded, setMaintenanceNeeded] = useState<YesNo>(null);
  const [maintenanceDetails, setMaintenanceDetails] = useState("");
  const [flagText, setFlagText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = unitWorking !== null && maintenanceNeeded !== null;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/checkin/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_working: unitWorking,
        maintenance_needed: maintenanceNeeded,
        maintenance_details: maintenanceDetails,
        flag_text: flagText,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to submit. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-6 w-6 text-emerald-600"
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
        <h2 className="text-xl font-bold text-slate-900">
          Thanks for checking in!
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your response has been recorded. Your landlord will follow up if
          needed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Q1 */}
      <div className="card p-5">
        <p className="font-semibold text-slate-900">
          1. Is everything in your unit working correctly?
        </p>
        <div className="mt-3 flex gap-3">
          <YesNoButton
            active={unitWorking === true}
            label="Yes, all good ✓"
            onClick={() => setUnitWorking(true)}
            activeClass="bg-emerald-900 text-white"
          />
          <YesNoButton
            active={unitWorking === false}
            label="No, something's wrong"
            onClick={() => setUnitWorking(false)}
            activeClass="bg-red-700 text-white"
          />
        </div>
        {unitWorking === false && (
          <p className="mt-3 text-sm text-slate-500">
            Please answer the next question to log a maintenance request.
          </p>
        )}
      </div>

      {/* Q2 */}
      <div className="card p-5">
        <p className="font-semibold text-slate-900">
          2. Do you have any maintenance requests?
        </p>
        <div className="mt-3 flex gap-3">
          <YesNoButton
            active={maintenanceNeeded === false}
            label="No requests"
            onClick={() => setMaintenanceNeeded(false)}
            activeClass="bg-slate-900 text-white"
          />
          <YesNoButton
            active={maintenanceNeeded === true}
            label="Yes, I have a request"
            onClick={() => setMaintenanceNeeded(true)}
            activeClass="bg-amber-700 text-white"
          />
        </div>

        {maintenanceNeeded && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Please describe the maintenance needed
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="e.g. Bathroom tap is dripping constantly, bedroom light fitting is flickering…"
              value={maintenanceDetails}
              onChange={(e) => setMaintenanceDetails(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Q3 */}
      <div className="card p-5">
        <p className="font-semibold text-slate-900">
          3. Is there anything else you&apos;d like to flag?
          <span className="ml-1 text-sm font-normal text-slate-400">
            (optional)
          </span>
        </p>
        <textarea
          className="input-field mt-3 resize-none"
          rows={2}
          placeholder="Neighbour noise, parking issue, a question about your lease…"
          value={flagText}
          onChange={(e) => setFlagText(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="btn-primary"
      >
        {submitting ? "Submitting…" : "Submit Check-in"}
      </button>
    </div>
  );
}

function YesNoButton({
  active,
  label,
  onClick,
  activeClass,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
        active
          ? `border-transparent ${activeClass}`
          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
