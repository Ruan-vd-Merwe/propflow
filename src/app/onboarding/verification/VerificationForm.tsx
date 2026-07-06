"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { consumeFlatmateReturnToken } from "@/lib/flatmate/return-continuation";
import type { VerificationDocType } from "@/lib/types";

const DOC_TYPES: { type: VerificationDocType; label: string; description: string }[] = [
  { type: "id_document", label: "ID document", description: "SA ID card or passport" },
  { type: "payslip", label: "Payslip", description: "Most recent payslip" },
  { type: "bank_statement", label: "Bank statement", description: "Last 3 months" },
  { type: "proof_of_address", label: "Proof of address", description: "Utility bill or statement" },
];

interface VerificationFormProps {
  userId: string;
  currentStatus: string;
}

export function VerificationForm({ userId, currentStatus }: VerificationFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [saIdNumber, setSaIdNumber] = useState("");
  const [files, setFiles] = useState<Record<VerificationDocType, File | null>>({
    payslip: null,
    bank_statement: null,
    proof_of_address: null,
    id_document: null,
  });
  const [creditConsent, setCreditConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /**
   * If the visitor arrived here from a Flatmate Finder apply page with no
   * TrustScore on file, send them back to that listing instead of the
   * normal dashboard/profile destination.
   */
  function goNext(fallback: string) {
    const returnToken = consumeFlatmateReturnToken();
    router.push(returnToken ? `/flatmate/${returnToken}` : fallback);
  }

  function handleFileChange(docType: VerificationDocType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFiles((prev) => ({ ...prev, [docType]: file }));
  }

  async function handleSubmit() {
    const hasAnyInput = saIdNumber.trim() || Object.values(files).some(Boolean) || creditConsent;
    if (!hasAnyInput) {
      goNext("/tenant/profile");
      return;
    }

    setLoading(true);
    setError(null);

    // Save SA ID to tenant_sensitive (private vault)
    if (saIdNumber.trim()) {
      const { error: sensitiveErr } = await supabase
        .from("tenant_sensitive")
        .upsert(
          { user_id: userId, sa_id_number: saIdNumber.trim(), updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (sensitiveErr) {
        console.error("[verification] tenant_sensitive upsert failed:", sensitiveErr);
      }
    }

    // Upload documents
    const uploadedDocs = Object.entries(files).filter(
      (entry): entry is [VerificationDocType, File] => entry[1] !== null,
    );

    for (const [docType, file] of uploadedDocs) {
      const storagePath = `${userId}/${docType}_${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("tenant-verification")
        .upload(storagePath, file);

      if (uploadErr) {
        setError(`Failed to upload ${docType}: ${uploadErr.message}`);
        setLoading(false);
        return;
      }

      const { error: docErr } = await supabase
        .from("tenant_verification_documents")
        .insert({
          tenant_id: userId,
          doc_type: docType,
          storage_path: storagePath,
          status: "uploaded",
        });

      if (docErr) {
        console.error(`[verification] doc insert failed for ${docType}:`, docErr);
      }
    }

    // Credit consent (standalone — does NOT trigger a credit check)
    if (creditConsent) {
      const { error: consentErr } = await supabase
        .from("tenant_consents")
        .insert({
          tenant_id: userId,
          consent_type: "credit",
          consent_text_version: "v1-2026-06",
        });
      if (consentErr) {
        console.error("[verification] credit consent insert failed:", consentErr);
      }
    }

    // Set verification_status = pending if any documents were uploaded
    if (uploadedDocs.length > 0) {
      await supabase
        .from("tenant_profiles")
        .update({
          verification_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    setSubmittedForReview(uploadedDocs.length > 0);
    if (uploadedDocs.length === 0) {
      goNext("/tenant/profile");
    }
  }

  if ((submittedForReview || currentStatus === "pending") && !showForm) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <svg className="h-7 w-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Verification pending</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your documents are being checked for affordability and profile verification. Reviews usually finish within 24-48 hours.
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="text-sm font-semibold text-slate-900">What happens next</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>Your profile stays active while the review is in progress.</li>
            <li>PropTrust checks the uploaded files against your affordability and profile details.</li>
            <li>Your TrustScore status updates on your dashboard when the review is complete.</li>
          </ul>
        </div>
        <div
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            type="button"
            onClick={() => goNext("/tenant/dashboard")}
            className="btn-primary min-h-[44px] flex-1"
          >
            Return to dashboard
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Upload another document
          </button>
        </div>
      </div>
    );
  }

  if (currentStatus === "verified") {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <svg className="h-7 w-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Your TrustScore is verified
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your profile is verified. Landlords can see your trusted status.
        </p>
        <button
          type="button"
          onClick={() => goNext("/tenant/dashboard")}
          className="btn-primary mt-6 min-h-[44px]"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  // Intro screen — before showing the form
  if (!showForm) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
          <svg className="h-7 w-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          TrustScore Verification
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload your ID and income documents once. Our team reviews them
          privately — landlords see only your verified status, never the
          documents themselves.
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          {[
            "Higher ranking in landlord searches",
            "Faster application approvals",
            "Better property recommendations",
            "No repeated paperwork per application",
          ].map((benefit) => (
            <div
              key={benefit}
              className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <span className="mt-0.5 text-green-600">&#10003;</span>
              <span className="text-sm text-slate-700">{benefit}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          After uploading, our team reviews your documents within 1–2 business
          days. Verification is optional — you can complete it later from your
          profile.
        </p>

        <div
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary flex-1"
          >
            Build your TrustScore
          </button>
          <button
            type="button"
            onClick={() => goNext("/tenant/profile")}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Full verification form
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">
          TrustScore Verification
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Upload documents to verify your profile. All documents are stored
          securely and are never shared with landlords.
        </p>

        <div className="space-y-5">
          {/* SA ID Number */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              SA ID number <span className="text-slate-400">(optional)</span>
            </label>
            <input
              className="input-field font-mono"
              placeholder="0000000000000"
              maxLength={13}
              value={saIdNumber}
              onChange={(e) => setSaIdNumber(e.target.value.replace(/\D/g, ""))}
            />
            <p className="mt-1 text-xs text-slate-400">
              Stored in your private vault. Landlords never see this.
            </p>
          </div>

          {/* Document uploads */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Upload documents <span className="text-slate-400">(optional)</span>
            </p>
            <div className="space-y-3">
              {DOC_TYPES.map(({ type, label, description }) => (
                <div
                  key={type}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {label}
                    </p>
                    <p className="text-xs text-slate-400">{description}</p>
                    {files[type] && (
                      <p className="mt-1 truncate text-xs font-medium text-blue-600">
                        {files[type]!.name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRefs.current[type]?.click()}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      files[type]
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {files[type] ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[type] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(type, e)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Credit consent — standalone */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={creditConsent}
                onChange={(e) => setCreditConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-700"
              />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Credit check consent
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  I consent to PropTrust requesting a credit check on my behalf
                  when this service becomes available. This consent is optional
                  and can be withdrawn at any time.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  No credit check will be performed until the service is
                  activated. You will be notified before any check is made.
                </p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <div
          className="mt-6 flex flex-col-reverse gap-3 sm:flex-row"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Back
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="btn-primary min-h-[44px] flex-[2]"
          >
            {loading ? "Uploading..." : "Submit verification"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goNext("/tenant/profile")}
        className="w-full text-center text-sm font-medium text-slate-400 hover:text-slate-600"
      >
        Skip for now — go to dashboard
      </button>
    </div>
  );
}
