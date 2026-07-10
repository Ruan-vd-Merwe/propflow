import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { TenantProfile } from "@/lib/types";
import {
  getSearchStatus,
  getSearchStripStatus,
  getLeaseStatus,
  getApplicationsStatus,
  getPaymentsStatus,
  getTrustScoreStatus,
  getRentalHistoryStatus,
} from "@/lib/tenant-dashboard/status";
import { DiscoverableToggle } from "./DiscoverableToggle";
import { JourneyNav } from "./JourneyNav";
import { StatusStrip } from "./StatusStrip";
import { ToolCard } from "./ToolCard";
import { ExploreRow } from "./ExploreRow";
import {
  SearchDotIcon,
  ApplicationsIcon,
  LeaseVaultIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  RentalHistoryIcon,
  LeaseReviewIcon,
  GoodNeighbourIcon,
  MatchCardsIcon,
  ServicesIcon,
  LandlordIcon,
} from "./icons";
import styles from "./hub.module.css";

export const dynamic = "force-dynamic";

export default async function TenantDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tp }, { data: profile }, { data: appsRaw }, { data: introRaw }] = await Promise.all([
    supabase.from("tenant_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
    supabase.from("tenant_applications").select("id, status").eq("user_id", user.id),
    supabase.from("introduction_requests").select("id, status").eq("tenant_id", user.id),
  ]);

  const tenantProfile = tp as TenantProfile | null;
  if (!tenantProfile) redirect("/onboarding/preferences");

  const applications = (appsRaw ?? []) as { id: string; status: string }[];
  const introductions = (introRaw ?? []) as { id: string; status: string }[];

  // The authenticated dashboard has no direct link to public.tenants (the
  // lease record). Match by email, the same bridge used elsewhere in the
  // tenant app, to see if this account has an active lease.
  let hasActiveLease = false;
  let leaseEnd: string | null = null;
  let nextObligation: { amountDueCents: number; dueDate: string; status: string } | null = null;

  if (profile?.email) {
    const today = new Date().toISOString().split("T")[0];
    const service = createServiceClient();
    const { data: activeTenant } = await service
      .from("tenants")
      .select("id, lease_end")
      .eq("email", profile.email)
      .or(`lease_end.is.null,lease_end.gte.${today}`)
      .limit(1)
      .maybeSingle();
    hasActiveLease = !!activeTenant;
    leaseEnd = activeTenant?.lease_end ?? null;

    if (activeTenant) {
      const { data: obligationsRaw } = await service
        .from("rent_obligations")
        .select("amount_due_cents, due_date, status")
        .eq("tenant_id", activeTenant.id)
        .order("due_date", { ascending: false });
      const obligations = obligationsRaw ?? [];
      const payable = obligations.filter((o) => o.status !== "paid" && o.status !== "waived");
      const upcoming = payable
        .filter((o) => o.due_date >= today)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
      const overdue = payable
        .filter((o) => o.due_date < today)
        .sort((a, b) => b.due_date.localeCompare(a.due_date));
      const chosen = upcoming[0] ?? overdue[0] ?? obligations[0] ?? null;
      nextObligation = chosen
        ? { amountDueCents: chosen.amount_due_cents, dueDate: chosen.due_date, status: chosen.status }
        : null;
    }
  }

  // ── Onboarding / TrustScore state ──────────────────────────────────────
  const prefsDone = tenantProfile.preferences_complete;
  const affordDone = tenantProfile.affordability_complete;
  const verStatus = tenantProfile.verification_status ?? "unverified";
  const isDiscoverable = tenantProfile.discoverable ?? false;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const hasApplications = applications.length > 0 || introductions.length > 0;
  const area = tenantProfile.looking_in_area ?? null;

  const readinessDone = [
    prefsDone && affordDone,
    verStatus === "verified",
    prefsDone,
    hasApplications,
  ].filter(Boolean).length;

  // ── Card statuses ────────────────────────────────────────────────────────
  const searchStatus = getSearchStatus({ discoverable: isDiscoverable, prefsComplete: prefsDone, area });
  const searchStripStatus = getSearchStripStatus({
    discoverable: isDiscoverable,
    prefsComplete: prefsDone,
    area,
  });
  const leaseStatus = getLeaseStatus({ hasLease: hasActiveLease, leaseEnd });
  const activeApplicationCount =
    applications.filter((a) => a.status === "pending").length +
    introductions.filter((i) => i.status === "pending").length;
  const applicationsStatus = getApplicationsStatus({ activeCount: activeApplicationCount });
  const paymentsStatus = getPaymentsStatus({ obligation: nextObligation });
  const trustScoreStatus = getTrustScoreStatus({
    doneCount: readinessDone,
    totalCount: 4,
    verificationStatus: verStatus,
  });
  // No rental history data source exists yet, so this stays empty for now.
  const rentalHistoryStatus = getRentalHistoryStatus({ count: 0 });

  return (
    <div className={styles.hub}>
      <main className={styles.main}>
        <div className={styles.headRow}>
          <div>
            <p className={styles.eyebrow}>Renting</p>
            <h1 className={styles.greet}>Hi {firstName}</h1>
          </div>
          <DiscoverableToggle initial={isDiscoverable} />
        </div>
        <p className={styles.subline}>Where are you at?</p>

        <JourneyNav hasActiveLease={hasActiveLease} />

        <StatusStrip status={searchStripStatus} />

        <p className={styles.dashHeading}>Your rental admin</p>
        <p className={styles.dashSubtext}>Search, apply, and keep the paperwork in one place.</p>

        <div className={styles.toolGrid}>
          <ToolCard
            href="/tenant/matches"
            title="Search preferences"
            status={searchStatus}
            icon={<SearchDotIcon />}
            iconTone={prefsDone ? "blue" : "gray"}
            isActive={prefsDone}
          />
          <ToolCard
            href="/tenant/applications"
            title="Applications"
            status={applicationsStatus}
            icon={<ApplicationsIcon />}
            iconTone="gray"
          />
          <ToolCard
            href="/tenant/lease"
            title="Lease vault"
            status={leaseStatus}
            icon={<LeaseVaultIcon />}
            iconTone={hasActiveLease ? "blue" : "amber"}
            needsAction={!hasActiveLease}
          />
          <ToolCard
            href="/tenant/payments"
            title="Payments"
            status={paymentsStatus}
            icon={<ReceiptIcon />}
            iconTone={paymentsStatus.status === "neutral" ? "gray" : "blue"}
          />
        </div>

        <p className={styles.sectionLabel}>Your profile</p>
        <div className={styles.toolGrid}>
          <ToolCard
            href="/tenant/profile"
            title="TrustScore profile"
            status={trustScoreStatus}
            icon={<ShieldCheckIcon />}
            iconTone="navy"
          />
          <ToolCard
            href="/tenant/rental-history"
            title="Rental history"
            status={rentalHistoryStatus}
            icon={<RentalHistoryIcon />}
            iconTone="gray"
          />
        </div>

        <p className={styles.sectionLabel}>Explore</p>
        <div className={styles.explore}>
          <ExploreRow
            title="Lease review"
            description="Understand a lease before you sign"
            href="/xpello/tenant"
            icon={<LeaseReviewIcon className={styles.exploreIcon} />}
          />
          <ExploreRow
            title="Good Neighbour"
            description="Build reputation where you live"
            href="/neighbour"
            icon={<GoodNeighbourIcon className={styles.exploreIcon} />}
          />
          <ExploreRow
            title="Match with people"
            description="Find a flatmate or replacement"
            comingSoon
            icon={<MatchCardsIcon className={styles.exploreIcon} />}
          />
          <ExploreRow
            title="Services"
            description="Get help with rental admin"
            href="/services"
            icon={<ServicesIcon className={styles.exploreIcon} />}
          />
          <ExploreRow
            title="Become a landlord"
            description="Switch to owner tools"
            href="/settings"
            icon={<LandlordIcon className={styles.exploreIcon} />}
          />
        </div>

        <p className={styles.note}>Tap a card to go deeper.</p>
      </main>
    </div>
  );
}
