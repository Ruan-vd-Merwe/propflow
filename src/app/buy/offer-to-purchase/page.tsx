"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "parties" | "price" | "conditions" | "fixtures" | "handover";

// ── Step helpers ──────────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: Step; steps: { id: Step; label: string }[] }) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
              i < idx ? "bg-green-500 text-white" : i === idx ? "bg-[#1e40af] text-white" : "bg-slate-200 text-slate-400"
            }`}>
              {i < idx ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`mt-1 hidden text-[10px] font-semibold sm:block ${i === idx ? "text-[#1e40af]" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-1 h-0.5 flex-1 transition ${i < idx ? "bg-green-500" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Form sections ─────────────────────────────────────────────────────────────

function PartiesStep({ data, setData }: { data: Record<string, string>; setData: (k: string, v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Buyer Details</h3>
        <p className="mb-4 text-sm text-slate-500">These details will appear in the Offer to Purchase document.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { id: "buyer_full_name", label: "Full name(s)", placeholder: "As it appears on your ID" },
            { id: "buyer_id", label: "SA ID Number", placeholder: "13-digit ID number" },
            { id: "buyer_email", label: "Email address", placeholder: "your@email.com" },
            { id: "buyer_phone", label: "Contact number", placeholder: "e.g. 082 000 0000" },
            { id: "buyer_address", label: "Current address", placeholder: "Physical address" },
            { id: "buyer_marital_status", label: "Marital status", placeholder: "e.g. Single, Married in COP" },
          ].map((f) => (
            <div key={f.id}>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{f.label}</label>
              <input type="text" value={data[f.id] ?? ""} onChange={(e) => setData(f.id, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h3 className="mb-1 text-base font-bold text-slate-900">Seller Details</h3>
        <p className="mb-4 text-sm text-slate-500">Obtain these from the seller and verify against the title deed.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { id: "seller_full_name", label: "Full name(s)", placeholder: "As it appears on title deed" },
            { id: "seller_id", label: "SA ID Number", placeholder: "13-digit ID number" },
            { id: "seller_email", label: "Email address", placeholder: "seller@email.com" },
            { id: "seller_phone", label: "Contact number", placeholder: "e.g. 071 000 0000" },
          ].map((f) => (
            <div key={f.id}>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{f.label}</label>
              <input type="text" value={data[f.id] ?? ""} onChange={(e) => setData(f.id, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> PropTrust does not give legal advice. This form helps you prepare information for your conveyancer who will draft the actual Offer to Purchase. Do not sign any OTP without reviewing it with a qualified conveyancer.
        </p>
      </div>
    </div>
  );
}

function PriceStep({ data, setData }: { data: Record<string, string>; setData: (k: string, v: string) => void }) {
  const price = parseInt((data.purchase_price ?? "").replace(/\D/g, ""), 10) || 0;
  const deposit = parseInt((data.deposit ?? "").replace(/\D/g, ""), 10) || 0;
  const depositPct = price > 0 ? ((deposit / price) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Purchase Price and Deposit</h3>
        <p className="mb-4 text-sm text-slate-500">Agree these with the seller before your conveyancer drafts the OTP.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase Price (ZAR)</label>
          <input type="text" value={data.purchase_price ?? ""} onChange={(e) => setData("purchase_price", e.target.value)}
            placeholder="e.g. 2850000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Deposit Amount (ZAR)</label>
          <input type="text" value={data.deposit ?? ""} onChange={(e) => setData("deposit", e.target.value)}
            placeholder="e.g. 285000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          {price > 0 && deposit > 0 && (
            <p className="mt-1 text-xs text-slate-400">{depositPct}% of purchase price</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Deposit Payment Date</label>
          <input type="date" value={data.deposit_date ?? ""} onChange={(e) => setData("deposit_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          <p className="mt-1 text-xs text-slate-400">Payable into conveyancer&apos;s trust account</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Bond Required</label>
          <select value={data.bond_required ?? ""} onChange={(e) => setData("bond_required", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select…</option>
            <option>Yes — full bond required</option>
            <option>Yes — partial bond required</option>
            <option>No — cash purchase</option>
          </select>
        </div>
      </div>

      {data.bond_required && data.bond_required !== "No — cash purchase" && (
        <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Bond Approval Deadline</label>
            <input type="date" value={data.bond_approval_date ?? ""} onChange={(e) => setData("bond_approval_date", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            <p className="mt-1 text-xs text-slate-400">Typically 21–30 days from OTP signature date</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Bond Amount (ZAR)</label>
            <input type="text" value={data.bond_amount ?? ""} onChange={(e) => setData("bond_amount", e.target.value)}
              placeholder="e.g. 2565000"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          The deposit is held in the conveyancer&apos;s trust account and earns interest for the buyer until transfer. The OTP should specify who receives the interest accrued.
        </p>
      </div>
    </div>
  );
}

function ConditionsStep({ data, setData }: { data: Record<string, string>; setData: (k: string, v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Conditions and Dates</h3>
        <p className="mb-4 text-sm text-slate-500">These conditions protect both parties and define the timeline of the transaction.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Occupation Date</label>
          <input type="date" value={data.occupation_date ?? ""} onChange={(e) => setData("occupation_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          <p className="mt-1 text-xs text-slate-400">Date on which the buyer takes physical occupation</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Transfer Date (estimated)</label>
          <input type="date" value={data.transfer_date ?? ""} onChange={(e) => setData("transfer_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          <p className="mt-1 text-xs text-slate-400">Transfer occurs after all conditions are met</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Occupational Rent (ZAR/month)</label>
          <input type="text" value={data.occupational_rent ?? ""} onChange={(e) => setData("occupational_rent", e.target.value)}
            placeholder="e.g. 12000 or 0 if concurrent"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          <p className="mt-1 text-xs text-slate-400">Payable if occupation date differs from transfer date</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Voetstoots Clause</label>
          <select value={data.voetstoots ?? ""} onChange={(e) => setData("voetstoots", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select…</option>
            <option>Accepted — property sold as is</option>
            <option>Not accepted — seller warrants condition</option>
            <option>Accepted with exceptions (listed in defect disclosure)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Special Conditions</label>
        <textarea rows={4} value={data.special_conditions ?? ""} onChange={(e) => setData("special_conditions", e.target.value)}
          placeholder="e.g. Subject to the buyer obtaining a satisfactory building inspection. Subject to the seller repairing the noted roof leak prior to transfer."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        <p className="mt-1 text-xs text-slate-400">Your conveyancer will review and formalise these conditions in the OTP.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Common conditions in South African OTPs</p>
        <ul className="space-y-1.5">
          {[
            "Subject to bond approval within 21–30 days",
            "Subject to a satisfactory building inspection report",
            "Subject to the sale of the buyer's existing property",
            "Subject to levy and rates clearance certificates being obtained",
            "Subject to the property being vacant on occupation date",
          ].map((c) => (
            <li key={c} className="text-xs text-slate-600 flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FixturesStep({ data, setData }: { data: Record<string, string>; setData: (k: string, v: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Fixtures, Fittings and Inclusions</h3>
        <p className="mb-4 text-sm text-slate-500">Be specific about what stays and what goes. This section prevents disputes at handover.</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Items Included in Sale Price</label>
          <textarea rows={4} value={data.included ?? ""} onChange={(e) => setData("included", e.target.value)}
            placeholder="e.g. Built-in stove and oven, dishwasher, curtain rails, built-in cupboards, solar panels and inverter, borehole pump and tank, garden shed."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Items Specifically Excluded</label>
          <textarea rows={3} value={data.excluded ?? ""} onChange={(e) => setData("excluded", e.target.value)}
            placeholder="e.g. Lounge curtains, portable air conditioner, outdoor braai/pizza oven, pot plants."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">What is typically a fixture in South African law</p>
        <p className="mb-2 text-xs text-slate-600">Fixtures are permanently attached to the property and transfer with it unless specifically excluded.</p>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {[
            "Built-in cupboards and shelving",
            "Curtain rails and blinds",
            "Light fittings (except pendant fittings)",
            "Built-in stove and hob",
            "Satellite dish and aerial",
            "Solar panels and inverter",
            "Pool equipment and pump",
            "Garden irrigation system",
          ].map((item) => (
            <p key={item} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#1e40af]" />
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function HandoverStep({ data }: { data: Record<string, string> }) {
  const HANDOVER_CHECKLIST = [
    { label: "Conveyancer appointed and briefed", done: false },
    { label: "Buyer has obtained bond pre-approval or proof of funds", done: false },
    { label: "OTP drafted by conveyancer and reviewed by both parties", done: false },
    { label: "Both parties have signed the OTP", done: false },
    { label: "Deposit paid into conveyancer trust account", done: false },
    { label: "Bond application submitted to bank(s)", done: false },
    { label: "Bond approval received within agreed deadline", done: false },
    { label: "FICA documents submitted (both parties)", done: false },
    { label: "Levy and rates clearance certificates ordered", done: false },
    { label: "Compliance certificates ordered and obtained", done: false },
    { label: "Final pre-transfer inspection completed", done: false },
    { label: "Transfer documents signed at conveyancer's office", done: false },
    { label: "Transfer duty paid to SARS", done: false },
    { label: "Property transferred at Deeds Office", done: false },
    { label: "Keys handed over to buyer", done: false },
  ];

  const [items, setItems] = useState(HANDOVER_CHECKLIST);

  const summary = [
    { label: "Buyer", value: data.buyer_full_name || "—" },
    { label: "Seller", value: data.seller_full_name || "—" },
    { label: "Purchase price", value: data.purchase_price ? `R${parseInt(data.purchase_price.replace(/\D/g, ""), 10).toLocaleString("en-ZA")}` : "—" },
    { label: "Deposit", value: data.deposit ? `R${parseInt(data.deposit.replace(/\D/g, ""), 10).toLocaleString("en-ZA")}` : "—" },
    { label: "Bond required", value: data.bond_required || "—" },
    { label: "Occupation date", value: data.occupation_date || "—" },
    { label: "Occupational rent", value: data.occupational_rent ? `R${data.occupational_rent}/month` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Attorney Handover Checklist</h3>
        <p className="mb-4 text-sm text-slate-500">Share this summary with your conveyancer. They will prepare the formal OTP and manage the transfer process.</p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Transaction Summary</p>
        <div className="space-y-2">
          {summary.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 shadow-sm">
              <p className="text-xs text-slate-500">{row.label}</p>
              <p className="text-sm font-semibold text-slate-900">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Handover checklist */}
      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">Transfer process checklist</p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <button key={i} onClick={() => setItems((prev) => prev.map((it, j) => j === i ? { ...it, done: !it.done } : it))}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                item.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/professionals"
          className="flex-1 rounded-xl bg-[#1e40af] px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-blue-800">
          Find a conveyancer
        </Link>
        <button
          onClick={() => {
            const lines = [
              "OTP PREPARATION SUMMARY — PropTrust",
              "",
              "PARTIES",
              ...summary.map((r) => `${r.label}: ${r.value}`),
              "",
              "TRANSFER PROCESS CHECKLIST",
              ...items.map((it, i) => `[${it.done ? "x" : " "}] ${i + 1}. ${it.label}`),
              "",
              "This document is a preparation aid only. All legal documents must be prepared and reviewed by a qualified conveyancer.",
            ].join("\n");
            const blob = new Blob([lines], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "otp-preparation-summary.txt"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Download summary
        </button>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs text-amber-800">
          <strong>Legal disclaimer:</strong> This tool is a preparation aid only. PropTrust does not give legal advice. The information entered here must be reviewed and formalised by a qualified South African conveyancer. An unsigned, informal offer is not legally binding.
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "parties", label: "Parties" },
  { id: "price", label: "Price" },
  { id: "conditions", label: "Conditions" },
  { id: "fixtures", label: "Fixtures" },
  { id: "handover", label: "Handover" },
];

export default function OfferToPurchasePage() {
  const [step, setStep] = useState<Step>("parties");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const idx = STEPS.findIndex((s) => s.id === step);

  function setField(k: string, v: string) {
    setFormData((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Buying Privately</p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Offer-to-Purchase Preparation
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Prepare all the information your conveyancer needs to draft a sound Offer to Purchase. This tool guides you through the key elements of a South African OTP.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-10">
        <div className="mx-auto max-w-4xl">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <StepIndicator current={step} steps={STEPS} />

            {step === "parties" && <PartiesStep data={formData} setData={setField} />}
            {step === "price" && <PriceStep data={formData} setData={setField} />}
            {step === "conditions" && <ConditionsStep data={formData} setData={setField} />}
            {step === "fixtures" && <FixturesStep data={formData} setData={setField} />}
            {step === "handover" && <HandoverStep data={formData} />}

            {/* Navigation */}
            <div className="mt-8 flex justify-between border-t border-slate-100 pt-5">
              <button
                onClick={() => setStep(STEPS[idx - 1].id)}
                disabled={idx === 0}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {idx < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(STEPS[idx + 1].id)}
                  className="rounded-xl bg-[#1e40af] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Next step
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
