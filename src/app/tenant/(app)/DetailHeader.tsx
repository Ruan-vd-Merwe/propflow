import Link from "next/link";
import { BackArrowIcon } from "./dashboard/icons";
import styles from "./dashboard/hub.module.css";

export function DetailHeader({
  title,
  backHref = "/tenant/dashboard",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <div className={styles.detailHeader}>
      <Link href={backHref} className={styles.backBtn} aria-label="Back to dashboard">
        <BackArrowIcon />
      </Link>
      <h1 className={styles.detailTitle}>{title}</h1>
    </div>
  );
}
