"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResumeSearchButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function resume() {
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/tenant-profile/discoverable", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable: true }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={resume}
        disabled={pending}
        className="mt-4 inline-block min-h-[44px] rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "Resuming…" : "Resume search"}
      </button>
      {error && <p className="mt-2 text-xs text-red-300">Update failed. Try again.</p>}
    </div>
  );
}
