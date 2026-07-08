import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import type {
  TenantProfile,
  PropertyListing,
  RentObligation,
  PaymentAttempt,
  FlatmateListing,
  FlatmateApplicant,
} from "@/lib/types";
import { DiscoverableToggle } from "./DiscoverableToggle";
import { RentPaymentCard } from "./RentPaymentCard";
import { FlatmateListingPanel } from "./FlatmateListingPanel";
import { RentingStatusSection } from "./RentingStatusSection";
import { CurrentHomeCard } from "./CurrentHomeCard";
import { GoodNeighbourActions } from "./GoodNeighbourActions";
import { MatchWithPeople } from "./MatchWithPeople";
import { LeaseReviewCard } from "@/components/xpello/LeaseReviewCard";

export const dynamic = "force-dynamic";

// ── Local types for joined rows ───────────────────────────────────────────────

type AppRow = {
  id: string;
  property_id: string;
  status: string;
  created_at: string;
  properties: { name: string; suburb: string | null } | null;
};

type IntroRow = {
  id: string;
  landlord_id: string;
  property_id: string;
  status: string;
  created_at: string;
  properties: { name: string; suburb: string | null } | null;
};

// ── Display maps ──────────────────────────────────────────────────────────────

const VERIFICATION_BADGE: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified",       cls: "bg-slate-100 text-slate-500"  },
  pending:    { label: "Pending review",   cls: "bg-amber-100 text-amber-700"  },
  verified:   { label: "TrustScore verified", cls: "bg-green-100 text-green-700"  },
  rejected:   { label: "Review rejected",  cls: "bg-red-100 text-red-700"     },
};

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Under review",  cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved",      cls: "bg-green-100 text-green-700" },
  rejected: { label: "Not approved",  cls: "bg-red-100 text-red-700"    },
};

const INTRO_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Awaiting your response", cls: "bg-amber-100 text-amber-700" },
  accepted: { label: "Connected",              cls: "bg-green-100 text-green-700" },
  declined: { label: "Declined",               cls: "bg-slate-100 text-slate-500" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TenantDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: tp },
    { data: profile },
    { data: appsRaw },
    { data: introRaw },
    { data: rawProps },
    ,
    ,
  ] = await Promise.all([
    supabase.from("tenant_profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tenant_applications")
      .select("id, property_id, status, created_at, properties(name, suburb)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("introduction_requests")
      .select("id, landlord_id, property_id, status, created_at, properties(name, suburb)")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("properties")
      .select("*")
      .in("status", ["available", "available_from"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("service_providers")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("neighbour_profiles")
      .select("id, is_active")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // The authenticated dashboard has no direct link to public.tenants (the
  // lease record). Match by email, the same bridge used by
  // /api/tenant/maintenance, to see if this account has an active lease.
  let hasActiveLease = false;
  let rentToken: string | null = null;
  let nextObligationForCard:
    | (RentObligation & { latest_attempt: PaymentAttempt | null })
    | null = null;
  let flatmateListing: FlatmateListing | null = null;
  let flatmateApplicants: FlatmateApplicant[] = [];
  let currentLease: {
    lease_start: string | null;
    lease_end: string | null;
    monthly_rent: number | null;
    deposit_amount: number | null;
    notice_period_days: number | null;
    pet_allowed: boolean | null;
    subletting_allowed: boolean | null;
  } | null = null;

  if (profile?.email) {
    const today = new Date().toISOString().split("T")[0];
    const service = createServiceClient();
    const { data: activeTenant } = await service
      .from("tenants")
      .select(
        "id, portal_token, access_token, property_id, lease_start, lease_end, monthly_rent",
      )
      .eq("email", profile.email)
      .or(`lease_end.is.null,lease_end.gte.${today}`)
      .limit(1)
      .maybeSingle();
    hasActiveLease = !!activeTenant;

    if (activeTenant) {
      rentToken = activeTenant.portal_token ?? activeTenant.access_token;

      // lease_agreements RLS only grants the landlord (auth.uid() =
      // landlord_id) read access, so this needs the same service client
      // already used above for the email-bridged tenants lookup.
      const { data: leaseAgreement } = await service
        .from("lease_agreements")
        .select("deposit_amount, notice_period_days, pet_allowed, subletting_allowed")
        .eq("tenant_id", activeTenant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      currentLease = {
        lease_start: activeTenant.lease_start,
        lease_end: activeTenant.lease_end,
        monthly_rent: activeTenant.monthly_rent,
        deposit_amount: leaseAgreement?.deposit_amount ?? null,
        notice_period_days: leaseAgreement?.notice_period_days ?? null,
        pet_allowed: leaseAgreement?.pet_allowed ?? null,
        subletting_allowed: leaseAgreement?.subletting_allowed ?? null,
      };

      const { data: obligationsRaw } = await service
        .from("rent_obligations")
        .select("*")
        .eq("tenant_id", activeTenant.id)
        .order("due_date", { ascending: false });
      const obligations: RentObligation[] = (obligationsRaw ?? []) as RentObligation[];
      const obligationIds = obligations.map((o) => o.id);

      const { data: attemptsRaw } = obligationIds.length
        ? await service
            .from("payment_attempts")
            .select("*")
            .in("obligation_id", obligationIds)
            .order("created_at", { ascending: false })
        : { data: [] };
      const attempts: PaymentAttempt[] = (attemptsRaw ?? []) as PaymentAttempt[];
      const latestAttemptByObligation = new Map<string, PaymentAttempt>();
      for (const a of attempts) {
        if (!latestAttemptByObligation.has(a.obligation_id)) {
          latestAttemptByObligation.set(a.obligation_id, a);
        }
      }

      // Soonest upcoming payable obligation, falling back to the most
      // recently overdue one — same rule as the tenant portal token page.
      const payable = obligations.filter(
        (o) => o.status !== "paid" && o.status !== "waived",
      );
      const upcoming = payable
        .filter((o) => o.due_date >= today)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
      const overdue = payable
        .filter((o) => o.due_date < today)
        .sort((a, b) => b.due_date.localeCompare(a.due_date));
      const chosen = upcoming[0] ?? overdue[0] ?? null;

      nextObligationForCard = chosen
        ? { ...chosen, latest_attempt: latestAttemptByObligation.get(chosen.id) ?? null }
        : null;

      // Session-scoped client here, not the service client: RLS on
      // flatmate_listings already resolves ownership via the same email
      // bridge, so this naturally scopes to this tenant's own listing.
      const { data: listingRaw, error: listingErr } = await supabase
        .from("flatmate_listings")
        .select("*")
        .eq("created_by_tenant_id", activeTenant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (listingErr) {
        console.error("[tenant dashboard] flatmate_listings lookup failed:", listingErr.message);
      }
      flatmateListing = (listingRaw as FlatmateListing | null) ?? null;

      if (flatmateListing) {
        const { data: applicantsRaw, error: applicantsErr } = await supabase
          .from("flatmate_applicants")
          .select("*")
          .eq("listing_id", flatmateListing.id)
          .order("created_at", { ascending: false });
        if (applicantsErr) {
          console.error("[tenant dashboard] flatmate_applicants lookup failed:", applicantsErr.message);
        }
        flatmateApplicants = (applicantsRaw as FlatmateApplicant[]) ?? [];
      }
    }
  }

  const tenantProfile = tp as TenantProfile | null;
  if (!tenantProfile) redirect("/onboarding/preferences");

  const applications = (appsRaw ?? []) as unknown as AppRow[];
  const introductions = (introRaw ?? []) as unknown as IntroRow[];

  // ── Onboarding state ────────────────────────────────────────────────────────
  const prefsDone   = tenantProfile.preferences_complete;
  const affordDone  = tenantProfile.affordability_complete;
  const verStatus   = tenantProfile.verification_status ?? "unverified";
  const isLooking   = tenantProfile.discoverable ?? false;
  const firstName   = profile?.full_name?.split(" ")[0] ?? "there";
  const hasAnyIncomplete = !prefsDone || !affordDone;
  const hasApplications = applications.length > 0;
  const isVerified = verStatus === "verified";
  const verBadge = VERIFICATION_BADGE[verStatus] ?? VERIFICATION_BADGE.unverified;

  type ReadinessItem = {
    label: string;
    done: boolean;
    badge?: { label: string; cls: string };
  };
  const readinessItems: ReadinessItem[] = [
    { label: "Profile details", done: prefsDone && affordDone },
    { label: "Identity verification", done: isVerified, badge: verBadge },
    { label: "Rental preferences", done: prefsDone },
    { label: "Applications or introductions", done: hasApplications || introductions.length > 0 },
  ];
  const doneCount = readinessItems.filter((item) => item.done).length;

  const profileNextAction = !prefsDone
    ? { label: "Complete your preferences", href: "/onboarding/preferences" }
    : !affordDone
      ? { label: "Add affordability details", href: "/onboarding/affordability" }
      : !isVerified
        ? { label: "Verify your identity", href: "/onboarding/verification" }
        : null;

  // ── Matched properties ──────────────────────────────────────────────────────
  const scoredProperties = (() => {
    const props = (rawProps ?? []) as PropertyListing[];
    if (props.length === 0 || !prefsDone) return [];
    const mapped = mapTenantProfile(tenantProfile as unknown as Record<string, unknown>);
    const propData = props.map((p) => mapProperty(p as unknown as Record<string, unknown>));
    const results = rank_properties_for_tenant_interests(propData, mapped);
    const propById = new Map(props.map((p) => [p.id, p]));
    return results
      .filter((r) => r.status === "ranked" && r.property_id && propById.has(r.property_id))
      .slice(0, 6)
      .map((r) => ({
        property: propById.get(r.property_id!)! as PropertyListing,
        score: r.score,
        match_reasons: r.match_reasons,
      }));
  })();

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:py-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              Renting
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Hi {firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">Choose what you want to do next.</p>
          </div>
          <DiscoverableToggle initial={isLooking} />
        </div>

        {/* ── Journey selector ──────────────────────────────────────────────── */}
        <RentingStatusSection
          hasActiveLease={hasActiveLease}
          tenantEmail={profile?.email}
          tenantName={profile?.full_name}
        />

        {/* ── Renter profile progress ─────────────────────────────────────── */}
        <div className="card mb-6 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">Your renter profile</p>
            <span className="shrink-0 text-xs font-semibold text-slate-400">
              {doneCount} of {readinessItems.length} complete
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            A stronger profile helps landlords understand your rental history and trust signals.
          </p>
          <ul className="mt-4 space-y-3">
            {readinessItems.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-slate-600">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.done
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-300"
                  }`}
                  aria-hidden="true"
                >
                  {item.done ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </span>
                <span className={item.done ? "text-slate-700" : "text-slate-500"}>
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${item.badge.cls}`}
                  >
                    {item.badge.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {profileNextAction && (
            <Link
              href={profileNextAction.href}
              className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
            >
              {profileNextAction.label} →
            </Link>
          )}
        </div>

        {/* ── Onboarding prompts — self-hides when all complete ───────────── */}
        {hasAnyIncomplete && (
          <div className="mb-8 space-y-3">
            {!prefsDone && (
              <div className="overflow-hidden rounded-2xl bg-[#0f172a] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">
                      Complete your preferences
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Tell us where you want to live and your budget so we can
                      match you with suitable properties.
                    </p>
                  </div>
                  <Link
                    href="/onboarding/preferences"
                    className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Add preferences
                  </Link>
                </div>
              </div>
            )}

            {prefsDone && !affordDone && (
              <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900">
                      Complete your affordability profile
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Add your income range to see which properties you&apos;ll
                      qualify for.
                    </p>
                  </div>
                  <Link
                    href="/onboarding/affordability"
                    className="shrink-0 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Add affordability
                  </Link>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Current home and rent ───────────────────────────────────────── */}
        <div className="mb-6">
          <RentPaymentCard
            token={rentToken ?? ""}
            initialObligation={nextObligationForCard}
            devMode={process.env.NODE_ENV !== "production"}
          />
        </div>

        <div id="current-home" className="scroll-mt-24">
          <CurrentHomeCard
            hasActiveLease={hasActiveLease}
            leaseStart={currentLease?.lease_start ?? null}
            leaseEnd={currentLease?.lease_end ?? null}
            monthlyRentCents={currentLease?.monthly_rent ?? null}
            depositAmountCents={currentLease?.deposit_amount ?? null}
            noticePeriodDays={currentLease?.notice_period_days ?? null}
            petAllowed={currentLease?.pet_allowed ?? null}
            sublettingAllowed={currentLease?.subletting_allowed ?? null}
          />
        </div>

        {/* ── Flatmate Finder ──────────────────────────────────────────────── */}
        {hasActiveLease && (
          <div id="flatmate" className="mb-6 scroll-mt-24">
            <FlatmateListingPanel
              initialListing={flatmateListing}
              initialApplicants={flatmateApplicants}
            />
          </div>
        )}

        {/* ── Rental preferences and matches ──────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Rental Preferences
            </h2>
            <Link
              href="/tenant/preferences"
              className="text-xs font-medium text-slate-400 hover:text-slate-700 hover:underline"
            >
              Edit preferences →
            </Link>
          </div>

          {(tenantProfile.looking_in_area || tenantProfile.budget_max) && (
            <div className="card mb-4 p-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                {tenantProfile.looking_in_area && (
                  <span>
                    <span className="font-medium">Looking in:</span>{" "}
                    {tenantProfile.looking_in_area}
                    {tenantProfile.looking_in_province
                      ? `, ${tenantProfile.looking_in_province}`
                      : ""}
                  </span>
                )}
                {tenantProfile.budget_max && (
                  <span>
                    <span className="font-medium">Budget:</span> R
                    {((tenantProfile.budget_min ?? 0) / 100).toLocaleString()} –
                    R{(tenantProfile.budget_max / 100).toLocaleString()}/mo
                  </span>
                )}
                {tenantProfile.move_in_date && (
                  <span>
                    <span className="font-medium">Move in:</span>{" "}
                    {new Date(tenantProfile.move_in_date).toLocaleDateString(
                      "en-ZA",
                      { month: "short", year: "numeric" },
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {scoredProperties.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">No matching properties yet.</p>
              {!prefsDone ? (
                <Link
                  href="/onboarding/preferences"
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  Add preferences to see matches →
                </Link>
              ) : (
                <Link
                  href="/tenant/browse"
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  Browse all properties →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {scoredProperties.map(({ property: p, score, match_reasons }) => (
                <div
                  key={p.id}
                  className="card flex items-center gap-4 overflow-hidden p-0"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-32">
                    {p.photos?.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photos[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <svg
                          className="h-8 w-8 text-slate-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 py-3">
                    <p className="truncate font-semibold text-slate-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.suburb}
                      {p.province ? `, ${p.province}` : ""}
                    </p>
                    {p.asking_rent && (
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        R{(p.asking_rent / 100).toLocaleString("en-ZA")}
                        <span className="text-xs font-normal text-slate-400">
                          /mo
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                        score >= 75
                          ? "bg-green-100 text-green-700"
                          : score >= 45
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {score}/100
                    </span>
                    {match_reasons.length > 0 && (
                      <ul className="max-w-[180px] space-y-1 text-right">
                        {match_reasons.slice(0, 2).map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-end gap-1.5"
                          >
                            <span className="text-xs leading-snug text-green-700">
                              {r}
                            </span>
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/browse/${p.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-center">
                <Link
                  href="/tenant/browse"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Browse all properties →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── Applications and introductions ──────────────────────────────── */}
        <section id="applications" className="mb-8 scroll-mt-24">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Applications and introductions
          </h2>

          {applications.length === 0 && introductions.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">
                You do not have active applications yet.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                When you apply or get introduced to a landlord, it will appear here.
              </p>
              <Link
                href="/tenant/browse"
                className="mt-4 inline-block rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Browse properties
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.length > 0 && (
                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Applications
                    </p>
                    {applications.length > 5 && (
                      <Link
                        href="/tenant/applications"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        View all {applications.length} →
                      </Link>
                    )}
                  </div>
                  <div className="card overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {applications.slice(0, 5).map((app) => {
                        const s =
                          APP_STATUS[app.status] ?? {
                            label: app.status,
                            cls: "bg-slate-100 text-slate-500",
                          };
                        const prop = app.properties;
                        return (
                          <div
                            key={app.id}
                            className="flex items-center gap-4 px-5 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {prop?.name ?? "Property"}
                              </p>
                              {prop?.suburb && (
                                <p className="text-xs text-slate-400">{prop.suburb}</p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                            >
                              {s.label}
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {fmtDate(app.created_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {introductions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Introductions
                  </p>
                  <div className="card overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {introductions.map((intro) => {
                        const s =
                          INTRO_STATUS[intro.status] ?? {
                            label: intro.status,
                            cls: "bg-slate-100 text-slate-500",
                          };
                        const prop = intro.properties;
                        return (
                          <div
                            key={intro.id}
                            className="flex items-center gap-4 px-5 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {prop?.name ?? "Property"}
                              </p>
                              {prop?.suburb && (
                                <p className="text-xs text-slate-400">{prop.suburb}</p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                            >
                              {s.label}
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {fmtDate(intro.created_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── More ways to build trust ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            More ways to build trust
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Services */}
            <div className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="mt-4 font-semibold text-slate-900">Services</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Cleaning, garden help, laundry and other local help when you
                need it. Or offer your own skills to residents nearby.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/services"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
                >
                  Browse
                </Link>
                <Link
                  href="/services/list"
                  className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  List yours
                </Link>
              </div>
            </div>

            <LeaseReviewCard />

            {/* Good Neighbour */}
            <div className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="mt-4 font-semibold text-slate-900">Good Neighbour</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Connect with people nearby and build your reputation through
                small acts of goodwill. No money involved.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/neighbour"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
                >
                  Explore
                </Link>
                <Link
                  href="/neighbour"
                  className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Opt in
                </Link>
              </div>
            </div>

            {/* Become a landlord */}
            <div className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <p className="mt-4 font-semibold text-slate-900">
                Become a landlord
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                List a property, screen tenants and track payments without an
                agent. Add the landlord role to this account any time, free.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/solutions/landlords"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
                >
                  How it works
                </Link>
                <Link
                  href="/settings"
                  className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>

        <GoodNeighbourActions />

        <MatchWithPeople />

      </main>
    </div>
  );
}
