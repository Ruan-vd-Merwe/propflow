"use client";

import { useState } from "react";
import { buildFlatmateShareUrl } from "@/lib/flatmate/service";
import type { FlatmateListing, FlatmateApplicant } from "@/lib/types";

const TRUST_LABEL: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified", cls: "bg-slate-100 text-slate-500" },
  pending: { label: "Pending review", cls: "bg-amber-100 text-amber-700" },
  verified: { label: "TrustScore verified", cls: "bg-blue-100 text-blue-700" },
  rejected: { label: "Review rejected", cls: "bg-red-100 text-red-700" },
};

function trustBadge(status: string | null) {
  return TRUST_LABEL[status ?? ""] ?? { label: "Not verified", cls: "bg-slate-100 text-slate-500" };
}

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FlatmateListingPanel({
  initialListing,
  initialApplicants,
}: {
  initialListing: FlatmateListing | null;
  initialApplicants: FlatmateApplicant[];
}) {
  const [listing, setListing] = useState(initialListing);
  const [applicants, setApplicants] = useState(initialApplicants);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Create-listing form state
  const [note, setNote] = useState("");
  const [rentPortionRand, setRentPortionRand] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const rentPortionCents = Math.round(Number(rentPortionRand) * 100);
    if (!rentPortionCents || rentPortionCents <= 0 || !moveInDate) {
      setError("Rent portion and move-in date are required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/flatmate/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note.trim() || undefined,
          rent_portion_cents: rentPortionCents,
          move_in_date: moveInDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create listing");
        return;
      }
      setListing(json.listing);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAction(applicantId: string, action: "approve" | "decline") {
    setActioningId(applicantId);
    setError(null);
    try {
      const res = await fetch(`/api/flatmate/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update applicant");
        return;
      }
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? json.applicant : a)),
      );
      if (json.listing) setListing(json.listing);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActioningId(null);
    }
  }

  function copyLink() {
    if (!listing) return;
    const url = buildFlatmateShareUrl(window.location.origin, listing.share_token);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">My Flatmate Listing</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Find a replacement or co-occupant. You approve applicants, not the
          landlord. The landlord is notified once you approve someone.
        </p>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {!listing ? (
        <div className="space-y-3">
          <textarea
            className="input-field w-full resize-none"
            rows={2}
            placeholder="Note for applicants (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-field"
              type="number"
              placeholder="Rent portion (R)"
              value={rentPortionRand}
              onChange={(e) => setRentPortionRand(e.target.value)}
            />
            <input
              className="input-field"
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>
          <button
            disabled={creating}
            onClick={handleCreate}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create listing"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Status
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 capitalize">
                {listing.status}
              </p>
            </div>
            {listing.status === "active" && (
              <button
                onClick={copyLink}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? "Copied!" : "Copy share link"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-400">Rent portion</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {fmtRand(listing.rent_portion_cents)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-400">Move in</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {fmtDate(listing.move_in_date)}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Applicants
              <span className="ml-1 font-normal normal-case text-slate-400">
                ({applicants.length})
              </span>
            </p>
            {applicants.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No applicants yet. Share your listing link.
              </p>
            ) : (
              <div className="space-y-2">
                {applicants.map((a) => {
                  const badge = trustBadge(a.trust_status_snapshot);
                  const acting = actioningId === a.id;
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border border-slate-100 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {a.full_name}
                          </p>
                          <p className="text-xs text-slate-500">{a.email}</p>
                          {a.phone && (
                            <p className="text-xs text-slate-500">{a.phone}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      {a.status === "pending" ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            disabled={acting}
                            onClick={() => handleAction(a.id, "approve")}
                            className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={acting}
                            onClick={() => handleAction(a.id, "decline")}
                            className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <p
                          className={`mt-2 text-xs font-medium capitalize ${
                            a.status === "approved" ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {a.status}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
