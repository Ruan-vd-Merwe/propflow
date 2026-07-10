"use client";

import { useState } from "react";
import styles from "./hub.module.css";

type Journey = "finding" | "current" | "flatmate";

const TABS: { id: Journey; label: string }[] = [
  { id: "finding", label: "Finding a place" },
  { id: "current", label: "Current rental" },
];

/**
 * Visual-only tab switcher. Default tab is derived from the tenant's real
 * journey context (an active lease implies "current rental"); tapping a pill
 * only changes which one looks active for now, the hub's content doesn't
 * change with it yet. Data wiring is a later phase.
 */
export function JourneyNav({ hasActiveLease }: { hasActiveLease: boolean }) {
  const [active, setActive] = useState<Journey>(hasActiveLease ? "current" : "finding");

  return (
    <div className={styles.switcher}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActive(tab.id)}
          aria-pressed={active === tab.id}
          className={`${styles.switchTab} ${active === tab.id ? styles.switchTabActive : ""}`}
        >
          {tab.label}
        </button>
      ))}
      {hasActiveLease ? (
        <button
          type="button"
          onClick={() => setActive("flatmate")}
          aria-pressed={active === "flatmate"}
          className={`${styles.switchTab} ${active === "flatmate" ? styles.switchTabActive : ""}`}
        >
          Replacing flatmate
        </button>
      ) : (
        <span className={`${styles.switchTab} ${styles.switchTabDisabled}`}>
          Replacing flatmate
          <span className={styles.switchTag}>Needs a lease</span>
        </span>
      )}
    </div>
  );
}
