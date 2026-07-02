"use client";

import { useState } from "react";

export function LogMaintenanceButton({
  hasActiveLease,
}: {
  hasActiveLease: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  if (!hasActiveLease) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled
          className="min-h-[44px] cursor-not-allowed rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
        >
          Log a maintenance issue
        </button>
        <span className="max-w-[220px] text-right text-xs text-slate-400">
          Maintenance queries switch on once you are on a lease.
        </span>
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
        className="min-h-[44px] rounded-full bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        Log a maintenance issue
      </button>

      {success && !open && (
        <p className="mt-1 text-right text-xs font-medium text-blue-700">
          Submitted. Your landlord can see it now.
        </p>
      )}

      {open && (
        <div className="card absolute right-0 top-[calc(100%+8px)] z-20 w-80 p-4 shadow-lg">
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !title.trim() || !description.trim()}
                onClick={submit}
                className="btn-primary flex-1"
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
