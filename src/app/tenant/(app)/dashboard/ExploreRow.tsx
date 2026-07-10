import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./hub.module.css";
import { ChevronIcon } from "./icons";

type ExploreRowProps = {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  comingSoon?: boolean;
};

export function ExploreRow({ title, description, icon, href, comingSoon }: ExploreRowProps) {
  const content = (
    <>
      <div className={styles.exploreLabel}>
        {icon}
        <div className={styles.exploreText}>
          <p className={styles.exploreRowTitle}>{title}</p>
          <p className={styles.exploreRowSub}>{description}</p>
        </div>
      </div>
      {comingSoon ? (
        <span className={styles.exploreTag}>Soon</span>
      ) : (
        <ChevronIcon className={styles.chevron} />
      )}
    </>
  );

  if (comingSoon || !href) {
    return <div className={styles.exploreRow}>{content}</div>;
  }

  return (
    <Link href={href} className={styles.exploreRow}>
      {content}
    </Link>
  );
}
