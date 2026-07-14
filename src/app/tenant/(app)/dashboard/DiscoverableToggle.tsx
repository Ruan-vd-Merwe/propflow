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
            ? "bg-[var(--blue-tint)] text-[var(--blue)] hover:opacity-80"
            : "bg-[var(--gray-tint)] text-[var(--text-muted)] hover:opacity-80"
        } ${pending ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {discoverable ? "Actively looking" : "Paused"}
      </button>
      {error && (
        <span className="text-xs text-red-500">Update failed. Try again.</span>
      )}
    </div>
  );
}
