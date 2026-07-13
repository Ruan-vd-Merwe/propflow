"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BankTransactionRecord } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

// Must match the properties_property_type_check DB constraint exactly -
// "other" is not an allowed value there and would fail the insert.
const PROPERTY_TYPES = ["apartment","house","townhouse","room"] as const;
const BANKS = ["Nedbank","FNB","ABSA","Standard Bank","SA Home Loans","Other"];
const BOND_TERMS = [10,15,20,25,30];
const PAY_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

type Step = 1 | 2 | 3 | 4 | 5 | 6;

// ─── Step progress bar ────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Property",
  "Tenant",
  "Bond",
  "Levies",
  "Statements",
  "Review",
];

function StepBar({ current }: { current: Step }) {
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex min-w-max items-center justify-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const num = (i + 1) as Step;
          const done = num < current;
          const active = num === current;
          return (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div className={`mx-1.5 h-0.5 w-8 sm:w-12 ${done ? "bg-blue-700" : "bg-slate-200"}`} />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-blue-700 text-white"
                      : active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {done ? "✓" : num}
                </div>
                <span className={`hidden text-[10px] sm:block ${active ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function RandInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        min="0"
        className="input-field pl-7"
      />
    </div>
  );
}

function PctInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        min="0"
        max="100"
        step="0.01"
        className="input-field pr-7"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
    </div>
  );
}

// ─── Document upload widget ───────────────────────────────────────────────────

type UploadedDoc = { id: string; file_name: string; document_type: string };

function DocUpload({
  propertyId,
  documentType,
  label,
  hint,
  docs,
  onUploaded,
}: {
  propertyId: string | null;
  documentType: string;
  label: string;
  hint?: string;
  docs: UploadedDoc[];
  onUploaded: (doc: UploadedDoc) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!propertyId) {
      setError("Property must be created before uploading documents.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", documentType);
      fd.append("property_id", propertyId);

      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { id?: string; file_name?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded({ id: data.id!, file_name: data.file_name!, document_type: documentType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const myDocs = docs.filter((d) => d.document_type === documentType);

  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-4">
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      {myDocs.length > 0 && (
        <ul className="mb-2 space-y-1">
          {myDocs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs text-emerald-700">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {d.file_name}
            </li>
          ))}
        </ul>
      )}
      <label className={`cursor-pointer text-xs font-medium ${propertyId ? "text-blue-600 hover:text-blue-800" : "text-slate-400"}`}>
        {uploading ? "Uploading…" : myDocs.length > 0 ? "Upload another" : "Choose file"}
        <input type="file" className="hidden" disabled={uploading || !propertyId} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      </label>
      {!propertyId && <p className="mt-1 text-xs text-slate-400">Save property details first to enable uploads.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Rand formatting ──────────────────────────────────────────────────────────

function fmtRand(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function randToCents(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function AddPropertyFlow() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]           = useState<Step>(1);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // ── Step 1 — Property details ─────────────────────────────────────────────
  const [propName, setPropName]         = useState("");
  const [propAddress, setPropAddress]   = useState("");
  const [propType, setPropType]         = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [propNotes, setPropNotes]       = useState("");

  // ── Step 2 — Tenant & Lease ──────────────────────────────────────────────
  const [hasTenant, setHasTenant]       = useState(true);
  const [tenantName, setTenantName]     = useState("");
  const [tenantEmail, setTenantEmail]   = useState("");
  const [tenantPhone, setTenantPhone]   = useState("");
  const [monthlyRent, setMonthlyRent]   = useState("");
  const [deposit, setDeposit]           = useState("");
  const [leaseStart, setLeaseStart]     = useState("");
  const [leaseEnd, setLeaseEnd]         = useState("");
  const [payDay, setPayDay]             = useState("1");

  // ── Step 3 — Bond ────────────────────────────────────────────────────────
  const [hasBond, setHasBond]               = useState(false);
  const [bondBank, setBondBank]             = useState("Nedbank");
  const [bondRef, setBondRef]               = useState("");
  const [bondOriginal, setBondOriginal]     = useState("");
  const [bondBalance, setBondBalance]       = useState("");
  const [bondPayment, setBondPayment]       = useState("");
  const [bondRate, setBondRate]             = useState("");
  const [bondStart, setBondStart]           = useState("");
  const [bondTerm, setBondTerm]             = useState("20");

  // ── Step 4 — Levies, rates, insurance ────────────────────────────────────
  const [levy, setLevy]               = useState("");
  const [bcName, setBcName]           = useState("");
  const [bcBankDetails, setBcBankDetails] = useState("");
  const [rates, setRates]             = useState("");
  const [municipalRef, setMunicipalRef] = useState("");
  const [insurance, setInsurance]     = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [otherCosts, setOtherCosts]   = useState("");
  const [mgmtFee, setMgmtFee]         = useState("0");

  // ── Step 5 — Bank statement ───────────────────────────────────────────────
  const [parsedTx, setParsedTx]         = useState<BankTransactionRecord[]>([]);
  const [statementUploading, setStatementUploading] = useState(false);
  const [statementError, setStatementError] = useState<string | null>(null);
  const [statementSummary, setStatementSummary] = useState<string | null>(null);

  const TX_CATEGORIES = [
    "rental_income","bond_payment","levy_payment","rates_payment",
    "maintenance","insurance","management_fee","other_income","other_expense","uncategorised",
  ] as const;

  function updateTxCategory(id: string, cat: string) {
    setParsedTx((prev) => prev.map((t) => t.id === id ? { ...t, category: cat as BankTransactionRecord["category"] } : t));
  }

  async function handleStatementUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !propertyId) return;
    setStatementUploading(true);
    setStatementError(null);
    setStatementSummary(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("property_id", propertyId);
      const res = await fetch("/api/finance/parse-statement", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; inserted?: number; transactions?: BankTransactionRecord[] };
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      setParsedTx(data.transactions ?? []);
      setStatementSummary(`Extracted ${(data.transactions ?? []).length} transactions. Review categories below before continuing.`);
    } catch (err) {
      setStatementError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setStatementUploading(false);
      e.target.value = "";
    }
  }

  // ─── Step 1 submit — create property record ───────────────────────────────
  async function handleStep1() {
    if (!propName.trim() || !propAddress.trim()) {
      setError("Property name and address are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prop, error: propErr } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          name: propName.trim(),
          address: propAddress.trim(),
          property_type: propType || null,
          purchase_price_cents: purchasePrice ? randToCents(purchasePrice) : null,
          current_value_cents: currentValue ? randToCents(currentValue) : null,
        })
        .select("id")
        .single();

      if (propErr || !prop) throw new Error(propErr?.message ?? "Failed to create property");
      setPropertyId(prop.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  // ─── Step 6 — final save (tenant + financial details) ─────────────────────
  async function handleFinalSave() {
    if (!propertyId) return;
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Create tenant if entered
      let tenantId: string | null = null;
      if (hasTenant && tenantName.trim() && tenantEmail.trim() && monthlyRent && leaseStart) {
        const { data: tenant, error: tenantErr } = await supabase
          .from("tenants")
          .insert({
            property_id: propertyId,
            full_name: tenantName.trim(),
            email: tenantEmail.trim(),
            phone: tenantPhone.trim() || null,
            monthly_rent: randToCents(monthlyRent),
            lease_start: leaseStart,
            lease_end: leaseEnd || null,
          })
          .select("id")
          .single();
        if (tenantErr) throw new Error(tenantErr.message);
        tenantId = tenant?.id ?? null;

        // Create lease agreement if we have a tenant
        if (tenantId) {
          await supabase.from("lease_agreements").insert({
            property_id: propertyId,
            tenant_id: tenantId,
            landlord_id: user.id,
            lease_start: leaseStart,
            lease_end: leaseEnd || null,
            monthly_rent: randToCents(monthlyRent),
            deposit_amount: deposit ? randToCents(deposit) : null,
            payment_due_day: parseInt(payDay),
            notice_period_days: 30,
            pet_allowed: false,
            subletting_allowed: false,
            status: "draft",
            xpello_enrolled: false,
          });
        }
      }

      // Save financial details
      const financeBody: Record<string, unknown> = {
        property_id: propertyId,
        bond_bank: hasBond ? bondBank : null,
        bond_monthly_payment_cents: hasBond && bondPayment ? randToCents(bondPayment) : null,
        bond_original_amount_cents: hasBond && bondOriginal ? randToCents(bondOriginal) : null,
        bond_interest_rate_pct: hasBond && bondRate ? parseFloat(bondRate) : null,
        bond_start_date: hasBond && bondStart ? bondStart : null,
        bond_term_years: hasBond && bondTerm ? parseInt(bondTerm) : null,
        levy_monthly_cents: levy ? randToCents(levy) : null,
        rates_monthly_cents: rates ? randToCents(rates) : null,
        insurance_monthly_cents: insurance ? randToCents(insurance) : null,
        management_fee_pct: mgmtFee ? parseFloat(mgmtFee) : 0,
      };

      const res = await fetch("/api/portfolio/update-finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(financeBody),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to save financial details");
      }

      // Store notes in property if any
      if (propNotes.trim()) {
        await supabase.from("properties").update({ description: propNotes.trim() }).eq("id", propertyId);
      }

      router.push(`/portfolio/${propertyId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  function addDoc(doc: UploadedDoc) {
    setUploadedDocs((prev) => [...prev, doc]);
  }

  // ─── Computed values for review ───────────────────────────────────────────
  const rentCents      = randToCents(monthlyRent);
  const bondCents      = hasBond ? randToCents(bondPayment) : 0;
  const levyCents      = randToCents(levy);
  const ratesCents     = randToCents(rates);
  const insuranceCents = randToCents(insurance);
  const mgmtFeeCents   = Math.round((rentCents * (parseFloat(mgmtFee) || 0)) / 100);
  const totalExpenses  = bondCents + levyCents + ratesCents + insuranceCents + mgmtFeeCents;
  const netCashFlow    = rentCents - totalExpenses;
  const currentValCents = randToCents(currentValue);
  const grossYield     = currentValCents > 0 ? ((rentCents * 12) / currentValCents * 100).toFixed(1) + "%" : "—";
  const netYield       = currentValCents > 0 ? ((netCashFlow * 12) / currentValCents * 100).toFixed(1) + "%" : "—";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Add a property</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up your property, tenant, and financial details in one guided flow.
        </p>
      </div>

      <StepBar current={step} />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Property details                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Property Details</h2>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Property name" required>
                <input
                  value={propName}
                  onChange={(e) => setPropName(e.target.value)}
                  placeholder='e.g. "Unit 4B, Kloof Street"'
                  className="input-field"
                />
              </Field>
              <Field label="Property type">
                <select value={propType} onChange={(e) => setPropType(e.target.value)} className="input-field">
                  <option value="">Select…</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Full address" required>
              <input
                value={propAddress}
                onChange={(e) => setPropAddress(e.target.value)}
                placeholder="12 Kloof Street, Sea Point, Cape Town, 8005"
                className="input-field"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Purchase price" hint="Used to calculate capital gain and yield">
                <RandInput value={purchasePrice} onChange={setPurchasePrice} placeholder="2 500 000" />
              </Field>
              <Field label="Current estimated value" hint="Use recent comparable sales in your area">
                <RandInput value={currentValue} onChange={setCurrentValue} placeholder="3 000 000" />
              </Field>
            </div>

            <Field label="Notes" hint="Optional — any context about this property">
              <textarea
                value={propNotes}
                onChange={(e) => setPropNotes(e.target.value)}
                placeholder="e.g. Sectional title, unit 4B, 65m²..."
                rows={2}
                className="input-field resize-none"
              />
            </Field>

            {/* Document uploads */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Supporting documents (optional)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <DocUpload propertyId={propertyId} documentType="purchase_agreement" label="Purchase agreement" docs={uploadedDocs} onUploaded={addDoc} />
                <DocUpload propertyId={propertyId} documentType="title_deed" label="Title deed" docs={uploadedDocs} onUploaded={addDoc} />
                <DocUpload propertyId={propertyId} documentType="valuation_report" label="Valuation report" docs={uploadedDocs} onUploaded={addDoc} />
              </div>
              {!propertyId && (
                <p className="mt-2 text-xs text-slate-400">Documents can be uploaded after you save property details.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <a href="/portfolio" className="text-sm text-slate-500 hover:text-slate-700">Cancel</a>
            <button
              type="button"
              disabled={saving || !propName.trim() || !propAddress.trim()}
              onClick={handleStep1}
              className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save and continue →"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Tenant and Lease                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Tenant and Lease</h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hasTenant}
                onChange={(e) => setHasTenant(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700"
              />
              Property is occupied
            </label>
          </div>

          {hasTenant ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tenant full name" required>
                  <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Jane Smith" className="input-field" />
                </Field>
                <Field label="Tenant email" required>
                  <input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} placeholder="jane@example.com" className="input-field" />
                </Field>
                <Field label="Tenant phone">
                  <input type="tel" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} placeholder="082 555 1234" className="input-field" />
                </Field>
                <Field label="Monthly rent" required>
                  <RandInput value={monthlyRent} onChange={setMonthlyRent} placeholder="12 000" />
                </Field>
                <Field label="Deposit amount">
                  <RandInput value={deposit} onChange={setDeposit} placeholder="24 000" />
                </Field>
                <Field label="Payment due day">
                  <select value={payDay} onChange={(e) => setPayDay(e.target.value)} className="input-field">
                    {PAY_DAYS.map((d) => (
                      <option key={d} value={String(d)}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of month</option>
                    ))}
                  </select>
                </Field>
                <Field label="Lease start date" required>
                  <input type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} className="input-field" />
                </Field>
                <Field label="Lease end date" hint="Leave blank for month-to-month">
                  <input type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} className="input-field" />
                </Field>
              </div>

              {/* Occupancy status info */}
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                A lease agreement record will be created in draft status. You can finalise and send it from the Leases section.
              </div>

              {/* Document uploads */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tenant documents (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DocUpload propertyId={propertyId} documentType="signed_lease" label="Signed lease agreement" docs={uploadedDocs} onUploaded={addDoc} />
                  <DocUpload propertyId={propertyId} documentType="tenant_id" label="Tenant ID / documents" docs={uploadedDocs} onUploaded={addDoc} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-6 text-center">
              <p className="text-slate-500">This property is currently vacant.</p>
              <p className="mt-1 text-sm text-slate-400">You can add a tenant later from the property page.</p>
            </div>
          )}

          <NavButtons
            onBack={() => setStep(1)}
            onNext={() => { setError(null); setStep(3); }}
            nextDisabled={hasTenant && (!tenantName.trim() || !tenantEmail.trim() || !monthlyRent || !leaseStart)}
            nextLabel="Continue →"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — Bond / Home Loan                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Bond / Home Loan</h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={hasBond}
                onChange={(e) => setHasBond(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700"
              />
              Property has a bond
            </label>
          </div>

          {hasBond ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bond bank">
                  <select value={bondBank} onChange={(e) => setBondBank(e.target.value)} className="input-field">
                    {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Bond / account reference" hint="From your bond statement">
                  <input value={bondRef} onChange={(e) => setBondRef(e.target.value)} placeholder="NB12345678" className="input-field" />
                </Field>
                <Field label="Original bond amount">
                  <RandInput value={bondOriginal} onChange={setBondOriginal} placeholder="2 000 000" />
                </Field>
                <Field label="Current outstanding balance" hint="Mark as 'Needs review' if uncertain">
                  <RandInput value={bondBalance} onChange={setBondBalance} placeholder="1 750 000" />
                </Field>
                <Field label="Monthly repayment" required>
                  <RandInput value={bondPayment} onChange={setBondPayment} placeholder="18 500" />
                </Field>
                <Field label="Interest rate (% per year)">
                  <PctInput value={bondRate} onChange={setBondRate} placeholder="11.25" />
                </Field>
                <Field label="Bond start date">
                  <input type="date" value={bondStart} onChange={(e) => setBondStart(e.target.value)} className="input-field" />
                </Field>
                <Field label="Remaining term">
                  <select value={bondTerm} onChange={(e) => setBondTerm(e.target.value)} className="input-field">
                    {BOND_TERMS.map((t) => <option key={t} value={String(t)}>{t} years</option>)}
                  </select>
                </Field>
              </div>

              {/* Document uploads */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bond documents (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DocUpload propertyId={propertyId} documentType="bond_statement" label="Bond statement" hint="Most recent statement" docs={uploadedDocs} onUploaded={addDoc} />
                  <DocUpload propertyId={propertyId} documentType="home_loan_account" label="Home loan account statement" docs={uploadedDocs} onUploaded={addDoc} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-6 text-center">
              <p className="text-slate-500">No bond on this property.</p>
              <p className="mt-1 text-sm text-slate-400">You own this property outright or the bond has been paid off.</p>
            </div>
          )}

          <NavButtons onBack={() => setStep(2)} onNext={() => { setError(null); setStep(4); }} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 4 — Levies, rates and insurance                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Levies, Rates and Insurance</h2>
          <div className="space-y-6">
            {/* Body corporate levy */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Body Corporate / Levy</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monthly levy" hint="Enter 0 if no body corporate">
                  <RandInput value={levy} onChange={setLevy} placeholder="0" />
                </Field>
                <Field label="Body corporate / managing agent name">
                  <input value={bcName} onChange={(e) => setBcName(e.target.value)} placeholder="Sea Point Body Corporate" className="input-field" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Body corporate banking details" hint="For EFT payments">
                    <input value={bcBankDetails} onChange={(e) => setBcBankDetails(e.target.value)} placeholder="FNB · Acc 62012345678 · Branch 250655" className="input-field" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Municipal rates */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Municipal Rates</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monthly rates">
                  <RandInput value={rates} onChange={setRates} placeholder="0" />
                </Field>
                <Field label="Municipality account / reference">
                  <input value={municipalRef} onChange={(e) => setMunicipalRef(e.target.value)} placeholder="9876543210" className="input-field" />
                </Field>
              </div>
            </div>

            {/* Insurance */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Building Insurance</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monthly insurance premium">
                  <RandInput value={insurance} onChange={setInsurance} placeholder="0" />
                </Field>
                <Field label="Insurance provider">
                  <input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="Santam / Outsurance / etc." className="input-field" />
                </Field>
              </div>
            </div>

            {/* Other */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Management and Other Costs</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Management fee" hint="Enter 0 if self-managed">
                  <PctInput value={mgmtFee} onChange={setMgmtFee} placeholder="0" />
                </Field>
                <Field label="Other recurring monthly costs" hint="e.g. garden service, pool service">
                  <RandInput value={otherCosts} onChange={setOtherCosts} placeholder="0" />
                </Field>
              </div>
            </div>

            {/* Document uploads */}
            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Supporting documents (optional)
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DocUpload propertyId={propertyId} documentType="levy_statement" label="Levy statement" docs={uploadedDocs} onUploaded={addDoc} />
                <DocUpload propertyId={propertyId} documentType="rates_account" label="Rates and taxes account" docs={uploadedDocs} onUploaded={addDoc} />
                <DocUpload propertyId={propertyId} documentType="insurance_policy" label="Insurance policy" docs={uploadedDocs} onUploaded={addDoc} />
                <DocUpload propertyId={propertyId} documentType="body_corporate_statement" label="Body corporate statement" docs={uploadedDocs} onUploaded={addDoc} />
                <DocUpload propertyId={propertyId} documentType="management_invoice" label="Management company invoice" docs={uploadedDocs} onUploaded={addDoc} />
              </div>
            </div>
          </div>

          <NavButtons onBack={() => setStep(3)} onNext={() => { setError(null); setStep(5); }} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 5 — Bank statements                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Bank Statements</h2>
            <p className="mb-5 text-sm text-slate-500">
              Upload a Nedbank PDF bank statement to automatically extract and categorise transactions.
              Review the extracted categories before continuing.
            </p>

            {!propertyId ? (
              <p className="text-sm text-slate-400">Property must be saved first.</p>
            ) : (
              <div className="space-y-4">
                <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 transition hover:border-blue-400 ${statementUploading ? "opacity-50" : ""}`}>
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600">
                    {statementUploading ? "Parsing statement…" : "Choose Nedbank PDF statement"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={statementUploading}
                    onChange={handleStatementUpload}
                  />
                </label>

                {/* TODO: Additional bank support — currently only Nedbank PDF is supported.
                    Future: extend parse-statement API to detect bank from PDF metadata
                    and apply bank-specific parsing rules. */}
                <p className="text-xs text-slate-400">
                  Other banks coming soon. For now, Nedbank PDF statements work best.
                </p>
              </div>
            )}

            {statementError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {statementError}
              </p>
            )}
            {statementSummary && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {statementSummary}
              </p>
            )}
          </div>

          {/* Extracted transactions — review categories */}
          {parsedTx.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Review extracted transactions
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Adjust categories as needed. These have already been saved — this step lets you correct any misclassifications.
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-left">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-5 py-2 text-xs text-slate-500">
                          {new Date(tx.transaction_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-2">
                          <span className="block max-w-[180px] truncate text-slate-800">{tx.description}</span>
                        </td>
                        <td className={`px-4 py-2 text-right text-xs font-medium tabular-nums ${tx.transaction_type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                          {tx.transaction_type === "credit" ? "+" : "–"} {fmtRand(Math.abs(tx.amount_cents))}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={tx.category}
                            onChange={(e) => updateTxCategory(tx.id, e.target.value)}
                            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
                          >
                            {TX_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <NavButtons onBack={() => setStep(4)} onNext={() => { setError(null); setStep(6); }} nextLabel={parsedTx.length > 0 ? "Confirm and continue →" : "Skip for now →"} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 6 — Review and confirm                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Review and Confirm</h2>
            <p className="mb-5 text-sm text-slate-500">
              Check the summary below. Click Confirm to save all details.
            </p>

            {/* Property summary */}
            <Section title="Property">
              <Row label="Name" value={propName} />
              <Row label="Address" value={propAddress} />
              {propType && <Row label="Type" value={propType} />}
            </Section>

            {/* Tenant summary */}
            {hasTenant && tenantName && (
              <Section title="Tenant">
                <Row label="Name" value={tenantName} />
                <Row label="Email" value={tenantEmail} />
                <Row label="Rent" value={monthlyRent ? fmtRand(randToCents(monthlyRent)) : "—"} />
                <Row label="Lease" value={leaseStart ? `${leaseStart}${leaseEnd ? " → " + leaseEnd : " (month-to-month)"}` : "—"} />
              </Section>
            )}

            {/* Monthly cash flow */}
            <Section title="Monthly Cash Flow">
              <Row label="Rental income" value={rentCents > 0 ? fmtRand(rentCents) : "—"} />
              {bondCents > 0 && <Row label="Bond payment" value={`– ${fmtRand(bondCents)}`} />}
              {levyCents > 0 && <Row label="Body corp levy" value={`– ${fmtRand(levyCents)}`} />}
              {ratesCents > 0 && <Row label="Municipal rates" value={`– ${fmtRand(ratesCents)}`} />}
              {insuranceCents > 0 && <Row label="Insurance" value={`– ${fmtRand(insuranceCents)}`} />}
              {mgmtFeeCents > 0 && <Row label="Management fee" value={`– ${fmtRand(mgmtFeeCents)}`} />}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Net cash flow</span>
                <span className={netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {fmtRand(netCashFlow)}
                </span>
              </div>
              {currentValCents > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-400">Gross yield</p>
                    <p className="text-base font-bold text-slate-900">{grossYield}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-400">Net yield</p>
                    <p className="text-base font-bold text-slate-900">{netYield}</p>
                  </div>
                </div>
              )}
            </Section>

            {/* Documents */}
            {uploadedDocs.length > 0 && (
              <Section title="Uploaded documents">
                {uploadedDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{d.file_name}</span>
                    <span className="ml-1 text-xs text-slate-400">({d.document_type.replace(/_/g, " ")})</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Parsed transactions note */}
            {parsedTx.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {parsedTx.length} bank transactions have been imported and are ready to view in the Transactions tab.
              </div>
            )}
          </div>

          {/* Confirm buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleFinalSave}
              className="rounded-xl bg-blue-700 px-8 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Confirm and save property →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue →",
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Back
      </button>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}
