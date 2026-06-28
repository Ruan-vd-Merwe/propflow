"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PropertyWithFinance } from "@/lib/types";

type Props = {
  property: PropertyWithFinance;
  totalRentCents: number;
};

function centsToRandStr(cents: number | null | undefined): string {
  if (cents == null) return "";
  return String(Math.round(cents / 100));
}

function randStrToCents(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return null;
  return Math.round(n * 100);
}

function safeInt(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function safeFloat(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function fmtRand(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function safePct(annual: number, value: number): string {
  if (value <= 0 || annual === 0) return "0.0%";
  const result = ((annual / value) * 100).toFixed(1);
  return isFinite(parseFloat(result)) ? result + "%" : "0.0%";
}

function calculateMonthlyBondRepayment(
  principal: number,
  annualInterestRatePercent: number,
  termYears: number,
): number {
  if (principal <= 0 || annualInterestRatePercent <= 0 || termYears <= 0) {
    return 0;
  }
  const monthlyRate = annualInterestRatePercent / 100 / 12;
  const n = termYears * 12;
  const repayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1);
  return isFinite(repayment) ? Math.round(repayment) : 0;
}

function calcBondEndDate(startDate: string, termYears: string): string | null {
  if (!startDate || !termYears) return null;
  const d = new Date(startDate);
  d.setFullYear(d.getFullYear() + parseInt(termYears, 10));
  return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function calcRemainingMonths(startDate: string, termYears: string): number {
  if (!startDate || !termYears) return 0;
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + parseInt(termYears, 10));
  const now = new Date();
  const diff =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

const BANKS = [
  "Nedbank",
  "FNB",
  "ABSA",
  "Standard Bank",
  "SA Home Loans",
  "Other",
];
const TERMS = [10, 15, 20, 25, 30];
const DUE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export function SetupForm({ property, totalRentCents }: Props) {
  const router = useRouter();

  // ── Property value ─────────────────────────────────────────────────────────
  const [purchasePrice, setPurchasePrice] = useState(
    centsToRandStr(property.purchase_price_cents),
  );
  const [currentValue, setCurrentValue] = useState(
    centsToRandStr(property.current_value_cents),
  );

  // ── Rental income ──────────────────────────────────────────────────────────
  const [monthlyRent, setMonthlyRent] = useState(
    centsToRandStr(property.monthly_rent_cents),
  );
  const [rentalDueDay, setRentalDueDay] = useState(
    property.rental_due_day != null ? String(property.rental_due_day) : "1",
  );
  const [depositAmount, setDepositAmount] = useState(
    centsToRandStr(property.deposit_amount_cents),
  );
  const [leaseStart, setLeaseStart] = useState(
    property.lease_start_date ?? "",
  );
  const [leaseEnd, setLeaseEnd] = useState(property.lease_end_date ?? "");

  // ── Bond ───────────────────────────────────────────────────────────────────
  const [hasBond, setHasBond] = useState(
    property.bond_monthly_payment_cents != null || property.bond_bank != null,
  );
  const [bondBank, setBondBank] = useState(property.bond_bank ?? "Nedbank");
  const [bondAmount, setBondAmount] = useState(
    centsToRandStr(property.bond_original_amount_cents),
  );
  const [bondRate, setBondRate] = useState(
    property.bond_interest_rate_pct != null
      ? String(property.bond_interest_rate_pct)
      : "",
  );
  const [bondStart, setBondStart] = useState(property.bond_start_date ?? "");
  const [bondTerm, setBondTerm] = useState(
    property.bond_term_years != null ? String(property.bond_term_years) : "20",
  );
  const [manualBondOverride, setManualBondOverride] = useState(false);
  const [bondPaymentOverride, setBondPaymentOverride] = useState(
    centsToRandStr(property.bond_monthly_payment_cents),
  );

  // ── Monthly expenses ───────────────────────────────────────────────────────
  const [levy, setLevy] = useState(centsToRandStr(property.levy_monthly_cents));
  const [rates, setRates] = useState(
    centsToRandStr(property.rates_monthly_cents),
  );
  const [insurance, setInsurance] = useState(
    centsToRandStr(property.insurance_monthly_cents),
  );
  const [mgmtFee, setMgmtFee] = useState(
    property.management_fee_pct != null ? String(property.management_fee_pct) : "0",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived / calculated values ────────────────────────────────────────────
  const bondAmountCents = (randStrToCents(bondAmount) ?? 0) / 100;
  const bondRateNum = safeFloat(bondRate) ?? 0;
  const bondTermNum = safeInt(bondTerm) ?? 0;

  const calculatedRepayment = hasBond
    ? calculateMonthlyBondRepayment(bondAmountCents, bondRateNum, bondTermNum)
    : 0;

  // When auto-calculate mode and inputs change, keep override display in sync
  useEffect(() => {
    if (!manualBondOverride) {
      setBondPaymentOverride(
        calculatedRepayment > 0 ? String(Math.round(calculatedRepayment / 100)) : "",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedRepayment, manualBondOverride]);

  const effectiveBondCents = hasBond
    ? manualBondOverride
      ? (randStrToCents(bondPaymentOverride) ?? 0)
      : calculatedRepayment
    : 0;

  const bondEndDisplay = hasBond ? calcBondEndDate(bondStart, bondTerm) : null;
  const remainingMonths = hasBond ? calcRemainingMonths(bondStart, bondTerm) : 0;

  // Rental income for summary: prefer active tenant rent, fallback to form entry
  const formRentCents = randStrToCents(monthlyRent) ?? 0;
  const rentCents = totalRentCents > 0 ? totalRentCents : formRentCents;
  const hasTenantRent = totalRentCents > 0;

  const levyCents = randStrToCents(levy) ?? 0;
  const ratesCents = randStrToCents(rates) ?? 0;
  const insuranceCents = randStrToCents(insurance) ?? 0;
  const mgmtFeePct = safeFloat(mgmtFee) ?? 0;
  const mgmtFeeCents = Math.round((rentCents * mgmtFeePct) / 100);
  const totalExpenses =
    effectiveBondCents + levyCents + ratesCents + insuranceCents + mgmtFeeCents;
  const netCashFlow = rentCents - totalExpenses;

  const purchaseCents = randStrToCents(purchasePrice);
  const currentValCents = randStrToCents(currentValue);
  const annualRent = rentCents * 12;
  const annualNet = netCashFlow * 12;

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, number | string | null> = {
        property_id: property.id,
        purchase_price_cents: randStrToCents(purchasePrice),
        current_value_cents: randStrToCents(currentValue),
        // Rental income
        monthly_rent_cents: hasTenantRent ? null : formRentCents || null,
        rental_due_day: safeInt(rentalDueDay),
        deposit_amount_cents: randStrToCents(depositAmount),
        lease_start_date: leaseStart || null,
        lease_end_date: leaseEnd || null,
        // Bond
        bond_bank: hasBond ? bondBank : null,
        bond_original_amount_cents: hasBond
          ? randStrToCents(bondAmount)
          : null,
        bond_monthly_payment_cents: hasBond ? effectiveBondCents || null : null,
        bond_interest_rate_pct: hasBond ? safeFloat(bondRate) : null,
        bond_start_date: hasBond && bondStart ? bondStart : null,
        bond_term_years: hasBond ? safeInt(bondTerm) : null,
        bond_remaining_months: hasBond ? remainingMonths : null,
        // Expenses
        levy_monthly_cents: randStrToCents(levy),
        rates_monthly_cents: randStrToCents(rates),
        insurance_monthly_cents: randStrToCents(insurance),
        management_fee_pct: safeFloat(mgmtFee) ?? 0,
      };

      const res = await fetch("/api/portfolio/update-finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      router.push(`/portfolio/${property.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Left: Form sections ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Section 1 — Property value */}
          <div className="card p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Property Value
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Purchase price">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
              </FormField>
              <FormField
                label="Current estimated value"
                hint="Use recent sales in your area, Lightstone, or an estate agent valuation as a guide."
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Section 2 — Rental income */}
          <div className="card p-6">
            <h2 className="mb-1 text-base font-semibold text-slate-900">
              Rental Income
            </h2>
            {hasTenantRent ? (
              <p className="mb-4 text-xs text-slate-500">
                Rental income is pulled from the active lease where available.
              </p>
            ) : (
              <p className="mb-4 text-xs text-slate-500">
                No active tenant found. Enter the current or expected monthly rent.
                {/* TODO: Move rental income to active lease table once lease workflow is fully connected. */}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={
                  hasTenantRent
                    ? "Monthly rent (from active tenant)"
                    : "Current monthly rent"
                }
                hint="Use the rent in the current lease. If the property is vacant, enter 0."
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={hasTenantRent ? centsToRandStr(totalRentCents) : monthlyRent}
                    onChange={(e) => {
                      if (!hasTenantRent) setMonthlyRent(e.target.value);
                    }}
                    readOnly={hasTenantRent}
                    placeholder="0"
                    min="0"
                    className={`input-field pl-7 ${hasTenantRent ? "bg-slate-50 text-slate-500" : ""}`}
                  />
                </div>
              </FormField>
              <FormField label="Payment due day">
                <select
                  value={rentalDueDay}
                  onChange={(e) => setRentalDueDay(e.target.value)}
                  className="input-field"
                >
                  {DUE_DAYS.map((d) => (
                    <option key={d} value={String(d)}>
                      {d === 1 ? "1st" : d === 2 ? "2nd" : d === 3 ? "3rd" : `${d}th`} of the month
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Deposit held">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
              </FormField>
              <div />
              <FormField label="Lease start date">
                <input
                  type="date"
                  value={leaseStart}
                  onChange={(e) => setLeaseStart(e.target.value)}
                  className="input-field"
                />
              </FormField>
              <FormField label="Lease end date">
                <input
                  type="date"
                  value={leaseEnd}
                  onChange={(e) => setLeaseEnd(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>
          </div>

          {/* Section 3 — Bond details */}
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Bond Details
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={hasBond}
                  onChange={(e) => setHasBond(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
                This property has a bond
              </label>
            </div>

            {hasBond && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Bond bank">
                  <select
                    value={bondBank}
                    onChange={(e) => setBondBank(e.target.value)}
                    className="input-field"
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Bond amount"
                  hint="Use your original bond amount or current outstanding balance. The repayment estimate is based on this amount."
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      R
                    </span>
                    <input
                      type="number"
                      value={bondAmount}
                      onChange={(e) => setBondAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="input-field pl-7"
                    />
                  </div>
                </FormField>
                <FormField
                  label="Interest rate (% per year)"
                  hint="Use your current annual interest rate. SA home loans are often linked to prime."
                >
                  <div className="relative">
                    <input
                      type="number"
                      value={bondRate}
                      onChange={(e) => setBondRate(e.target.value)}
                      placeholder="11.25"
                      min="0"
                      max="100"
                      step="0.01"
                      className="input-field pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      %
                    </span>
                  </div>
                </FormField>
                <FormField label="Bond term">
                  <select
                    value={bondTerm}
                    onChange={(e) => setBondTerm(e.target.value)}
                    className="input-field"
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={String(t)}>
                        {t} years
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Bond start date">
                  <input
                    type="date"
                    value={bondStart}
                    onChange={(e) => setBondStart(e.target.value)}
                    className="input-field"
                  />
                </FormField>
                <div className="flex flex-col justify-end gap-1 text-sm text-slate-500">
                  {bondEndDisplay && (
                    <p>
                      Bond ends{" "}
                      <span className="font-medium text-slate-700">
                        {bondEndDisplay}
                      </span>
                    </p>
                  )}
                  {remainingMonths > 0 && (
                    <p>
                      <span className="font-medium text-slate-700">
                        {remainingMonths}
                      </span>{" "}
                      months remaining
                    </p>
                  )}
                </div>

                {/* Auto-calculated repayment */}
                <div className="sm:col-span-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        Monthly bond repayment
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {effectiveBondCents > 0
                          ? fmtRand(effectiveBondCents)
                          : "—"}
                      </p>
                    </div>
                    <p className="mb-3 text-xs text-slate-400">
                      {manualBondOverride
                        ? "Using manual repayment amount."
                        : "Calculated from bond amount, interest rate and term. You can override this if your actual debit order is different."}
                    </p>
                    <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={manualBondOverride}
                        onChange={(e) => setManualBondOverride(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                      />
                      Use manual repayment amount
                    </label>
                    {manualBondOverride && (
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          R
                        </span>
                        <input
                          type="number"
                          value={bondPaymentOverride}
                          onChange={(e) => setBondPaymentOverride(e.target.value)}
                          placeholder="0"
                          min="0"
                          className="input-field pl-7"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4 — Monthly expenses */}
          <div className="card p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Monthly Expenses
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Body corporate levy"
                hint="Enter 0 if no body corporate"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={levy}
                    onChange={(e) => setLevy(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
              </FormField>
              <FormField label="Municipal rates">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={rates}
                    onChange={(e) => setRates(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
              </FormField>
              <FormField label="Building insurance">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input-field pl-7"
                  />
                </div>
              </FormField>
              <FormField
                label="Management fee"
                hint="Enter 0 if self-managed"
              >
                <div className="relative">
                  <input
                    type="number"
                    value={mgmtFee}
                    onChange={(e) => setMgmtFee(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.5"
                    className="input-field pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    %
                  </span>
                </div>
              </FormField>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary max-w-xs"
            >
              {saving ? "Saving..." : "Save financial details"}
            </button>
            <a
              href={`/portfolio/${property.id}`}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          </div>
        </div>

        {/* ── Right: Live preview ─────────────────────────────────────── */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Monthly Summary
            </h3>
            <div className="space-y-2 text-sm">
              <PreviewLine
                label="Rental income"
                value={rentCents > 0 ? fmtRand(rentCents) : "R 0"}
                emphasis
              />
              <div className="my-2 border-t border-slate-100" />
              {hasBond && (
                <PreviewLine
                  label="Bond repayment"
                  value={
                    effectiveBondCents > 0
                      ? `– ${fmtRand(effectiveBondCents)}`
                      : "—"
                  }
                />
              )}
              <PreviewLine
                label="Body corp levy"
                value={levyCents > 0 ? `– ${fmtRand(levyCents)}` : "—"}
              />
              <PreviewLine
                label="Rates"
                value={ratesCents > 0 ? `– ${fmtRand(ratesCents)}` : "—"}
              />
              <PreviewLine
                label="Insurance"
                value={
                  insuranceCents > 0 ? `– ${fmtRand(insuranceCents)}` : "—"
                }
              />
              {mgmtFeePct > 0 && (
                <PreviewLine
                  label={`Management (${mgmtFeePct}%)`}
                  value={`– ${fmtRand(mgmtFeeCents)}`}
                />
              )}
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">Net cash flow</span>
                <span
                  className={
                    netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"
                  }
                >
                  {fmtRand(netCashFlow)}
                </span>
              </div>
            </div>

            {(purchaseCents ?? 0) > 0 || (currentValCents ?? 0) > 0 ? (
              <>
                <div className="my-4 border-t border-slate-100" />
                <div className="space-y-2 text-sm">
                  {(currentValCents ?? 0) > 0 && (
                    <PreviewLine
                      label="Gross yield"
                      value={safePct(annualRent, currentValCents ?? 0)}
                    />
                  )}
                  {(currentValCents ?? 0) > 0 && (
                    <PreviewLine
                      label="Net yield"
                      value={safePct(annualNet, currentValCents ?? 0)}
                    />
                  )}
                  {purchaseCents != null &&
                    currentValCents != null &&
                    currentValCents > purchaseCents && (
                      <PreviewLine
                        label="Capital gain"
                        value={fmtRand(currentValCents - purchaseCents)}
                      />
                    )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function PreviewLine({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={emphasis ? "font-medium text-slate-900" : "text-slate-500"}
      >
        {label}
      </span>
      <span
        className={emphasis ? "font-semibold text-slate-900" : "text-slate-700"}
      >
        {value}
      </span>
    </div>
  );
}
