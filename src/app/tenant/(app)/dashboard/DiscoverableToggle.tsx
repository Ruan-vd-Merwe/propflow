"use client";

import { useState } from "react";

export function DiscoverableToggle({ initial }: { initial: boolean }) {
  const [discoverable, setDiscoverable] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    const next = !discoverable;
    setDiscoverable(next); // optimistic
    setPending(true);
    setError(false);

    try {
      const res = await fetch("/api/tenant-profile/discoverable", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable: next }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setDiscoverable(!next); // rollback
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={pending}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          discoverable
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        } ${pending ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {discoverable ? "Actively looking" : "Paused"}
      </button>
      {!discoverable && (
        <span className="max-w-[180px] text-right text-xs leading-snug text-slate-400">
          Turn on your rental search to receive matching properties.
        </span>
      )}
      {error && (
        <span className="text-xs text-red-500">Update failed. Try again.</span>
      )}
    </div>
  );
}
