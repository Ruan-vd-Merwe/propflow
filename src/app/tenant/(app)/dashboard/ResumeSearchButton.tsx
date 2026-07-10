"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./hub.module.css";

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
    <button
      type="button"
      onClick={resume}
      disabled={pending}
      className={styles.resumeBtn}
      aria-label={error ? "Update failed, tap to try again" : "Resume search"}
    >
      {pending ? "Resuming…" : error ? "Try again" : "Resume"}
    </button>
  );
}
