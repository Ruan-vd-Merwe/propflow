"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeaseUploadReview } from "@/components/lease/LeaseUploadReview";
import type { LeaseExtraction } from "@/lib/types";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Processing", cls: "bg-amber-100 text-amber-700" },
  extracted: { label: "Ready for review", cls: "bg-blue-100 text-blue-700" },
  failed: { label: "Could not read automatically", cls: "bg-slate-100 text-slate-500" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LeaseUploadSection({
  initialExtractions: extractions,
}: {
  initialExtractions: LeaseExtraction[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          My Lease Document
        </h2>
      </div>

      <div className="card overflow-hidden">
        {extractions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-500">
              Upload your lease to keep a copy of the key details on your
              PropTrust account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {extractions.map((ext) => {
              const s = STATUS_LABEL[ext.status] ?? {
                label: ext.status,
                cls: "bg-slate-100 text-slate-500",
              };
              return (
                <div
                  key={ext.id}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {ext.original_filename}
                    </p>
                    <p className="text-xs text-slate-400">
                      {fmtDate(ext.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                  >
                    {ext.confirmed ? "Saved" : s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="border-t border-slate-100 p-5">
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Upload my lease
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Upload my lease
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <LeaseUploadReview
              role="tenant"
              onComplete={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
