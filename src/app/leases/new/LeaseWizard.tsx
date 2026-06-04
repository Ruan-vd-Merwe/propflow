"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Property = { id: string; name: string; address: string };
type Tenant = {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  monthly_rent: number;
};
type Profile = { full_name: string; email: string; phone: string | null };

type Props = {
  properties: Property[];
  tenants: Tenant[];
  landlord: Profile;
};

const STEP_LABELS = ["Property & Tenant", "Lease Terms", "Review & Generate"];

function StepBar({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <div
            key={n}
            className={`flex flex-1 items-center ${i < STEP_LABELS.length - 1 ? "gap-0" : ""}`}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? "bg-emerald-600 text-white"
                    : current
                      ? "bg-blue-700 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : n}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${current ? "text-slate-900" : "text-slate-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${done ? "bg-emerald-400" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none";
const SELECT = INPUT + " bg-white";

export function LeaseWizard({ properties, tenants, landlord }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Step 1
  const [propertyId, setPropertyId] = useState("");
  const [tenantId, setTenantId] = useState("");

  // Step 2
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [monthToMonth, setMonthToMonth] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("1");
  const [noticePeriod, setNoticePeriod] = useState(30);
  const [petAllowed, setPetAllowed] = useState(false);
  const [sublettingAllowed, setSublettingAllowed] = useState(false);
  const [specialConditions, setSpecialConditions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const propertyTenants = useMemo(
    () => tenants.filter((t) => t.property_id === propertyId),
    [tenants, propertyId],
  );

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedTenant = tenants.find((t) => t.id === tenantId);

  function onPropertyChange(pid: string) {
    setPropertyId(pid);
    setTenantId("");
    setMonthlyRent("");
    setDepositAmount("");
  }

  function onTenantChange(tid: string) {
    setTenantId(tid);
    const t = tenants.find((t) => t.id === tid);
    if (t) {
      const rand = Math.round(t.monthly_rent / 100);
      setMonthlyRent(String(rand));
      setDepositAmount(String(rand * 2));
    }
  }

  function onMonthlyRentChange(val: string) {
    setMonthlyRent(val);
    const n = parseFloat(val);
    if (!isNaN(n)) setDepositAmount(String(Math.round(n * 2)));
  }

  async function generate() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          tenant_id: tenantId,
          lease_start: leaseStart,
          lease_end: monthToMonth ? null : leaseEnd || null,
          monthly_rent: Math.round(parseFloat(monthlyRent) * 100),
          deposit_amount: depositAmount
            ? Math.round(parseFloat(depositAmount) * 100)
            : null,
          payment_due_day: parseInt(paymentDueDay) || 1,
          notice_period_days: noticePeriod,
          pet_allowed: petAllowed,
          subletting_allowed: sublettingAllowed,
          special_conditions: specialConditions.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create lease");
        return;
      }
      router.push(`/leases/${json.lease.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  function fmtRand(r: string) {
    const n = parseFloat(r);
    return isNaN(n) ? "—" : `R ${n.toLocaleString("en-ZA")}`;
  }

  const step1Valid = !!propertyId && !!tenantId;
  const step2Valid =
    !!leaseStart && !!monthlyRent && parseFloat(monthlyRent) > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <StepBar step={step} />

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="card p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Select property and tenant
          </h2>
          <div className="space-y-5">
            <Field label="Property" required>
              <select
                className={SELECT}
                value={propertyId}
                onChange={(e) => onPropertyChange(e.target.value)}
              >
                <option value="">Select a property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tenant" required>
              <select
                className={SELECT}
                value={tenantId}
                onChange={(e) => onTenantChange(e.target.value)}
                disabled={!propertyId}
              >
                <option value="">
                  {propertyId ? "Select a tenant…" : "Select a property first"}
                </option>
                {propertyTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
              {propertyId && propertyTenants.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No tenants on this property.
                </p>
              )}
            </Field>

            {selectedProperty && selectedTenant && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Auto-filled details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Landlord</p>
                    <p className="font-medium text-slate-900">
                      {landlord.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tenant</p>
                    <p className="font-medium text-slate-900">
                      {selectedTenant.full_name}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Property address</p>
                    <p className="font-medium text-slate-900">
                      {selectedProperty.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-40"
            >
              Next: Lease terms →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="card p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Lease terms
          </h2>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Lease start date" required>
                <input
                  type="date"
                  className={INPUT}
                  value={leaseStart}
                  onChange={(e) => setLeaseStart(e.target.value)}
                />
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between">
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
                  value={leaseEnd}
                  onChange={(e) => setLeaseEnd(e.target.value)}
                  disabled={monthToMonth}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Monthly rent (R)" required>
                <input
                  type="number"
                  min="0"
                  className={INPUT}
                  placeholder="e.g. 12500"
                  value={monthlyRent}
                  onChange={(e) => onMonthlyRentChange(e.target.value)}
                />
              </Field>
              <Field label="Deposit amount (R)">
                <input
                  type="number"
                  min="0"
                  className={INPUT}
                  placeholder="Default: 2x monthly rent"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Payment due day">
                <select
                  className={SELECT}
                  value={paymentDueDay}
                  onChange={(e) => setPaymentDueDay(e.target.value)}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                      {d === 1
                        ? "st"
                        : d === 2
                          ? "nd"
                          : d === 3
                            ? "rd"
                            : "th"}{" "}
                      of month
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Notice period">
                <div className="flex gap-2">
                  {[30, 60].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNoticePeriod(n)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                        noticePeriod === n
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {n} days
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <span className="text-sm font-medium text-slate-700">
                  Pets allowed
                </span>
                <button
                  type="button"
                  onClick={() => setPetAllowed(!petAllowed)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${petAllowed ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${petAllowed ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <span className="text-sm font-medium text-slate-700">
                  Subletting allowed
                </span>
                <button
                  type="button"
                  onClick={() => setSublettingAllowed(!sublettingAllowed)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${sublettingAllowed ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${sublettingAllowed ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>

            <Field label="Special conditions">
              <textarea
                className={INPUT + " resize-none"}
                rows={3}
                placeholder="Any additional terms or conditions (optional)…"
                value={specialConditions}
                onChange={(e) => setSpecialConditions(e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ← Back
            </button>
            <button
              disabled={!step2Valid}
              onClick={() => setStep(3)}
              className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-40"
            >
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && selectedProperty && selectedTenant && (
        <div className="card p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Review your lease
          </h2>

          <div className="space-y-4 text-sm">
            <Section title="Parties">
              <Row label="Landlord" value={landlord.full_name} />
              <Row label="Tenant" value={selectedTenant.full_name} />
            </Section>

            <Section title="Property">
              <Row label="Name" value={selectedProperty.name} />
              <Row label="Address" value={selectedProperty.address} />
            </Section>

            <Section title="Lease Terms">
              <Row
                label="Start date"
                value={new Date(leaseStart).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <Row
                label="End date"
                value={
                  monthToMonth
                    ? "Month-to-month"
                    : leaseEnd
                      ? new Date(leaseEnd).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"
                }
              />
              <Row label="Monthly rent" value={fmtRand(monthlyRent)} />
              <Row
                label="Deposit"
                value={
                  depositAmount
                    ? fmtRand(depositAmount)
                    : `${fmtRand(monthlyRent)} × 2 (default)`
                }
              />
              <Row
                label="Payment due"
                value={`${paymentDueDay}${parseInt(paymentDueDay) === 1 ? "st" : parseInt(paymentDueDay) === 2 ? "nd" : parseInt(paymentDueDay) === 3 ? "rd" : "th"} of month`}
              />
              <Row label="Notice period" value={`${noticePeriod} days`} />
              <Row
                label="Pets"
                value={petAllowed ? "Allowed" : "Not allowed"}
              />
              <Row
                label="Subletting"
                value={sublettingAllowed ? "Allowed" : "Not allowed"}
              />
              {specialConditions && (
                <Row label="Special conditions" value={specialConditions} />
              )}
            </Section>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ← Back
            </button>
            <button
              disabled={submitting}
              onClick={generate}
              className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? "Generating…" : "Generate lease"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
      </div>
      <div className="divide-y divide-slate-50 px-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
