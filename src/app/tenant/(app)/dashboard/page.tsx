import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import type { TenantProfile, PropertyListing } from "@/lib/types";
import {
  getFindingPlaceStatus,
  getLeaseStatus,
  getApplicationsStatus,
  getPaymentsStatus,
  getTrustScoreStatus,
} from "@/lib/tenant-dashboard/status";
import { DiscoverableToggle } from "./DiscoverableToggle";
import { JourneyNav } from "./JourneyNav";
import { PrimaryCard } from "./PrimaryCard";
import { ResumeSearchButton } from "./ResumeSearchButton";
import { DoorCard } from "./DoorCard";
import { ExploreRow } from "./ExploreRow";

export const dynamic = "force-dynamic";

export default async function TenantDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tp }, { data: profile }, { data: appsRaw }, { data: introRaw }, { data: rawProps }] =
    await Promise.all([
      supabase.from("tenant_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
      supabase
        .from("tenant_applications")
        .select("id, status")
        .eq("user_id", user.id),
      supabase
        .from("introduction_requests")
        .select("id, status")
        .eq("tenant_id", user.id),
      supabase
        .from("properties")
        .select("*")
        .in("status", ["available", "available_from"])
        .order("created_at", { ascending: false })
        .limit(50),
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

  // ── Onboarding / TrustScore state ──────────────────────────────────────────
  const prefsDone = tenantProfile.preferences_complete;
  const affordDone = tenantProfile.affordability_complete;
  const verStatus = tenantProfile.verification_status ?? "unverified";
  const isVerified = verStatus === "verified";
  const isDiscoverable = tenantProfile.discoverable ?? false;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const hasApplications = applications.length > 0 || introductions.length > 0;

  const readinessDone = [
    prefsDone && affordDone,
    isVerified,
    prefsDone,
    hasApplications,
  ].filter(Boolean).length;

  // ── Matched properties (count only) ─────────────────────────────────────────
  const matchCount = (() => {
    const props = (rawProps ?? []) as PropertyListing[];
    if (props.length === 0 || !prefsDone) return 0;
    const mapped = mapTenantProfile(tenantProfile as unknown as Record<string, unknown>);
    const propData = props.map((p) => mapProperty(p as unknown as Record<string, unknown>));
    const results = rank_properties_for_tenant_interests(propData, mapped);
    return results.filter((r) => r.status === "ranked").length;
  })();

  // ── Door statuses ────────────────────────────────────────────────────────────
  const findingPlaceStatus = getFindingPlaceStatus({
    discoverable: isDiscoverable,
    prefsComplete: prefsDone,
    matchCount,
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

  // ── Primary card: paused search > incomplete profile > pending application > default ──
  const profileNextAction = !prefsDone
    ? { label: "Complete your preferences", href: "/onboarding/preferences" }
    : !affordDone
      ? { label: "Add affordability details", href: "/onboarding/affordability" }
      : !isVerified
        ? { label: "Verify your identity", href: "/onboarding/verification" }
        : null;

  let primary: { eyebrow: string; title: string; body: string; action: ReactNode };
  if (!isDiscoverable) {
    primary = {
      eyebrow: "Finding a place",
      title: "Your search is paused",
      body: "Turn your search back on to start receiving matching properties again.",
      action: <ResumeSearchButton />,
    };
  } else if (profileNextAction) {
    primary = {
      eyebrow: "Your profile",
      title: profileNextAction.label,
      body: "A complete, verified profile helps landlords trust you faster.",
      action: (
        <Link
          href={profileNextAction.href}
          className="mt-4 inline-block min-h-[44px] rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Continue
        </Link>
      ),
    };
  } else if (activeApplicationCount > 0) {
    primary = {
      eyebrow: "Applications",
      title: "You have applications awaiting a response",
      body: "Check on the status of your applications and introductions.",
      action: (
        <Link
          href="/tenant/applications"
          className="mt-4 inline-block min-h-[44px] rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Review applications
        </Link>
      ),
    };
  } else {
    primary = {
      eyebrow: "Finding a place",
      title: "Browse your matches",
      body: "See properties matched to your budget and preferences.",
      action: (
        <Link
          href="/tenant/matches"
          className="mt-4 inline-block min-h-[44px] rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Browse matches
        </Link>
      ),
    };
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6 sm:py-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              Renting
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Hi {firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">Choose what you want to do next.</p>
          </div>
          <DiscoverableToggle initial={isDiscoverable} />
        </div>

        <JourneyNav hasActiveLease={hasActiveLease} />

        <PrimaryCard {...primary} />

        {/* ── Your rental ─────────────────────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your rental
          </h2>
          <div className="space-y-3">
            <DoorCard href="/tenant/matches" title="Finding a place" status={findingPlaceStatus} />
            <DoorCard href="/tenant/lease" title="Your lease" status={leaseStatus} />
            <DoorCard href="/tenant/applications" title="Applications" status={applicationsStatus} />
            <DoorCard href="/tenant/payments" title="Payments" status={paymentsStatus} />
          </div>
        </section>

        {/* ── Your profile ────────────────────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your profile
          </h2>
          <DoorCard href="/tenant/profile" title="TrustScore profile" status={trustScoreStatus} />
        </section>

        {/* ── Explore ──────────────────────────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Explore
          </h2>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            <ExploreRow
              title="Services"
              description="Cleaning, garden help, laundry and other local help."
              href="/services"
            />
            <ExploreRow
              title="Lease Review"
              description="Understand your lease before you sign."
              href="/xpello/tenant"
            />
            <ExploreRow
              title="Good Neighbour"
              description="Connect with people nearby and build your reputation."
              href="/neighbour"
            />
            <ExploreRow
              title="Match with people"
              description="Sharing, planning your next move, or connecting with other tenants."
              comingSoon
            />
            <ExploreRow
              title="Become a landlord"
              description="List a property, screen tenants and track payments."
              href="/settings"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
