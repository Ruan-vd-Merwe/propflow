"use client";

import { useState } from "react";
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

function fmtRand(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function pct(annual: number, value: number): string {
  if (value <= 0) return "—";
  return ((annual / value) * 100).toFixed(1) + "%";
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

export function SetupForm({ property, totalRentCents }: Props) {
  const router = useRouter();

  const [purchasePrice, setPurchasePrice] = useState(
    centsToRandStr(property.purchase_price_cents),
  );
  const [currentValue, setCurrentValue] = useState(
    centsToRandStr(property.current_value_cents),
  );

  const [hasBond, setHasBond] = useState(
    property.bond_monthly_payment_cents != null ||
      property.bond_bank != null,
  );
  const [bondBank, setBondBank] = useState(property.bond_bank ?? "Nedbank");
  const [bondPayment, setBondPayment] = useState(
    centsToRandStr(property.bond_monthly_payment_cents),
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

  const [levy, setLevy] = useState(centsToRandStr(property.levy_monthly_cents));
  const [rates, setRates] = useState(
    centsToRandStr(property.rates_monthly_cents),
  );
  const [insurance, setInsurance] = useState(
    centsToRandStr(property.insurance_monthly_cents),
  );
  const [mgmtFee, setMgmtFee] = useState(
    property.management_fee_pct != null
      ? String(property.management_fee_pct)
      : "0",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live preview calculations
  const rentCents = totalRentCents;
  const bondCents = hasBond ? (randStrToCents(bondPayment) ?? 0) : 0;
  const levyCents = randStrToCents(levy) ?? 0;
  const ratesCents = randStrToCents(rates) ?? 0;
  const insuranceCents = randStrToCents(insurance) ?? 0;
  const mgmtFeePct = parseFloat(mgmtFee) || 0;
  const mgmtFeeCents = Math.round((rentCents * mgmtFeePct) / 100);
  const totalExpenses =
    bondCents + levyCents + ratesCents + insuranceCents + mgmtFeeCents;
  const netCashFlow = rentCents - totalExpenses;

  const purchaseCents = randStrToCents(purchasePrice);
  const currentValCents = randStrToCents(currentValue);
  const annualRent = rentCents * 12;
  const annualNet = netCashFlow * 12;

  const bondEndDateDisplay =
    bondStart && bondTerm
      ? (() => {
          const d = new Date(bondStart);
          d.setFullYear(d.getFullYear() + parseInt(bondTerm));
          return d.toLocaleDateString("en-ZA", {
            month: "short",
            year: "numeric",
          });
        })()
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, number | string | null | boolean> = {
        property_id: property.id,
        purchase_price_cents: randStrToCents(purchasePrice),
        current_value_cents: randStrToCents(currentValue),
        bond_bank: hasBond ? bondBank : null,
        bond_monthly_payment_cents: hasBond
          ? randStrToCents(bondPayment)
          : null,
        bond_interest_rate_pct: hasBond
          ? parseFloat(bondRate) || null
          : null,
        bond_start_date: hasBond && bondStart ? bondStart : null,
        bond_term_years: hasBond && bondTerm ? parseInt(bondTerm) : null,
        levy_monthly_cents: randStrToCents(levy),
        rates_monthly_cents: randStrToCents(rates),
        insurance_monthly_cents: randStrToCents(insurance),
        management_fee_pct: parseFloat(mgmtFee) || 0,
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
              <FormField label="Current estimated value">
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
                <p className="mt-1 text-xs text-slate-400">
                  Use recent sales in your area as a guide
                </p>
              </FormField>
            </div>
          </div>

          {/* Section 2 — Bond details */}
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
                <FormField label="Monthly bond payment">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      R
                    </span>
                    <input
                      type="number"
                      value={bondPayment}
                      onChange={(e) => setBondPayment(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="input-field pl-7"
                    />
                  </div>
                </FormField>
                <FormField label="Interest rate (% per year)">
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
                <FormField label="Bond start date">
                  <input
                    type="date"
                    value={bondStart}
                    onChange={(e) => setBondStart(e.target.value)}
                    className="input-field"
                  />
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
                {bondEndDateDisplay && (
                  <div className="flex items-end sm:col-span-1">
                    <p className="text-sm text-slate-500">
                      Bond ends{" "}
                      <span className="font-medium text-slate-700">
                        {bondEndDateDisplay}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3 — Monthly expenses */}
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
                value={fmtRand(rentCents)}
                emphasis
              />
              <div className="my-2 border-t border-slate-100" />
              {hasBond && (
                <PreviewLine
                  label="Bond payment"
                  value={bondCents > 0 ? `– ${fmtRand(bondCents)}` : "—"}
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

            {(purchaseCents || currentValCents) && (
              <>
                <div className="my-4 border-t border-slate-100" />
                <div className="space-y-2 text-sm">
                  {currentValCents && currentValCents > 0 && (
                    <PreviewLine
                      label="Gross yield"
                      value={pct(annualRent, currentValCents)}
                    />
                  )}
                  {currentValCents && currentValCents > 0 && (
                    <PreviewLine
                      label="Net yield"
                      value={pct(annualNet, currentValCents)}
                    />
                  )}
                  {purchaseCents && currentValCents && currentValCents > purchaseCents && (
                    <PreviewLine
                      label="Capital gain"
                      value={fmtRand(currentValCents - purchaseCents)}
                    />
                  )}
                </div>
              </>
            )}
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
      <span className={emphasis ? "font-medium text-slate-900" : "text-slate-500"}>
        {label}
      </span>
      <span className={emphasis ? "font-semibold text-slate-900" : "text-slate-700"}>
        {value}
      </span>
    </div>
  );
}
