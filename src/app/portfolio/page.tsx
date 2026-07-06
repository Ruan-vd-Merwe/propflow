import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { rentLedgerTotals } from "@/lib/rent/ledger";
import type { Tenant, PropertyWithFinance, RentObligation } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmtRand(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function monthsRemaining(startDate: string, termYears: number): number {
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + termYears);
  const now = new Date();
  const diff =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

function bondEndDate(startDate: string, termYears: number): string {
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + termYears);
  return end.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

export default async function PortfolioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_landlord")
    .eq("id", user.id)
    .single();

  if (!profileRow?.is_landlord) redirect("/dashboard");

  // Load properties with all finance columns
  const { data: propertiesRaw } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const properties: PropertyWithFinance[] =
    (propertiesRaw ?? []) as PropertyWithFinance[];
  const propertyIds = properties.map((p) => p.id);

  const { data: tenantsRaw } = propertyIds.length
    ? await supabase
        .from("tenants")
        .select("id, property_id, full_name, monthly_rent")
        .in("property_id", propertyIds)
    : { data: [] };

  const tenants: Pick<
    Tenant,
    "id" | "property_id" | "full_name" | "monthly_rent"
  >[] = tenantsRaw ?? [];
  // Current month rent obligations
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: rentObligationsRaw } = await supabase
    .from("rent_obligations")
    .select("*")
    .eq("landlord_id", user.id)
    .gte("period_start", monthStart)
    .lte("period_start", monthEnd);

  const rentObligations: RentObligation[] = rentObligationsRaw ?? [];

  // ── Computed stats ────────────────────────────────────────────────────────
  const { collectedCents: monthlyIncomeCents } = rentLedgerTotals(rentObligations);

  const monthlyExpensesCents = properties.reduce((s, p) => {
    return (
      s +
      (p.bond_monthly_payment_cents ?? 0) +
      (p.levy_monthly_cents ?? 0) +
      (p.rates_monthly_cents ?? 0) +
      (p.insurance_monthly_cents ?? 0)
    );
  }, 0);

  const netCashFlowCents = monthlyIncomeCents - monthlyExpensesCents;

  const tenantsByProperty = new Map<string, typeof tenants>();
  for (const t of tenants) {
    if (!tenantsByProperty.has(t.property_id))
      tenantsByProperty.set(t.property_id, []);
    tenantsByProperty.get(t.property_id)!.push(t);
  }

  const occupiedCount = properties.filter(
    (p) => (tenantsByProperty.get(p.id) ?? []).length > 0,
  ).length;
  const vacantCount = properties.length - occupiedCount;

  const propertiesWithoutFinance = properties.filter(
    (p) => p.bond_monthly_payment_cents == null && p.levy_monthly_cents == null,
  );
  const firstWithoutFinance = propertiesWithoutFinance[0];

  const currentMonthLabel = now.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
            <p className="mt-1 text-sm text-slate-500">{currentMonthLabel}</p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">No properties found.</p>
            <p className="mt-1 text-sm text-slate-400">
              Add your first property from the dashboard.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Missing data nudge */}
            {propertiesWithoutFinance.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-sm text-amber-800">
                  Some properties are missing financial details. Add bond, levy
                  and rates to see accurate cash flow figures.
                </p>
                {firstWithoutFinance && (
                  <Link
                    href={`/portfolio/${firstWithoutFinance.id}/setup`}
                    className="shrink-0 text-sm font-semibold text-amber-900 hover:underline"
                  >
                    Complete setup
                  </Link>
                )}
              </div>
            )}

            {/* Summary stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Monthly Income" value={fmtRand(monthlyIncomeCents)} />
              <StatCard
                label="Monthly Expenses"
                value={fmtRand(monthlyExpensesCents)}
              />
              <StatCard
                label="Net Cash Flow"
                value={fmtRand(netCashFlowCents)}
                valueClass={
                  netCashFlowCents >= 0 ? "text-emerald-600" : "text-red-600"
                }
              />
              <StatCard
                label="Properties"
                value={String(properties.length)}
                sub={`${occupiedCount} occupied · ${vacantCount} vacant`}
              />
            </div>

            {/* Property finance table */}
            <div className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Property Breakdown
              </h2>

              {/* Desktop table */}
              <div className="card hidden overflow-hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 text-left">Property</th>
                      <th className="px-4 py-3 text-left">Tenant(s)</th>
                      <th className="px-4 py-3 text-right">Rent</th>
                      <th className="px-4 py-3 text-right">Bond</th>
                      <th className="px-4 py-3 text-right">Levy</th>
                      <th className="px-4 py-3 text-right">Rates</th>
                      <th className="px-4 py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {properties.map((p) => {
                      const propTenants = tenantsByProperty.get(p.id) ?? [];
                      const rentCents = propTenants.reduce(
                        (s, t) => s + t.monthly_rent,
                        0,
                      );
                      const bondCents = p.bond_monthly_payment_cents;
                      const levyCents = p.levy_monthly_cents;
                      const ratesCents = p.rates_monthly_cents;
                      const hasFinance =
                        bondCents != null ||
                        levyCents != null ||
                        ratesCents != null;
                      const netCents =
                        rentCents -
                        (bondCents ?? 0) -
                        (levyCents ?? 0) -
                        (ratesCents ?? 0);
                      const isPositive = netCents >= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <Link
                              href={`/portfolio/${p.id}`}
                              className="font-medium text-slate-900 hover:text-blue-700"
                            >
                              <span className="block max-w-[180px] truncate">
                                {p.name}
                              </span>
                            </Link>
                            <span className="text-xs text-slate-400 block max-w-[180px] truncate">
                              {p.address}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {propTenants.length === 0 ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                Vacant
                              </span>
                            ) : (
                              <span className="text-sm">
                                {propTenants.length} tenant
                                {propTenants.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {fmtRand(rentCents)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {bondCents != null ? (
                              fmtRand(bondCents)
                            ) : (
                              <Link
                                href={`/portfolio/${p.id}/setup`}
                                className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                Set up
                              </Link>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {levyCents != null ? (
                              fmtRand(levyCents)
                            ) : !hasFinance ? (
                              "—"
                            ) : (
                              <Link
                                href={`/portfolio/${p.id}/setup`}
                                className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                Set up
                              </Link>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {ratesCents != null ? (
                              fmtRand(ratesCents)
                            ) : !hasFinance ? (
                              "—"
                            ) : (
                              <Link
                                href={`/portfolio/${p.id}/setup`}
                                className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                Set up
                              </Link>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              !hasFinance
                                ? "text-slate-400"
                                : isPositive
                                  ? "text-emerald-600"
                                  : "text-red-600"
                            }`}
                          >
                            {hasFinance ? fmtRand(netCents) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <TotalsRow
                      properties={properties}
                      tenantsByProperty={tenantsByProperty}
                    />
                  </tfoot>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="space-y-3 md:hidden">
                {properties.map((p) => {
                  const propTenants = tenantsByProperty.get(p.id) ?? [];
                  const rentCents = propTenants.reduce(
                    (s, t) => s + t.monthly_rent,
                    0,
                  );
                  const bondCents = p.bond_monthly_payment_cents;
                  const levyCents = p.levy_monthly_cents;
                  const ratesCents = p.rates_monthly_cents;
                  const hasFinance =
                    bondCents != null ||
                    levyCents != null ||
                    ratesCents != null;
                  const netCents =
                    rentCents -
                    (bondCents ?? 0) -
                    (levyCents ?? 0) -
                    (ratesCents ?? 0);

                  return (
                    <div key={p.id} className="card p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/portfolio/${p.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-700"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-slate-400 truncate">
                            {p.address}
                          </p>
                        </div>
                        {hasFinance ? (
                          <span
                            className={`shrink-0 text-sm font-bold ${netCents >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {fmtRand(netCents)}
                          </span>
                        ) : (
                          <Link
                            href={`/portfolio/${p.id}/setup`}
                            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
                          >
                            Set up
                          </Link>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <MiniFinanceLine
                          label="Rent"
                          value={fmtRand(rentCents)}
                        />
                        <MiniFinanceLine
                          label="Bond"
                          value={fmtRand(bondCents)}
                        />
                        <MiniFinanceLine
                          label="Levy"
                          value={fmtRand(levyCents)}
                        />
                        <MiniFinanceLine
                          label="Rates"
                          value={fmtRand(ratesCents)}
                        />
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        {propTenants.length === 0
                          ? "Vacant"
                          : `${propTenants.length} tenant${propTenants.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bond summary */}
            {properties.some((p) => p.bond_bank || p.bond_monthly_payment_cents) && (
              <div className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Bond Summary
                </h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3 text-left">Property</th>
                        <th className="px-4 py-3 text-left">Bank</th>
                        <th className="px-4 py-3 text-right">Payment</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {properties
                        .filter(
                          (p) =>
                            p.bond_bank ||
                            p.bond_monthly_payment_cents,
                        )
                        .map((p) => {
                          const remaining =
                            p.bond_start_date && p.bond_term_years
                              ? monthsRemaining(
                                  p.bond_start_date,
                                  p.bond_term_years,
                                )
                              : null;
                          const endDate =
                            p.bond_start_date && p.bond_term_years
                              ? bondEndDate(p.bond_start_date, p.bond_term_years)
                              : null;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3">
                                <Link
                                  href={`/portfolio/${p.id}`}
                                  className="font-medium text-slate-900 hover:text-blue-700"
                                >
                                  {p.name}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {p.bond_bank ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-900">
                                {fmtRand(p.bond_monthly_payment_cents)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                {p.bond_interest_rate_pct != null
                                  ? `${Number(p.bond_interest_rate_pct).toFixed(2)}%`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                {remaining != null ? (
                                  <span title={endDate ?? undefined}>
                                    {remaining} months
                                  </span>
                                ) : (
                                  "Not set"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
  sub,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function MiniFinanceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-medium text-slate-700">{value}</span>
    </div>
  );
}

function TotalsRow({
  properties,
  tenantsByProperty,
}: {
  properties: PropertyWithFinance[];
  tenantsByProperty: Map<
    string,
    { id: string; property_id: string; full_name: string; monthly_rent: number }[]
  >;
}) {
  let totalRent = 0;
  let totalBond = 0;
  let totalLevy = 0;
  let totalRates = 0;

  for (const p of properties) {
    const propTenants = tenantsByProperty.get(p.id) ?? [];
    totalRent += propTenants.reduce((s, t) => s + t.monthly_rent, 0);
    totalBond += p.bond_monthly_payment_cents ?? 0;
    totalLevy += p.levy_monthly_cents ?? 0;
    totalRates += p.rates_monthly_cents ?? 0;
  }

  const totalNet = totalRent - totalBond - totalLevy - totalRates;

  return (
    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
      <td className="px-5 py-3 text-slate-900">Totals</td>
      <td className="px-4 py-3" />
      <td className="px-4 py-3 text-right text-slate-900">
        {fmtRand(totalRent)}
      </td>
      <td className="px-4 py-3 text-right text-slate-900">
        {fmtRand(totalBond)}
      </td>
      <td className="px-4 py-3 text-right text-slate-900">
        {fmtRand(totalLevy)}
      </td>
      <td className="px-4 py-3 text-right text-slate-900">
        {fmtRand(totalRates)}
      </td>
      <td
        className={`px-4 py-3 text-right ${totalNet >= 0 ? "text-emerald-600" : "text-red-600"}`}
      >
        {fmtRand(totalNet)}
      </td>
    </tr>
  );
}
