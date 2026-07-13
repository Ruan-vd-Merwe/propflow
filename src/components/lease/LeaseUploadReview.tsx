"use client";

import { useState } from "react";
import type { LeaseExtractedFields, LeaseExtraction } from "@/lib/types";

const EMPTY_FIELDS: LeaseExtractedFields = {
  tenant_name: null,
  landlord_name: null,
  property_address: null,
  monthly_rent_cents: null,
  deposit_amount_cents: null,
  lease_start: null,
  lease_end: null,
  payment_due_day: null,
  escalation_pct: null,
  escalation_date: null,
};

type PropertyOption = { id: string; name: string; address: string };

type Phase = "upload" | "reviewing" | "confirmed";

export function LeaseUploadReview({
  role,
  properties,
  fixedPropertyId,
  onComplete,
  onSkip,
}: {
  role: "landlord" | "tenant";
  properties?: PropertyOption[];
  fixedPropertyId?: string;
  onComplete: (result: { extractionId: string; confirmed: boolean }) => void;
  onSkip?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [propertyId, setPropertyId] = useState(fixedPropertyId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extraction, setExtraction] = useState<LeaseExtraction | null>(null);
  const [extractionFailureReason, setExtractionFailureReason] = useState<
    "service_error" | "parse_error" | null
  >(null);
  const [fields, setFields] = useState<LeaseExtractedFields>(EMPTY_FIELDS);
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [confirming, setConfirming] = useState(false);

  const needsPropertyPicker = role === "landlord" && !fixedPropertyId;

  function setField<K extends keyof LeaseExtractedFields>(
    key: K,
    value: LeaseExtractedFields[K],
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleExtract() {
    if (!file) {
      setError("Choose a lease document to upload");
      return;
    }
    if (role === "landlord" && !propertyId) {
      setError("Choose which property this lease belongs to");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("uploaded_by_role", role);
      if (role === "landlord") form.append("property_id", propertyId);

      const res = await fetch("/api/lease/extract", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to extract lease");
        return;
      }
      const result = json.extraction as LeaseExtraction;
      setExtraction(result);
      setExtractionFailureReason(
        (json.failure_reason as "service_error" | "parse_error" | null) ?? null,
      );
      setFields({ ...EMPTY_FIELDS, ...(result.extracted_fields ?? {}) });
      setPhase("reviewing");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm() {
    if (!extraction) return;
    if (role === "landlord" && !tenantEmail.trim()) {
      setError("Tenant email is required");
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const endpoint =
        role === "landlord"
          ? `/api/lease/extractions/${extraction.id}/confirm-landlord`
          : `/api/lease/extractions/${extraction.id}/confirm-tenant`;
      const body =
        role === "landlord"
          ? {
              tenant_email: tenantEmail.trim(),
              tenant_phone: tenantPhone.trim() || undefined,
              fields,
            }
          : { fields };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to confirm lease");
        return;
      }
      setPhase("confirmed");
      onComplete({ extractionId: extraction.id, confirmed: true });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  if (phase === "confirmed") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-800">
          Lease confirmed
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          {role === "landlord"
            ? "This lease now appears on your Leases page and rent tracking has started."
            : "Your lease details have been saved to your account."}
        </p>
      </div>
    );
  }

  if (phase === "upload") {
    return (
      <div className="space-y-4">
        {needsPropertyPicker && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Property
            </label>
            <select
              className="input-field"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              <option value="">Select a property...</option>
              {(properties ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Signed lease document (PDF)
          </label>
          <input
            type="file"
            accept="application/pdf"
            className="input-field"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            disabled={uploading}
            onClick={handleExtract}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {uploading ? "Extracting..." : "Upload and extract"}
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    );
  }

  // phase === "reviewing"
  return (
    <div className="space-y-4">
      {extraction?.status === "failed" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {extractionFailureReason === "service_error"
            ? "The document reader is unavailable right now, so this could not be auto filled. Fill in the details below manually - this is a service issue, not a problem with your file."
            : "The document could not be read automatically. Please fill in the details below manually."}
        </p>
      )}

      <ReviewField
        label="Tenant name"
        value={fields.tenant_name}
        onChange={(v) => setField("tenant_name", v)}
        required
      />

      {role === "landlord" && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tenant email <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field"
              type="email"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tenant phone (optional)
            </label>
            <input
              className="input-field"
              value={tenantPhone}
              onChange={(e) => setTenantPhone(e.target.value)}
            />
          </div>
        </>
      )}

      <ReviewField
        label="Landlord name"
        value={fields.landlord_name}
        onChange={(v) => setField("landlord_name", v)}
      />
      <ReviewField
        label="Property address"
        value={fields.property_address}
        onChange={(v) => setField("property_address", v)}
      />
      <ReviewMoneyField
        label="Monthly rent"
        cents={fields.monthly_rent_cents}
        onChange={(v) => setField("monthly_rent_cents", v)}
        required
      />
      <ReviewMoneyField
        label="Deposit amount"
        cents={fields.deposit_amount_cents}
        onChange={(v) => setField("deposit_amount_cents", v)}
      />
      <ReviewDateField
        label="Lease start"
        value={fields.lease_start}
        onChange={(v) => setField("lease_start", v)}
        required
      />
      <ReviewDateField
        label="Lease end"
        value={fields.lease_end}
        onChange={(v) => setField("lease_end", v)}
      />
      <ReviewNumberField
        label="Rent due day of month"
        value={fields.payment_due_day}
        onChange={(v) => setField("payment_due_day", v)}
      />
      <ReviewNumberField
        label="Annual escalation percent"
        value={fields.escalation_pct}
        onChange={(v) => setField("escalation_pct", v)}
      />
      <ReviewDateField
        label="Escalation date"
        value={fields.escalation_date}
        onChange={(v) => setField("escalation_date", v)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={confirming}
        onClick={handleConfirm}
        className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {confirming ? "Confirming..." : "Confirm lease"}
      </button>
    </div>
  );
}

function fieldLabel(label: string, value: unknown, required?: boolean) {
  if (value === null || value === undefined || value === "") {
    return `${label} (not found in lease, please enter)${required ? " *" : ""}`;
  }
  return `${label}${required ? " *" : ""}`;
}

function ReviewField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {fieldLabel(label, value, required)}
      </label>
      <input
        className="input-field"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </div>
  );
}

function ReviewDateField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {fieldLabel(label, value, required)}
      </label>
      <input
        type="date"
        className="input-field"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </div>
  );
}

function ReviewNumberField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {fieldLabel(label, value, required)}
      </label>
      <input
        type="number"
        className="input-field"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );
}

function ReviewMoneyField({
  label,
  cents,
  onChange,
  required,
}: {
  label: string;
  cents: number | null;
  onChange: (v: number | null) => void;
  required?: boolean;
}) {
  const rand = cents != null ? cents / 100 : "";
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {fieldLabel(`${label} (R)`, cents, required)}
      </label>
      <input
        type="number"
        className="input-field"
        value={rand}
        onChange={(e) =>
          onChange(e.target.value ? Math.round(Number(e.target.value) * 100) : null)
        }
      />
    </div>
  );
}
