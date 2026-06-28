"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckItem = { id: string; label: string; done: boolean; note?: string };

// ── Data ──────────────────────────────────────────────────────────────────────

const INITIAL_CHECKLIST: CheckItem[] = [
  { id: "bond_estimate", label: "Get a bond estimate from at least two banks or a bond originator", done: false },
  { id: "transfer_cost", label: "Calculate transfer costs, transfer duty and conveyancing fees", done: false },
  { id: "levy_confirm", label: "Confirm levy amount, levy arrears and what levies cover", done: false },
  { id: "rates_confirm", label: "Confirm rates and taxes and that the account is current", done: false },
  { id: "defect_review", label: "Review the seller's defect disclosure document carefully", done: false },
  { id: "compliance_certs", label: "Verify compliance certificates are valid (electrical, gas, plumbing, beetle)", done: false },
  { id: "approved_plans", label: "Confirm all structures are covered by approved building plans", done: false },
  { id: "body_corp_docs", label: "Review body corporate financials, rules and recent AGM minutes", done: false },
  { id: "hoa_rules", label: "Review HOA rules and any restrictions on alterations or pets", done: false },
  { id: "title_deed", label: "Ask seller for copy of title deed — check for servitudes or restrictions", done: false },
  { id: "occupancy_date", label: "Confirm occupation date and whether the property is vacant or tenanted", done: false },
  { id: "seller_verified", label: "Verify seller's identity and confirm they are the registered owner", done: false },
  { id: "conveyancer", label: "Identify a reputable conveyancer to handle your transfer", done: false },
  { id: "bond_approval", label: "Understand the bond approval condition and timeline in the OTP", done: false },
  { id: "snag_inspection", label: "Consider commissioning an independent property inspection report", done: false },
];

const RED_FLAGS = [
  { flag: "Seller refuses to provide a written defect disclosure", severity: "high" },
  { flag: "Levy or rates account in arrears and seller cannot explain", severity: "high" },
  { flag: "Structures that cannot be matched to approved plans", severity: "high" },
  { flag: "Unusual urgency from the seller without explanation", severity: "high" },
  { flag: "Agent or facilitator discourages you from using a conveyancer", severity: "high" },
  { flag: "Asking price well below recent comparables with no clear reason", severity: "high" },
  { flag: "No body corporate AGM minutes available for sectional title", severity: "medium" },
  { flag: "Compliance certificates older than 2 years", severity: "medium" },
  { flag: "Seller is not available for viewings or questions", severity: "medium" },
  { flag: "Confusion about who is on the title deed", severity: "medium" },
];

const QUESTIONS_TO_ASK = [
  "Why are you selling?",
  "How long has the property been listed and have there been previous offers?",
  "Are there any outstanding disputes with the body corporate or HOA?",
  "Has there been any water damage, flooding or roof leaks?",
  "Are there any alterations that did not receive municipal approval?",
  "Is there a current tenant and what is their lease end date?",
  "What fixtures and appliances are included in the sale price?",
  "Are there any servitudes or rights of way on the property?",
  "What are the current monthly costs (levy, rates, water, electricity)?",
  "Have there been any recent pest control issues or treatments?",
];

// ── Bond calculator ───────────────────────────────────────────────────────────

function BondCalculator() {
  const [price, setPrice] = useState("2850000");
  const [deposit, setDeposit] = useState("285000");
  const [rate, setRate] = useState("11.75");
  const [term, setTerm] = useState("20");

  const loanAmount = Math.max(0, parseInt(price.replace(/\D/g, ""), 10) - parseInt(deposit.replace(/\D/g, ""), 10));
  const monthlyRate = parseFloat(rate) / 100 / 12;
  const months = parseInt(term) * 12;
  const monthly = loanAmount && monthlyRate && months
    ? Math.round((loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)))
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-base font-bold text-slate-900">Bond Estimate Calculator</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase Price (ZAR)</label>
          <input type="text" value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Deposit (ZAR)</label>
          <input type="text" value={deposit} onChange={(e) => setDeposit(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Interest Rate (%)</label>
          <input type="number" step="0.25" value={rate} onChange={(e) => setRate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Loan Term (years)</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
            {[10, 15, 20, 25, 30].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 rounded-xl bg-[#f8fafc] p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500">Loan amount</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">R{loanAmount.toLocaleString("en-ZA")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Monthly instalment</p>
            <p className="mt-1 text-lg font-extrabold text-[#1e40af]">R{monthly.toLocaleString("en-ZA")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total repaid</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">R{(monthly * months).toLocaleString("en-ZA")}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400 text-center">Indicative only. Your actual rate depends on your credit profile and the bank&apos;s assessment.</p>
      </div>
      <Link href="/professionals" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
        Find a bond originator to get the best rate
      </Link>
    </div>
  );
}

function TransferCostEstimator() {
  const [price, setPrice] = useState("2850000");
  const numPrice = parseInt(price.replace(/\D/g, ""), 10) || 0;

  let transferDuty = 0;
  if (numPrice > 11_000_000) transferDuty = (numPrice - 11_000_000) * 0.13 + 1_246_000;
  else if (numPrice > 2_500_000) transferDuty = (numPrice - 2_500_000) * 0.11 + 311_500;
  else if (numPrice > 1_750_000) transferDuty = (numPrice - 1_750_000) * 0.08 + 251_500;
  else if (numPrice > 1_512_375) transferDuty = (numPrice - 1_512_375) * 0.06 + 237_500;
  else if (numPrice > 1_100_000) transferDuty = (numPrice - 1_100_000) * 0.05;
  else transferDuty = 0;

  const conveyancingFee = Math.min(Math.round(numPrice * 0.015 + 5000), 75000);
  const bondRegistration = Math.min(Math.round(numPrice * 0.009 + 4000), 50000);
  const total = Math.round(transferDuty + conveyancingFee + bondRegistration);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-base font-bold text-slate-900">Transfer Cost Estimator</h3>
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase Price (ZAR)</label>
        <input type="text" value={price} onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-2">
        {[
          { label: "Transfer duty (SARS)", value: transferDuty, note: numPrice <= 1_100_000 ? "None — below threshold" : null },
          { label: "Conveyancing fees (estimated)", value: conveyancingFee, note: "Varies by conveyancer" },
          { label: "Bond registration costs (estimated)", value: bondRegistration, note: "If applying for a bond" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm text-slate-700">{row.label}</p>
              {row.note && <p className="text-xs text-slate-400">{row.note}</p>}
            </div>
            <p className="text-sm font-bold text-slate-900">R{row.value.toLocaleString("en-ZA")}</p>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-[#0f172a] px-4 py-3">
          <p className="text-sm font-bold text-white">Estimated total additional costs</p>
          <p className="text-base font-extrabold text-blue-300">R{total.toLocaleString("en-ZA")}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">Based on 2024/25 SARS transfer duty tables. Consult your conveyancer for exact costs.</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Section = "calculators" | "checklist" | "questions" | "redflags";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "calculators", label: "Cost Calculators" },
  { id: "checklist", label: "Due Diligence Checklist" },
  { id: "questions", label: "Questions to Ask" },
  { id: "redflags", label: "Red Flags" },
];

export default function DueDiligencePage() {
  const [section, setSection] = useState<Section>("calculators");
  const [checklist, setChecklist] = useState<CheckItem[]>(INITIAL_CHECKLIST);

  const done = checklist.filter((i) => i.done).length;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Buying Privately</p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Buyer Due Diligence
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Buying a property without an agent is achievable — but requires structured due diligence. Use this checklist to protect yourself and ensure the transaction is sound.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-10">
        <div className="mx-auto max-w-4xl">

          {/* Section tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  section === s.id ? "bg-[#1e40af] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Calculators */}
          {section === "calculators" && (
            <div className="space-y-6">
              <BondCalculator />
              <TransferCostEstimator />
            </div>
          )}

          {/* Checklist */}
          {section === "checklist" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Due Diligence Checklist</h3>
                  <p className="text-sm text-slate-500">Work through these before signing an OTP.</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">{done} / {checklist.length}</span>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button key={item.id}
                    onClick={() => setChecklist((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i))}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                      item.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}>
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                      item.done ? "border-green-500 bg-green-500" : "border-slate-300"
                    }`}>
                      {item.done && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${item.done ? "text-green-800" : "text-slate-700"}`}>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    const summary = checklist.map((i) => `[${i.done ? "x" : " "}] ${i.label}`).join("\n");
                    const blob = new Blob([`Due Diligence Checklist\n\n${summary}\n\nGenerated by PropTrust`], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "due-diligence-checklist.txt"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Download summary
                </button>
                <Link href="/buy/offer-to-purchase"
                  className="rounded-xl bg-[#1e40af] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                  Prepare your OTP
                </Link>
              </div>
            </div>
          )}

          {/* Questions */}
          {section === "questions" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-bold text-slate-900">Questions to Ask the Seller</h3>
              <p className="mb-5 text-sm text-slate-500">Ask these in writing where possible. Answers given in writing form part of the disclosure record.</p>
              <div className="space-y-3">
                {QUESTIONS_TO_ASK.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[#f8fafc] px-4 py-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e40af] text-xs font-bold text-white">{i + 1}</span>
                    <p className="text-sm text-slate-700">{q}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs text-blue-800">
                  Use the <Link href="/enquiry" className="font-bold hover:underline">Direct Communication Centre</Link> to send structured questions to the seller and keep a timestamped record.
                </p>
              </div>
            </div>
          )}

          {/* Red flags */}
          {section === "redflags" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-bold text-slate-900">Red Flag Checklist</h3>
              <p className="mb-5 text-sm text-slate-500">If you encounter any of these, pause the process and seek advice from a conveyancer before proceeding.</p>
              <div className="space-y-3">
                {RED_FLAGS.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
                    item.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                  }`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      item.severity === "high" ? "bg-red-500" : "bg-amber-500"
                    }`}>
                      {item.severity === "high" ? "!" : "~"}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${item.severity === "high" ? "text-red-800" : "text-amber-800"}`}>{item.flag}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                      item.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.severity === "high" ? "High risk" : "Caution"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-slate-100 bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-slate-700 mb-1">When in doubt, use a conveyancer.</p>
                <p className="text-xs text-slate-500 mb-3">A conveyancer&apos;s fee is a small fraction of the purchase price. Their job is to protect your interests during transfer. Never skip this step.</p>
                <Link href="/professionals" className="text-xs font-bold text-blue-600 hover:underline">Find a conveyancer in your area</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
