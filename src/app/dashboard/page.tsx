import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { RiskBadge } from "@/components/RiskBadge";
import { calculateRiskScore } from "@/lib/risk";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import { getComponentHealth } from "@/lib/maintenance";
import { rentLedgerTotals, lateTenantIds } from "@/lib/rent/ledger";
import { PaymentWarningsButton } from "./PaymentWarningsButton";
import type {
  Payment,
  Property,
  Tenant,
  MaintenanceJob,
  PropertyComponent,
  BodyCorpFlag,
  TenantProfile,
  PropertyListing,
  RentObligation,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Profile (for dual-role detection) ────────────────────────────────────
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("is_landlord, is_tenant, full_name")
    .eq("id", user.id)
    .single();

  if (profileErr) {
    console.error("[dashboard] profile read failed:", profileErr.message);
  }

  // Fall back to user_metadata when the profiles row is missing/unreadable,
  // then to safe defaults (landlord=true) so the page always renders.
  const meta = user.user_metadata ?? {};
  const isLandlord = profileRow
    ? profileRow.is_landlord
    : !!(meta.is_landlord ?? (meta.user_type === "landlord" || true));
  const isTenant = profileRow
    ? profileRow.is_tenant
    : !!(meta.is_tenant ?? meta.user_type === "tenant");
  const isDual = isLandlord && isTenant;
  const tab = isDual && searchParams.tab === "tenant" ? "tenant" : "landlord";

  // ── Tenant-tab data (only when dual-role and tenant tab active) ──────────
  let myTenantProfile: TenantProfile | null = null;
  let myMatchedProperties: {
    property: PropertyListing;
    score: number;
    match_reasons: string[];
  }[] = [];
  let totalListedCount = 0;

  if (isDual && tab === "tenant") {
    const { data: tp } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    myTenantProfile = tp as TenantProfile | null;

    const { data: listedProps } = await supabase
      .from("properties")
      .select("*")
      .in("status", ["available", "available_from"])
      .limit(100);
    totalListedCount = (listedProps ?? []).length;

    if (myTenantProfile && (listedProps ?? []).length > 0) {
      const profile = mapTenantProfile(
        myTenantProfile as unknown as Record<string, unknown>,
      );
      const propData = (listedProps ?? []).map((p) =>
        mapProperty(p as Record<string, unknown>),
      );
      const results = rank_properties_for_tenant_interests(propData, profile);
      const propById = new Map((listedProps ?? []).map((p) => [p.id, p]));
      myMatchedProperties = results
        .filter(
          (r) =>
            r.status === "ranked" &&
            r.property_id &&
            propById.has(r.property_id),
        )
        .slice(0, 6)
        .map((r) => ({
          property: propById.get(r.property_id!)! as PropertyListing,
          score: r.score,
          match_reasons: r.match_reasons,
        }));
    }
  }

  // ── Core data ─────────────────────────────────────────────────────────────
  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const propertyList: Property[] = properties ?? [];
  const propertyIds = propertyList.map((p) => p.id);

  const { data: tenants } = propertyIds.length
    ? await supabase.from("tenants").select("*").in("property_id", propertyIds)
    : { data: [] };

  const tenantList: Tenant[] = tenants ?? [];
  const tenantIds = tenantList.map((t) => t.id);

  const { data: payments } = tenantIds.length
    ? await supabase.from("payments").select("*").in("tenant_id", tenantIds)
    : { data: [] };

  const paymentList: Payment[] = payments ?? [];

  // ── Intelligence data ─────────────────────────────────────────────────────
  // Maintenance jobs
  const { data: jobsRaw } = propertyIds.length
    ? await supabase
        .from("maintenance_jobs")
        .select("id, status, urgency, title, property_id, updated_at")
        .in("property_id", propertyIds)
        .not("status", "in", '("completed","declined")')
        .order("updated_at", { ascending: false })
    : { data: [] };

  const activeJobs = (jobsRaw ?? []) as Pick<
    MaintenanceJob,
    "id" | "status" | "urgency" | "title" | "property_id" | "updated_at"
  >[];

  // Property components (for overdue / due-soon counts)
  const { data: componentsRaw } = propertyIds.length
    ? await supabase
        .from("property_components")
        .select(
          "id, property_id, name, component_type, installed_date, lifespan_max_years",
        )
        .in("property_id", propertyIds)
    : { data: [] };

  const components = (componentsRaw ?? []) as Pick<
    PropertyComponent,
    | "id"
    | "property_id"
    | "name"
    | "component_type"
    | "installed_date"
    | "lifespan_max_years"
  >[];

  // Body corporate flags (unresolved)
  const { data: bcFlagsRaw } = propertyIds.length
    ? await supabase
        .from("body_corporate_flags")
        .select(
          "id, property_id, severity, title, requires_owner_action, resolved",
        )
        .in("property_id", propertyIds)
        .eq("resolved", false)
        .order("severity")
    : { data: [] };

  const bcFlags = (bcFlagsRaw ?? []) as Pick<
    BodyCorpFlag,
    | "id"
    | "property_id"
    | "severity"
    | "title"
    | "requires_owner_action"
    | "resolved"
  >[];

  // ── Ways to get involved data ──────────────────────────────────────────────
  const [{ count: activeSvcCount }, { data: landlordNeighbourRaw }] =
    await Promise.all([
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

  const landlordHasListing = (activeSvcCount ?? 0) > 0;
  const landlordNeighbour = landlordNeighbourRaw as { id: string; is_active: boolean } | null;
  const landlordIsGoodNeighbour = landlordNeighbour?.is_active === true;

  // ── Lease / Xpello stats ─────────────────────────────────────────────────────
  const { data: leasesRaw } = await supabase
    .from("lease_agreements")
    .select("id, xpello_enrolled")
    .eq("landlord_id", user.id)
    .in("status", ["sent", "signed"]);

  const leaseList = leasesRaw ?? [];
  const xpelloEnrolled = leaseList.filter((l) => l.xpello_enrolled).length;
  const xpelloUnenrolled = leaseList.filter((l) => !l.xpello_enrolled).length;

  // ── Computed stats ────────────────────────────────────────────────────────
  const paymentsByTenant = new Map<string, Payment[]>();
  for (const p of paymentList) {
    if (!paymentsByTenant.has(p.tenant_id))
      paymentsByTenant.set(p.tenant_id, []);
    paymentsByTenant.get(p.tenant_id)!.push(p);
  }

  const tenantsByProperty = new Map<string, Tenant[]>();
  for (const t of tenantList) {
    if (!tenantsByProperty.has(t.property_id))
      tenantsByProperty.set(t.property_id, []);
    tenantsByProperty.get(t.property_id)!.push(t);
  }

  const propMap = new Map(propertyList.map((p) => [p.id, p.name]));

  const totalProperties = propertyList.length;
  const totalTenants = tenantList.length;
  const atRisk = tenantList.filter((t) => {
    return (
      calculateRiskScore(paymentsByTenant.get(t.id) ?? []).colour === "red"
    );
  }).length;
  const totalRentCents = tenantList.reduce((s, t) => s + t.monthly_rent, 0);

  // ── Rent ledger (this month) ──────────────────────────────────────────────
  const now = new Date();
  const rentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const rentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: rentObligationsRaw } = await supabase
    .from("rent_obligations")
    .select("*")
    .eq("landlord_id", user.id)
    .gte("period_start", rentMonthStart)
    .lte("period_start", rentMonthEnd);

  const rentObligations: RentObligation[] = rentObligationsRaw ?? [];
  const rentTotals = rentLedgerTotals(rentObligations);
  const rentLateTenantCount = lateTenantIds(rentObligations).length;

  // ── Payment warnings stats ─────────────────────────────────────────────────
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Warning window: payments 3 days before due up to 14 days overdue
  const warnWindowStart = new Date(todayMidnight);
  warnWindowStart.setDate(todayMidnight.getDate() - 14);
  const warnWindowEnd = new Date(todayMidnight);
  warnWindowEnd.setDate(todayMidnight.getDate() + 3);

  // Payments in the warning window that are unpaid
  const paymentsInWindow = paymentList.filter((p) => {
    if (p.status === "paid") return false;
    const due = new Date(p.due_date);
    due.setHours(0, 0, 0, 0);
    return due >= warnWindowStart && due <= warnWindowEnd;
  });

  // Tenants with at least one payment currently overdue (past due, unpaid)
  const overdueTenantsSet = new Set(
    paymentList
      .filter((p) => {
        if (p.status === "paid") return false;
        const due = new Date(p.due_date);
        due.setHours(0, 0, 0, 0);
        return due <= todayMidnight;
      })
      .map((p) => p.tenant_id),
  );
  const overdueTenantsCount = overdueTenantsSet.size;

  // Maintenance
  const urgentJobs = activeJobs.filter((j) => j.urgency === "urgent");
  const quotesToReview = activeJobs.filter(
    (j) => j.status === "quote_received",
  );
  const overdueComps = components.filter(
    (c) =>
      getComponentHealth(c.installed_date, c.lifespan_max_years).status ===
      "red",
  );
  const dueSoonComps = components.filter(
    (c) =>
      getComponentHealth(c.installed_date, c.lifespan_max_years).status ===
      "amber",
  );

  // Body corporate
  const bcRedFlags = bcFlags.filter((f) => f.severity === "red");
  const bcAmberFlags = bcFlags.filter((f) => f.severity === "amber");
  const bcActionItems = bcFlags.filter((f) => f.requires_owner_action);

  function formatRand(cents: number) {
    return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Tenant tab ──────────────────────────────────────────────────── */}
        {tab === "tenant" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  My Rental Search
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Recommended properties based on your profile
                </p>
              </div>
              <Link
                href="/browse"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Browse all properties
              </Link>
            </div>

            {!myTenantProfile ? (
              <div className="card p-10 text-center">
                <p className="text-slate-500">No tenant profile found.</p>
                <Link
                  href="/tenant/profile"
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  Set up your profile
                </Link>
              </div>
            ) : (
              <>
                {/* Preferences summary */}
                <div className="card mb-6 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid gap-y-1 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Your search preferences
                      </span>
                      {myTenantProfile.looking_in_area && (
                        <p className="text-slate-700">
                          <span className="font-medium">Looking in:</span>{" "}
                          {myTenantProfile.looking_in_area}
                          {myTenantProfile.looking_in_province
                            ? `, ${myTenantProfile.looking_in_province}`
                            : ""}
                        </p>
                      )}
                      {myTenantProfile.budget_max && (
                        <p className="text-slate-700">
                          <span className="font-medium">Budget:</span> R
                          {(
                            (myTenantProfile.budget_min ?? 0) / 100
                          ).toLocaleString()}{" "}
                          – R
                          {(myTenantProfile.budget_max / 100).toLocaleString()}
                          /mo
                        </p>
                      )}
                      {myTenantProfile.move_in_date && (
                        <p className="text-slate-700">
                          <span className="font-medium">Move in:</span>{" "}
                          {new Date(
                            myTenantProfile.move_in_date,
                          ).toLocaleDateString("en-ZA", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {myTenantProfile.lease_length_months && (
                        <p className="text-slate-700">
                          <span className="font-medium">Lease:</span>{" "}
                          {myTenantProfile.lease_length_months} months
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          myTenantProfile.discoverable
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {myTenantProfile.discoverable
                          ? "Actively looking"
                          : "Hidden"}
                      </span>
                      <Link
                        href="/tenant/preferences"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Edit preferences
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Recommended section header */}
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    Recommended for you
                  </h2>
                  <p className="text-xs text-slate-400">
                    Based on your budget, area and preferences
                  </p>
                </div>

                {/* Horizontal cards */}
                {myMatchedProperties.length === 0 ? (
                  <div className="card p-10 text-center">
                    <p className="text-slate-500">
                      No properties match your preferences yet.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try browsing all available properties.
                    </p>
                    <Link
                      href="/browse"
                      className="mt-4 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Browse all properties
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myMatchedProperties.map(({ property: p, score, match_reasons }) => (
                      <div
                        key={p.id}
                        className="card flex items-center gap-4 overflow-hidden p-0"
                      >
                        {/* Photo */}
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
                        {/* Details */}
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
                        {/* Score + reasons + action */}
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
                              {match_reasons.slice(0, 3).map((r, i) => (
                                <li key={i} className="flex items-start justify-end gap-1.5">
                                  <span className="text-[11px] leading-snug text-green-700">{r}</span>
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
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
                  </div>
                )}

                {/* Browse all link */}
                <div className="mt-6 text-center">
                  <Link
                    href="/browse"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    See all {totalListedCount > 0 ? totalListedCount : ""}{" "}
                    available properties
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Landlord tab ─────────────────────────────────────────────────── */}
        {tab === "landlord" && (
          <>
            {/* Page header */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Your properties at a glance
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/properties/new"
                  className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-blue-800"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Property
                </Link>
                <PaymentWarningsButton
                  overdueCount={overdueTenantsCount}
                  warningWindowCount={paymentsInWindow.length}
                />
              </div>
            </div>

            {/* Top stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Properties" value={String(totalProperties)} />
              <StatCard label="Tenants" value={String(totalTenants)} />
              <StatCard
                label="High Risk"
                value={String(atRisk)}
                valueClass={atRisk > 0 ? "text-red-600" : "text-emerald-600"}
              />
              <StatCard
                label="Monthly Rent"
                value={formatRand(totalRentCents)}
              />
            </div>

            {/* ── Rent this month ──────────────────────────────────────────────── */}
            {tenantList.length > 0 && (
              <div className="card mb-8 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">
                  💰 Rent this month
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Expected
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatRand(rentTotals.expectedCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Collected
                    </p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">
                      {formatRand(rentTotals.collectedCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Outstanding
                    </p>
                    <p
                      className={`mt-1 text-xl font-bold ${
                        rentTotals.outstandingCents > 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {formatRand(rentTotals.outstandingCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Late tenants
                    </p>
                    <p
                      className={`mt-1 text-xl font-bold ${
                        rentLateTenantCount > 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {rentLateTenantCount}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Portfolio nudge ────────────────────────────────────────────── */}
            {isLandlord &&
              propertyList.length > 0 &&
              (propertyList as (typeof propertyList[0] & { bond_monthly_payment_cents?: number | null })[]).every(
                (p) => p.bond_monthly_payment_cents == null,
              ) && (
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <svg
                        className="h-5 w-5 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Track your portfolio finances
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Add bond, levy and rates to each property to see your
                        monthly cash flow and yields.
                      </p>
                    </div>
                  </div>
                  <a
                    href="/portfolio"
                    className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Set up portfolio
                  </a>
                </div>
              )}

            {/* ── Intelligence section ─────────────────────────────────────────── */}
            {(activeJobs.length > 0 ||
              overdueComps.length > 0 ||
              dueSoonComps.length > 0 ||
              bcFlags.length > 0) && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                {/* Maintenance card */}
                {(activeJobs.length > 0 ||
                  overdueComps.length > 0 ||
                  dueSoonComps.length > 0) && (
                  <div className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-semibold text-slate-900">
                        🔧 Maintenance
                      </h2>
                      <Link
                        href="/maintenance-jobs"
                        className="text-xs font-medium text-violet-600 hover:underline"
                      >
                        View all →
                      </Link>
                    </div>

                    {/* Mini stat row */}
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <MiniStat
                        label="Urgent jobs"
                        value={urgentJobs.length}
                        colour={urgentJobs.length > 0 ? "red" : "neutral"}
                      />
                      <MiniStat
                        label="Quotes to review"
                        value={quotesToReview.length}
                        colour={quotesToReview.length > 0 ? "amber" : "neutral"}
                      />
                      <MiniStat
                        label="Overdue components"
                        value={overdueComps.length}
                        colour={overdueComps.length > 0 ? "red" : "neutral"}
                      />
                    </div>

                    {/* Urgent jobs list */}
                    {urgentJobs.length > 0 && (
                      <div className="space-y-1">
                        {urgentJobs.slice(0, 3).map((job) => (
                          <Link
                            key={job.id}
                            href={`/maintenance-jobs/${job.id}`}
                            className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm transition hover:bg-red-100"
                          >
                            <span className="truncate font-medium text-red-800">
                              {job.title}
                            </span>
                            <span className="ml-2 shrink-0 text-xs text-red-500">
                              {propMap.get(job.property_id) ?? ""}
                            </span>
                          </Link>
                        ))}
                        {urgentJobs.length > 3 && (
                          <p className="pl-3 text-xs text-slate-400">
                            +{urgentJobs.length - 3} more urgent jobs
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quotes to review */}
                    {quotesToReview.length > 0 && urgentJobs.length === 0 && (
                      <div className="space-y-1">
                        {quotesToReview.slice(0, 3).map((job) => (
                          <Link
                            key={job.id}
                            href={`/maintenance-jobs/${job.id}`}
                            className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm transition hover:bg-amber-100"
                          >
                            <span className="truncate font-medium text-amber-800">
                              {job.title}
                            </span>
                            <span className="ml-2 shrink-0 text-xs text-amber-600">
                              Quote ready
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Overdue components */}
                    {overdueComps.length > 0 &&
                      urgentJobs.length === 0 &&
                      quotesToReview.length === 0 && (
                        <div className="space-y-1">
                          {overdueComps.slice(0, 3).map((c) => (
                            <Link
                              key={c.id}
                              href={`/properties/${c.property_id}/components`}
                              className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm transition hover:bg-red-100"
                            >
                              <span className="truncate font-medium text-red-800">
                                {c.name}
                              </span>
                              <span className="ml-2 shrink-0 text-xs text-red-500">
                                {propMap.get(c.property_id) ?? ""}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                    {dueSoonComps.length > 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        🟡 {dueSoonComps.length} component
                        {dueSoonComps.length > 1 ? "s" : ""} due for replacement
                        within 12 months
                      </p>
                    )}
                  </div>
                )}

                {/* Body Corporate card */}
                {bcFlags.length > 0 && (
                  <div className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-semibold text-slate-900">
                        🏢 Body Corporate
                      </h2>
                      <Link
                        href="/body-corporate"
                        className="text-xs font-medium text-violet-600 hover:underline"
                      >
                        View all →
                      </Link>
                    </div>

                    {/* Mini stat row */}
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <MiniStat
                        label="Red flags"
                        value={bcRedFlags.length}
                        colour={bcRedFlags.length > 0 ? "red" : "neutral"}
                      />
                      <MiniStat
                        label="Amber flags"
                        value={bcAmberFlags.length}
                        colour={bcAmberFlags.length > 0 ? "amber" : "neutral"}
                      />
                      <MiniStat
                        label="Action items"
                        value={bcActionItems.length}
                        colour={bcActionItems.length > 0 ? "amber" : "neutral"}
                      />
                    </div>

                    {/* Red flags list */}
                    {bcRedFlags.length > 0 && (
                      <div className="space-y-1">
                        {bcRedFlags.slice(0, 3).map((flag) => (
                          <Link
                            key={flag.id}
                            href="/body-corporate"
                            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm transition hover:bg-red-100"
                          >
                            <span className="shrink-0 text-xs">🔴</span>
                            <span className="truncate font-medium text-red-800">
                              {flag.title}
                            </span>
                            {flag.requires_owner_action && (
                              <span className="ml-auto shrink-0 rounded-full bg-red-200 px-1.5 py-0.5 text-xs font-medium text-red-800">
                                Action
                              </span>
                            )}
                          </Link>
                        ))}
                        {bcRedFlags.length > 3 && (
                          <p className="pl-3 text-xs text-slate-400">
                            +{bcRedFlags.length - 3} more red flags
                          </p>
                        )}
                      </div>
                    )}

                    {/* Amber flags if no red */}
                    {bcRedFlags.length === 0 && bcAmberFlags.length > 0 && (
                      <div className="space-y-1">
                        {bcAmberFlags.slice(0, 3).map((flag) => (
                          <Link
                            key={flag.id}
                            href="/body-corporate"
                            className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm transition hover:bg-amber-100"
                          >
                            <span className="shrink-0 text-xs">🟡</span>
                            <span className="truncate font-medium text-amber-800">
                              {flag.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Placeholder card if no BC flags but jobs exist — keep grid balanced */}
                {bcFlags.length === 0 &&
                  (activeJobs.length > 0 || overdueComps.length > 0) && (
                    <div className="card flex flex-col items-center justify-center p-5 text-center">
                      <p className="text-2xl">🏢</p>
                      <p className="mt-2 font-semibold text-slate-700">
                        Body Corporate
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        No unresolved flags
                      </p>
                      <Link
                        href="/body-corporate/new"
                        className="mt-3 text-xs font-medium text-violet-600 hover:underline"
                      >
                        Parse meeting minutes →
                      </Link>
                    </div>
                  )}
              </div>
            )}

            {/* ── Xpello legal protection widget ───────────────────────────────── */}
            {leaseList.length > 0 && (
              <div
                className={`mb-8 rounded-2xl border p-5 ${xpelloUnenrolled > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${xpelloUnenrolled > 0 ? "bg-amber-100" : "bg-emerald-100"}`}
                    >
                      <svg
                        className={`h-5 w-5 ${xpelloUnenrolled > 0 ? "text-amber-600" : "text-emerald-600"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${xpelloUnenrolled > 0 ? "text-amber-900" : "text-emerald-900"}`}
                      >
                        {xpelloUnenrolled > 0
                          ? `${xpelloUnenrolled} lease${xpelloUnenrolled > 1 ? "s are" : " is"} not legally protected`
                          : `All ${xpelloEnrolled} lease${xpelloEnrolled > 1 ? "s are" : " is"} protected by Xpello`}
                      </p>
                      <p
                        className={`text-sm ${xpelloUnenrolled > 0 ? "text-amber-700" : "text-emerald-700"}`}
                      >
                        {xpelloUnenrolled > 0
                          ? "Enroll with Xpello from R250/month per lease"
                          : `${xpelloEnrolled} lease${xpelloEnrolled > 1 ? "s" : ""} covered · Xpello eviction management active`}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/leases"
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      xpelloUnenrolled > 0
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {xpelloUnenrolled > 0 ? "View leases →" : "Manage leases →"}
                  </Link>
                </div>
              </div>
            )}

            {/* ── Quick actions (when everything is clear) ───────────────────── */}
            {activeJobs.length === 0 &&
              overdueComps.length === 0 &&
              bcFlags.length === 0 &&
              propertyList.length > 0 && (
                <div className="mb-8 grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/body-corporate/new"
                    className="card flex items-center gap-4 p-5 transition hover:border-slate-300 hover:shadow-md"
                  >
                    <span className="text-2xl">🏢</span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Parse Body Corporate Minutes
                      </p>
                      <p className="text-sm text-slate-400">
                        Upload PDF or paste text for AI analysis
                      </p>
                    </div>
                  </Link>
                  <Link
                    href="/maintenance-jobs"
                    className="card flex items-center gap-4 p-5 transition hover:border-slate-300 hover:shadow-md"
                  >
                    <span className="text-2xl">🔧</span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Maintenance Jobs
                      </p>
                      <p className="text-sm text-slate-400">
                        Track contractors and component lifespans
                      </p>
                    </div>
                  </Link>
                </div>
              )}

            {/* ── Ways to get involved ─────────────────────────────────────────── */}
            <div className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Ways to get involved
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/services/list"
                  className="card flex items-start gap-4 p-5 transition hover:border-violet-300 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                    <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {landlordHasListing ? "Manage your listing" : "List your service"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {landlordHasListing
                        ? "You have an active listing in the services directory."
                        : "Offer your skills to residents in the PropTrust community."}
                    </p>
                    <span className="mt-2 inline-block text-xs font-semibold text-violet-600">
                      {landlordHasListing ? "Manage →" : "Get started →"}
                    </span>
                  </div>
                </Link>

                <Link
                  href="/neighbour"
                  className="card flex items-start gap-4 p-5 transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {landlordIsGoodNeighbour ? "You're a Good Neighbour" : "Be a Good Neighbour"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {landlordIsGoodNeighbour
                        ? "Your profile is active. Keep helping your community."
                        : "Small acts of goodwill build your reputation — no money involved."}
                    </p>
                    <span className="mt-2 inline-block text-xs font-semibold text-emerald-600">
                      {landlordIsGoodNeighbour ? "View profile →" : "Opt in →"}
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* ── Properties ────────────────────────────────────────────────────── */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Properties
              </h2>

              {propertyList.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-slate-500">No properties yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {propertyList.map((property) => {
                    const propertyTenants =
                      tenantsByProperty.get(property.id) ?? [];

                    // Per-property intelligence counts
                    const propJobs = activeJobs.filter(
                      (j) => j.property_id === property.id,
                    );
                    const propOverdue = components.filter(
                      (c) =>
                        c.property_id === property.id &&
                        getComponentHealth(
                          c.installed_date,
                          c.lifespan_max_years,
                        ).status === "red",
                    );
                    const propBcFlags = bcFlags.filter(
                      (f) =>
                        f.property_id === property.id && f.severity === "red",
                    );

                    return (
                      <div key={property.id} className="card overflow-hidden">
                        <Link
                          href={`/properties/${property.id}`}
                          className="block p-5 transition hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {property.name}
                              </h3>
                              <p className="mt-0.5 text-sm text-slate-500">
                                {property.address}
                              </p>
                            </div>
                            <span className="ml-4 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {propertyTenants.length} tenant
                              {propertyTenants.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Tenant risk preview */}
                          {propertyTenants.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {propertyTenants.map((t) => {
                                const risk = calculateRiskScore(
                                  paymentsByTenant.get(t.id) ?? [],
                                );
                                return (
                                  <div
                                    key={t.id}
                                    className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5"
                                  >
                                    <span className="text-sm font-medium text-slate-700">
                                      {t.full_name}
                                    </span>
                                    <RiskBadge risk={risk} size="sm" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Link>

                        {/* Per-property intelligence strip */}
                        {(propJobs.length > 0 ||
                          propOverdue.length > 0 ||
                          propBcFlags.length > 0) && (
                          <div className="flex flex-wrap gap-0 border-t border-slate-100">
                            {propJobs.length > 0 && (
                              <Link
                                href="/maintenance-jobs"
                                className="flex items-center gap-1.5 border-r border-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                              >
                                🔧{" "}
                                <span>
                                  {propJobs.length} job
                                  {propJobs.length !== 1 ? "s" : ""}
                                </span>
                                {propJobs.some(
                                  (j) => j.urgency === "urgent",
                                ) && (
                                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-red-600">
                                    urgent
                                  </span>
                                )}
                              </Link>
                            )}
                            {propOverdue.length > 0 && (
                              <Link
                                href={`/properties/${property.id}/components`}
                                className="flex items-center gap-1.5 border-r border-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                              >
                                ⚠️{" "}
                                <span>
                                  {propOverdue.length} overdue component
                                  {propOverdue.length !== 1 ? "s" : ""}
                                </span>
                              </Link>
                            )}
                            {propBcFlags.length > 0 && (
                              <Link
                                href="/body-corporate"
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                              >
                                🔴{" "}
                                <span>
                                  {propBcFlags.length} body corp flag
                                  {propBcFlags.length !== 1 ? "s" : ""}
                                </span>
                              </Link>
                            )}
                            <Link
                              href={`/properties/${property.id}/components`}
                              className="ml-auto flex items-center gap-1 px-4 py-2 text-xs font-medium text-violet-600 transition hover:bg-slate-50"
                            >
                              Maintenance tracker →
                            </Link>
                          </div>
                        )}

                        {/* Quiet strip when no alerts */}
                        {propJobs.length === 0 &&
                          propOverdue.length === 0 &&
                          propBcFlags.length === 0 && (
                            <div className="flex justify-end border-t border-slate-100">
                              <Link
                                href={`/properties/${property.id}/components`}
                                className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-violet-600"
                              >
                                Maintenance tracker →
                              </Link>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── My Tenants ───────────────────────────────────────────────────── */}
            {tenantList.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    My Tenants
                  </h2>
                  <Link
                    href="/tenants/browse"
                    className="text-xs font-medium text-violet-600 hover:underline"
                  >
                    Find new tenants →
                  </Link>
                </div>

                <div className="card overflow-hidden">
                  {/* Table header */}
                  <div className="hidden grid-cols-[1.5fr_1fr_110px_100px_100px] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 sm:grid">
                    <span>Tenant</span>
                    <span>Property</span>
                    <span>Lease</span>
                    <span>Rent / mo</span>
                    <span>Risk</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {tenantList.map((tenant) => {
                      const risk = calculateRiskScore(
                        paymentsByTenant.get(tenant.id) ?? [],
                      );
                      const pmts = paymentsByTenant.get(tenant.id) ?? [];
                      const paid = pmts.filter(
                        (p) => p.status === "paid",
                      ).length;
                      const pctOnTime =
                        pmts.length > 0
                          ? Math.round((paid / pmts.length) * 100)
                          : null;
                      const lastPmt = [...pmts].sort(
                        (a, b) =>
                          new Date(b.due_date).getTime() -
                          new Date(a.due_date).getTime(),
                      )[0];
                      const riskCls =
                        risk.colour === "green"
                          ? "bg-green-100 text-green-800"
                          : risk.colour === "amber"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800";

                      const leaseEnd = tenant.lease_end
                        ? new Date(tenant.lease_end).toLocaleDateString(
                            "en-ZA",
                            { month: "short", year: "numeric" },
                          )
                        : "—";
                      const leaseStart = tenant.lease_start
                        ? new Date(tenant.lease_start).toLocaleDateString(
                            "en-ZA",
                            { month: "short", year: "numeric" },
                          )
                        : "—";

                      return (
                        <Link
                          key={tenant.id}
                          href={`/properties/${tenant.property_id}`}
                          className="flex flex-col gap-2 px-6 py-4 transition hover:bg-slate-50 sm:grid sm:grid-cols-[1.5fr_1fr_110px_100px_100px] sm:items-center sm:gap-4"
                        >
                          {/* Tenant name + payment history */}
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                              {tenant.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div>
                              <p className="font-semibold leading-tight text-slate-900">
                                {tenant.full_name}
                              </p>
                              {pctOnTime !== null ? (
                                <p className="text-xs text-slate-400">
                                  {pctOnTime}% on time · {pmts.length} payment
                                  {pmts.length !== 1 ? "s" : ""}
                                  {lastPmt && (
                                    <span
                                      className={
                                        lastPmt.status === "paid"
                                          ? " text-emerald-600"
                                          : " text-red-600"
                                      }
                                    >
                                      {" "}
                                      · last {lastPmt.status}
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400">
                                  No payments recorded
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Property */}
                          <p className="text-sm text-slate-600 truncate">
                            {propMap.get(tenant.property_id) ?? "—"}
                          </p>

                          {/* Lease dates */}
                          <p className="text-xs text-slate-500">
                            {leaseStart}
                            <br />
                            <span className="text-slate-400">→ {leaseEnd}</span>
                          </p>

                          {/* Rent */}
                          <p className="text-sm font-medium text-slate-900">
                            {formatRand(tenant.monthly_rent)}
                          </p>

                          {/* Risk badge */}
                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${riskCls}`}
                          >
                            {risk.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Recent maintenance activity ───────────────────────────────────── */}
            {activeJobs.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Active Maintenance Jobs
                  </h2>
                  <Link
                    href="/maintenance-jobs"
                    className="text-xs font-medium text-violet-600 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div className="card overflow-hidden">
                  {activeJobs.slice(0, 5).map((job, i) => {
                    const statusBadge =
                      {
                        draft: "bg-slate-100 text-slate-600",
                        sent: "bg-blue-100 text-blue-700",
                        quote_received: "bg-amber-100 text-amber-700",
                        approved: "bg-emerald-100 text-emerald-700",
                        declined: "bg-red-100 text-red-700",
                        completed: "bg-slate-100 text-slate-500",
                      }[job.status] ?? "bg-slate-100 text-slate-600";
                    const statusLabel =
                      {
                        draft: "Draft",
                        sent: "Sent",
                        quote_received: "Quote",
                        approved: "Approved",
                        declined: "Declined",
                        completed: "Done",
                      }[job.status] ?? job.status;
                    const urgencyIcon = {
                      urgent: "🔴",
                      normal: "🟡",
                      planned: "🟢",
                    }[job.urgency];

                    return (
                      <Link
                        key={job.id}
                        href={`/maintenance-jobs/${job.id}`}
                        className={`flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-50 ${
                          i < activeJobs.slice(0, 5).length - 1
                            ? "border-b border-slate-100"
                            : ""
                        }`}
                      >
                        <span>{urgencyIcon}</span>
                        <span className="flex-1 truncate font-medium text-slate-800">
                          {job.title}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {propMap.get(job.property_id)}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatDate(job.updated_at)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {/* close landlord tab */}
          </>
        )}
      </main>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: "red" | "amber" | "neutral";
}) {
  const cls =
    colour === "red"
      ? "text-red-600"
      : colour === "amber"
        ? "text-amber-600"
        : "text-slate-600";

  return (
    <div className="rounded-lg bg-slate-50 p-2 text-center">
      <p className={`text-lg font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-slate-400 leading-tight">{label}</p>
    </div>
  );
}
