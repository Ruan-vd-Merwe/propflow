import Link from "next/link";
import type { ReactNode } from "react";
import type { DoorStatus } from "@/lib/tenant-dashboard/status";
import styles from "./hub.module.css";

const ICON_TONE_CLASS: Record<"blue" | "gray" | "amber" | "navy", string> = {
  blue: "",
  gray: styles.toolIconGray,
  amber: styles.toolIconAmber,
  navy: styles.toolIconNavy,
};

const PILL_CLASS: Record<DoorStatus["status"], string> = {
  active: styles.statusPillBlue,
  attention: styles.statusPillAmber,
  neutral: "",
};

export function ToolCard({
  href,
  title,
  status,
  icon,
  iconTone = "blue",
  isActive = false,
  needsAction = false,
}: {
  href: string;
  title: string;
  status: DoorStatus;
  icon: ReactNode;
  iconTone?: "blue" | "gray" | "amber" | "navy";
  isActive?: boolean;
  needsAction?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[styles.tool, isActive ? styles.toolIsActive : "", needsAction ? styles.toolNeedsAction : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={[styles.toolIcon, ICON_TONE_CLASS[iconTone]].filter(Boolean).join(" ")}>{icon}</div>
      <div>
        <p className={styles.toolTitle}>{title}</p>
        <span className={[styles.statusPill, PILL_CLASS[status.status]].filter(Boolean).join(" ")}>
          {status.label}
        </span>
      </div>
    </Link>
  );
}
