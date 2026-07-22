"use client";

import { useState } from "react";

type Props = {
  leaseId: string;
  leaseStart: string;
  leaseEnd: string | null;
  monthlyRentCents: number;
  depositAmountCents: number | null;
  paymentDueDay: number;
  noticePeriodDays: number;
  petAllowed: boolean;
  sublettingAllowed: boolean;
  specialConditions: string | null;
  onSaved: (fields: {
    lease_start: string;
    lease_end: string | null;
    monthly_rent: number;
    deposit_amount: number | null;
    payment_due_day: number;
    notice_period_days: number;
    pet_allowed: boolean;
    subletting_allowed: boolean;
    special_conditions: string | null;
  }) => void;
};

const INPUT =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none";

export function EditLeaseTermsForm({
  leaseId,
  leaseStart,
  leaseEnd,
  monthlyRentCents,
  depositAmountCents,
  paymentDueDay,
  noticePeriodDays,
  petAllowed,
  sublettingAllowed,
  specialConditions,
  onSaved,
}: Props) {
  const [start, setStart] = useState(leaseStart);
  const [end, setEnd] = useState(leaseEnd ?? "");
  const [monthToMonth, setMonthToMonth] = useState(!leaseEnd);
  const [rent, setRent] = useState(String(monthlyRentCents / 100));
  const [deposit, setDeposit] = useState(
    depositAmountCents != null ? String(depositAmountCents / 100) : "",
  );
  const [dueDay, setDueDay] = useState(String(paymentDueDay));
  const [notice, setNotice] = useState(noticePeriodDays);
  const [pets, setPets] = useState(petAllowed);
  const [subletting, setSubletting] = useState(sublettingAllowed);
  const [conditions, setConditions] = useState(specialConditions ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const valid = !!start && !!rent && parseFloat(rent) > 0;

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const fields = {
        lease_start: start,
        lease_end: monthToMonth ? null : end || null,
        monthly_rent: Math.round(parseFloat(rent) * 100),
        deposit_amount: deposit ? Math.round(parseFloat(deposit) * 100) : null,
        payment_due_day: parseInt(dueDay) || 1,
        notice_period_days: notice,
        pet_allowed: pets,
        subletting_allowed: subletting,
        special_conditions: conditions.trim() || null,
      };
      const res = await fetch(`/api/leases/${leaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_terms", ...fields }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save changes");
        return;
      }
      onSaved(fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card mb-6 p-6">
      <p className="mb-1 text-base font-semibold text-slate-900">
        Fill in lease terms
      </p>
      <p className="mb-5 text-sm text-slate-500">
        This lease is a draft. Set the terms below, then send it to your tenant for review.
      </p>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Lease start date
            </label>
            <input
              type="date"
              className={INPUT}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Lease end date
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={monthToMonth}
                  onChange={(e) => setMonthToMonth(e.target.checked)}
                  className="rounded"
                />
                Month-to-month
              </label>
            </div>
            <input
              type="date"
              className={INPUT}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={monthToMonth}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Monthly rent (R)
            </label>
            <input
              type="number"
              min="0"
              className={INPUT}
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Deposit amount (R)
            </label>
            <input
              type="number"
              min="0"
              className={INPUT}
              placeholder="Optional"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment due day
            </label>
            <select
              className={INPUT + " bg-white"}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d} of month
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notice period
            </label>
            <div className="flex gap-2">
              {[30, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNotice(n)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    notice === n
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {n} days
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span className="text-sm font-medium text-slate-700">
              Pets allowed
            </span>
            <button
              type="button"
              onClick={() => setPets(!pets)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${pets ? "bg-blue-600" : "bg-slate-200"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${pets ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <span className="text-sm font-medium text-slate-700">
              Subletting allowed
            </span>
            <button
              type="button"
              onClick={() => setSubletting(!subletting)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${subletting ? "bg-blue-600" : "bg-slate-200"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${subletting ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Special conditions
          </label>
          <textarea
            className={INPUT + " resize-none"}
            rows={3}
            placeholder="Any additional terms or conditions (optional)…"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            disabled={!valid || saving}
            onClick={save}
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save terms"}
          </button>
          {saved && (
            <span className="text-sm font-medium text-emerald-700">
              Saved.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
