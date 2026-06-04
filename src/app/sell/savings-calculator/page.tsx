"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Data ──────────────────────────────────────────────────────────────────────

const PLATFORM_TIERS = [
  { label: "PropTrust Starter", price: 1990, desc: "Listing, property pack, enquiries" },
  { label: "PropTrust Professional", price: 4500, desc: "Full tools including OTP guide and communication centre" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-ZA", { maximumFractionDigits: 0 });
}

function pct(n: number, total: number) {
  return total > 0 ? ((n / total) * 100).toFixed(1) : "0";
}

// ── Transfer duty table (2024/25) ─────────────────────────────────────────────

function calcTransferDuty(price: number): number {
  if (price > 11_000_000) return (price - 11_000_000) * 0.13 + 1_246_000;
  if (price > 2_500_000) return (price - 2_500_000) * 0.11 + 311_500;
  if (price > 1_750_000) return (price - 1_750_000) * 0.08 + 251_500;
  if (price > 1_512_375) return (price - 1_512_375) * 0.06 + 237_500;
  if (price > 1_100_000) return (price - 1_100_000) * 0.05;
  return 0;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SavingsCalculatorPage() {
  const [rawPrice, setRawPrice] = useState("2850000");
  const [commissionRate, setCommissionRate] = useState("5.5");
  const [selectedTier, setSelectedTier] = useState(1);
  const [includeVAT, setIncludeVAT] = useState(true);

  const price = Math.max(0, parseInt(rawPrice.replace(/\D/g, ""), 10) || 0);
  const rate = parseFloat(commissionRate) / 100 || 0.055;
  const platformCost = PLATFORM_TIERS[selectedTier].price;

  const baseCommission = price * rate;
  const commissionWithVAT = includeVAT ? baseCommission * 1.15 : baseCommission;

  const conveyancingFee = Math.min(Math.round(price * 0.015 + 5000), 75000);
  const transferDuty = calcTransferDuty(price);

  const traditionalTotal = commissionWithVAT + conveyancingFee + transferDuty;
  const privateTotal = platformCost + conveyancingFee + transferDuty;
  const saving = traditionalTotal - privateTotal;
  const savingPct = price > 0 ? ((saving / price) * 100).toFixed(2) : "0";

  const ROWS = [
    {
      label: "Estate agent commission",
      traditional: commissionWithVAT,
      private: 0,
      note: includeVAT ? `${commissionRate}% + VAT on R${fmt(price)}` : `${commissionRate}% on R${fmt(price)}`,
    },
    {
      label: "PropTrust platform fee",
      traditional: 0,
      private: platformCost,
      note: PLATFORM_TIERS[selectedTier].label,
    },
    {
      label: "Conveyancing fees",
      traditional: conveyancingFee,
      private: conveyancingFee,
      note: "Required for both — regulated fee scale",
    },
    {
      label: "Transfer duty (SARS)",
      traditional: transferDuty,
      private: transferDuty,
      note: price <= 1_100_000 ? "None — below threshold" : "2024/25 SARS table",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Private Sale</p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Savings Calculator
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Compare the true cost of selling through a traditional estate agent versus selling privately on PropTrust.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Inputs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-base font-bold text-slate-900">Your Sale Details</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Property Sale Price (ZAR)</label>
                <input type="text" value={rawPrice} onChange={(e) => setRawPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Estate Agent Commission Rate (%)</label>
                <input type="number" step="0.5" min="1" max="10" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold focus:border-blue-500 focus:outline-none" />
                <p className="mt-1 text-xs text-slate-400">Standard in South Africa: 5–7.5%. Most common: 5.5%</p>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold text-slate-600">PropTrust Package</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {PLATFORM_TIERS.map((tier, i) => (
                  <button key={i} onClick={() => setSelectedTier(i)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selectedTier === i ? "border-[#1e40af] bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"
                    }`}>
                    <p className={`text-sm font-bold ${selectedTier === i ? "text-[#1e40af]" : "text-slate-900"}`}>{tier.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{tier.desc}</p>
                    <p className={`mt-2 text-base font-extrabold ${selectedTier === i ? "text-[#1e40af]" : "text-slate-900"}`}>
                      R{fmt(tier.price)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => setIncludeVAT(!includeVAT)}
                className={`relative h-5 w-10 rounded-full transition-colors ${includeVAT ? "bg-[#1e40af]" : "bg-slate-300"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${includeVAT ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <label className="text-xs font-medium text-slate-600" onClick={() => setIncludeVAT(!includeVAT)} style={{ cursor: "pointer" }}>
                Include VAT (15%) on agent commission
              </label>
            </div>
          </div>

          {/* Comparison table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 border-b border-slate-100 bg-[#f8fafc]">
              <div className="px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost</p>
              </div>
              <div className="border-l border-slate-100 px-5 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Traditional agent</p>
              </div>
              <div className="border-l border-slate-100 bg-blue-50 px-5 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1e40af]">Private (PropTrust)</p>
              </div>
            </div>

            {ROWS.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-slate-100 last:border-0">
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-800">{row.label}</p>
                  <p className="text-xs text-slate-400">{row.note}</p>
                </div>
                <div className="flex items-center justify-center border-l border-slate-100 px-5 py-4 text-center">
                  {row.traditional === 0 ? (
                    <span className="text-sm text-slate-400">—</span>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-900">R{fmt(row.traditional)}</p>
                      <p className="text-xs text-slate-400">{pct(row.traditional, price)}% of sale</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center border-l border-slate-100 bg-blue-50 px-5 py-4 text-center">
                  {row.private === 0 ? (
                    <span className="text-sm font-bold text-green-700">None</span>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[#1e40af]">R{fmt(row.private)}</p>
                      <p className="text-xs text-slate-400">{pct(row.private, price)}% of sale</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="grid grid-cols-3 border-t-2 border-slate-200 bg-slate-50">
              <div className="px-5 py-4">
                <p className="text-sm font-extrabold text-slate-900">Total cost</p>
              </div>
              <div className="flex items-center justify-center border-l border-slate-200 px-5 py-4 text-center">
                <div>
                  <p className="text-base font-extrabold text-slate-900">R{fmt(traditionalTotal)}</p>
                  <p className="text-xs text-slate-500">{pct(traditionalTotal, price)}% of sale price</p>
                </div>
              </div>
              <div className="flex items-center justify-center border-l border-slate-200 bg-blue-100 px-5 py-4 text-center">
                <div>
                  <p className="text-base font-extrabold text-[#1e40af]">R{fmt(privateTotal)}</p>
                  <p className="text-xs text-slate-500">{pct(privateTotal, price)}% of sale price</p>
                </div>
              </div>
            </div>
          </div>

          {/* Savings highlight */}
          {price > 0 && saving > 0 && (
            <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-700">Estimated saving by selling privately</p>
                  <p className="mt-1 text-5xl font-extrabold text-green-800">R{fmt(saving)}</p>
                  <p className="mt-1 text-sm text-green-700">That is {savingPct}% of your sale price that stays in your pocket.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Net proceeds comparison</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between gap-8">
                      <span className="text-xs text-green-700">Traditional agent</span>
                      <span className="text-sm font-bold text-green-800">R{fmt(price - traditionalTotal)}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-xs text-green-700">PropTrust private sale</span>
                      <span className="text-sm font-bold text-[#1e40af]">R{fmt(price - privateTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bar chart */}
          {price > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cost breakdown as % of sale price</p>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">Traditional agent route</p>
                    <p className="text-xs font-bold text-slate-900">{pct(traditionalTotal, price)}% — R{fmt(traditionalTotal)}</p>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div className="flex h-full">
                      <div className="bg-red-400 transition-all" style={{ width: `${pct(commissionWithVAT, price)}%` }} title={`Commission: R${fmt(commissionWithVAT)}`} />
                      <div className="bg-slate-400 transition-all" style={{ width: `${pct(conveyancingFee, price)}%` }} title={`Conveyancing: R${fmt(conveyancingFee)}`} />
                      {transferDuty > 0 && <div className="bg-slate-300 transition-all" style={{ width: `${pct(transferDuty, price)}%` }} title={`Transfer duty: R${fmt(transferDuty)}`} />}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">PropTrust private sale</p>
                    <p className="text-xs font-bold text-[#1e40af]">{pct(privateTotal, price)}% — R{fmt(privateTotal)}</p>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div className="flex h-full">
                      <div className="bg-blue-400 transition-all" style={{ width: `${pct(platformCost, price)}%` }} title={`Platform: R${fmt(platformCost)}`} />
                      <div className="bg-slate-400 transition-all" style={{ width: `${pct(conveyancingFee, price)}%` }} title={`Conveyancing: R${fmt(conveyancingFee)}`} />
                      {transferDuty > 0 && <div className="bg-slate-300 transition-all" style={{ width: `${pct(transferDuty, price)}%` }} title={`Transfer duty: R${fmt(transferDuty)}`} />}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  { color: "bg-red-400", label: "Agent commission" },
                  { color: "bg-blue-400", label: "PropTrust platform fee" },
                  { color: "bg-slate-400", label: "Conveyancing fees" },
                  { color: "bg-slate-300", label: "Transfer duty" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                    <span className="text-xs text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimers */}
          <div className="rounded-xl border border-slate-100 bg-[#f8fafc] p-4">
            <p className="text-xs leading-relaxed text-slate-500">
              <strong>Disclaimer:</strong> All figures are estimates for illustration purposes only. Transfer duty is calculated using the 2024/25 SARS rates applicable to natural persons. Conveyancing fees are estimated based on the Law Society guidelines and will vary by conveyancer. Platform fees reflect current PropTrust pricing and are subject to change. This calculator does not constitute financial or legal advice.
            </p>
          </div>

          {/* CTA */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/sell/listing-assistant"
              className="rounded-xl bg-[#1e40af] px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-blue-800">
              Start your private listing
            </Link>
            <Link href="/professionals"
              className="rounded-xl border border-slate-200 px-6 py-4 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Find a conveyancer
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
