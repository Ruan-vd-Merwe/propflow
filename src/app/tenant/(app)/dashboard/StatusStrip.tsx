import type { StripStatus } from "@/lib/tenant-dashboard/status";
import styles from "./hub.module.css";
import { ResumeSearchButton } from "./ResumeSearchButton";

export function StatusStrip({ status }: { status: StripStatus }) {
  if (!status) return null;
  const isPaused = status.level === "attention";
  return (
    <div className={styles.statusStrip}>
      <div className={styles.statusStripLeft}>
        <span
          className={`${styles.statusDot} ${isPaused ? styles.statusDotAmber : styles.statusDotBlue}`}
          aria-hidden="true"
        />
        <span className={styles.statusStripText}>{status.label}</span>
      </div>
      {isPaused && <ResumeSearchButton />}
    </div>
  );
}
