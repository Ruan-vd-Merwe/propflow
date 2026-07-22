"use client";

import Link from "next/link";
import { useState } from "react";

export function LogMaintenanceButton({
  hasActiveLease,
  tenantEmail,
  tenantName,
}: {
  hasActiveLease: boolean;
  tenantEmail?: string;
  tenantName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyDetails, setPropertyDetails] = useState("");
  const [landlordDetails, setLandlordDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not submit. Try again.");
        return;
      }
      setSuccess(true);
      setTitle("");
      setDescription("");
      setOpen(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitUnlinkedIssue() {
    if (!title.trim() || !description.trim() || !propertyDetails.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tenantName?.trim() || tenantEmail || "PropTrust tenant",
          email: tenantEmail ?? "",
          subject: `Maintenance issue: ${title.trim()}`,
          message: [
            description.trim(),
            `Property details: ${propertyDetails.trim()}`,
            `Landlord or manager details: ${landlordDetails.trim() || "Not provided"}`,
          ].join("\n\n"),
          source: "tenant_maintenance_unlinked",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not submit. Try again.");
        return;
      }
      setSuccess(true);
      setTitle("");
      setDescription("");
      setPropertyDetails("");
      setLandlordDetails("");
      setOpen(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasActiveLease) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setSuccess(false);
          }}
          className="min-h-[44px] rounded-full border-2 border-[#1e40af] bg-transparent px-4 py-2 text-sm font-semibold text-[#1e40af] transition hover:bg-blue-50"
        >
          Log a maintenance issue
        </button>

        {success && !open && (
          <div className="mt-2 max-w-[260px] rounded-lg border border-blue-100 bg-blue-50 p-3 text-left text-xs text-blue-900">
            <p className="font-semibold">Issue sent to PropTrust.</p>
            <p className="mt-1 text-blue-800">
              Link your lease so future issues can go straight to your landlord.
            </p>
            <Link
              href="/contact?subject=Link%20my%20lease"
              className="mt-2 inline-flex font-semibold text-blue-700 hover:underline"
            >
              Ask to link my lease
            </Link>
          </div>
        )}

        {open && (
          <div
            className="card fixed inset-x-4 bottom-4 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto p-4 shadow-lg sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-96"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <p className="text-sm font-semibold text-slate-900">
              Log a maintenance issue
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Maintenance works best once your rental or lease is linked to PropTrust. You can still record the issue now, then we will guide you toward linking the lease.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Issue title
                </label>
                <input
                  className="input-field"
                  placeholder="Geyser leaking"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  What happened?
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="When did it start? Is anything urgent?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Property details
                </label>
                <input
                  className="input-field"
                  placeholder="Address, complex, unit, or suburb"
                  value={propertyDetails}
                  onChange={(e) => setPropertyDetails(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Landlord or manager details
                </label>
                <input
                  className="input-field"
                  placeholder="Name, phone, or email if you have it"
                  value={landlordDetails}
                  onChange={(e) => setLandlordDetails(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !title.trim() || !description.trim() || !propertyDetails.trim()}
                  onClick={submitUnlinkedIssue}
                  className="btn-primary min-h-[44px] flex-1"
                >
                  {submitting ? "Sending..." : "Send issue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setSuccess(false);
        }}
        className="min-h-[44px] rounded-full border-2 border-[#1e40af] bg-transparent px-4 py-2 text-sm font-semibold text-[#1e40af] transition hover:bg-blue-50"
      >
        Log a maintenance issue
      </button>

      {success && !open && (
        <p className="mt-1 text-right text-xs font-medium text-blue-700">
          Submitted. Your landlord can see it now.
        </p>
      )}

      {open && (
        <div
          className="card fixed inset-x-4 bottom-4 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto p-4 shadow-lg sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-80"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <p className="mb-3 text-sm font-semibold text-slate-900">
            Log a maintenance issue
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Title
              </label>
              <input
                className="input-field"
                placeholder="e.g. Geyser leaking under basin"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="When did it start? How bad is it?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !title.trim() || !description.trim()}
                onClick={submit}
                className="btn-primary min-h-[44px] flex-1"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
