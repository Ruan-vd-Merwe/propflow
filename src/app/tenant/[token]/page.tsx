import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { TenantPortal } from "./TenantPortal";
import type { TenantQuery, RentObligation, PaymentAttempt } from "@/lib/types";

export const dynamic = "force-dynamic";

type ServiceCategory = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
};
type ServiceProvider = {
  id: string;
  category_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  area: string | null;
  province: string | null;
  rate_description: string | null;
};

export default async function TenantPortalPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { tab?: string };
}) {
  const supabase = createServiceClient();

  // Look up tenant by portal_token (UUID) — fall back to legacy access_token
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.token,
    );
  const column = isUuid ? "portal_token" : "access_token";

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      `
      id, full_name, email, phone, monthly_rent, lease_start, lease_end, portal_token,
      properties!inner ( id, name, address, province,
        profiles!inner ( full_name, email, phone )
      )
    `,
    )
    .eq(column, params.token)
    .single();

  if (!tenant) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (tenant as any).properties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlord = property.profiles as any;

  // Fetch rent obligations + their payment attempts
  const { data: obligationsRaw } = await supabase
    .from("rent_obligations")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("due_date", { ascending: false });

  const obligations: RentObligation[] = (obligationsRaw ?? []) as RentObligation[];
  const obligationIds = obligations.map((o) => o.id);

  const { data: attemptsRaw } = obligationIds.length
    ? await supabase
        .from("payment_attempts")
        .select("*")
        .in("obligation_id", obligationIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const attempts: PaymentAttempt[] = (attemptsRaw ?? []) as PaymentAttempt[];
  const latestAttemptByObligation = new Map<string, PaymentAttempt>();
  for (const a of attempts) {
    if (!latestAttemptByObligation.has(a.obligation_id)) {
      latestAttemptByObligation.set(a.obligation_id, a); // first = most recent (query ordered desc)
    }
  }

  const obligationsWithAttempt = obligations.map((o) => ({
    ...o,
    latest_attempt: latestAttemptByObligation.get(o.id) ?? null,
  }));

  // Fetch queries
  const { data: queriesRaw } = await supabase
    .from("tenant_queries")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const queries: TenantQuery[] = (queriesRaw ?? []) as TenantQuery[];

  // Fetch latest active lease for this tenant
  const { data: leaseRaw } = await supabase
    .from("lease_agreements")
    .select(
      "id, lease_start, lease_end, monthly_rent, deposit_amount, payment_due_day, notice_period_days, pet_allowed, subletting_allowed, special_conditions, status, landlord_signed_at, tenant_signed_at",
    )
    .eq("tenant_id", tenant.id)
    .in("status", ["sent", "signed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch service categories + providers for tenant's province
  const { data: cats } = await supabase
    .from("service_categories")
    .select("*")
    .order("sort_order");
  const { data: provs } = await supabase
    .from("service_providers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const serviceCategories: ServiceCategory[] = (cats ??
    []) as ServiceCategory[];
  const serviceProviders: ServiceProvider[] = (provs ??
    []) as ServiceProvider[];

  // Next payable obligation: soonest upcoming due date, falling back to the
  // most recently overdue one if nothing is upcoming.
  const today = new Date().toISOString().split("T")[0];
  const payableObligations = obligations.filter(
    (o) => o.status !== "paid" && o.status !== "waived",
  );
  const upcoming = payableObligations
    .filter((o) => o.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const overdue = payableObligations
    .filter((o) => o.due_date < today)
    .sort((a, b) => b.due_date.localeCompare(a.due_date));
  const nextObligation = upcoming[0] ?? overdue[0] ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Top bar */}
      <header className="border-b border-slate-700">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="text-base font-bold text-white">PropTrust</span>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
            Tenant Portal
          </span>
        </div>
      </header>

      {/* Hero strip */}
      <div className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-1 text-2xl font-bold text-white">
          Hi, {tenant.full_name.split(" ")[0]} 👋
        </div>
        <p className="text-slate-400 text-sm">
          {property.name} · {property.address}
        </p>
      </div>

      {/* Portal body */}
      <div className="mx-auto max-w-2xl px-5 pb-12">
        <TenantPortal
          token={params.token}
          tenant={{
            id: tenant.id,
            full_name: tenant.full_name,
            email: tenant.email,
            phone: tenant.phone,
            monthly_rent: tenant.monthly_rent,
            lease_start: tenant.lease_start,
            lease_end: tenant.lease_end,
            portal_token: tenant.portal_token,
          }}
          property={{
            id: property.id,
            name: property.name,
            address: property.address,
            province: property.province,
          }}
          landlord={{
            full_name: landlord.full_name,
            email: landlord.email,
            phone: landlord.phone,
          }}
          initialObligations={obligationsWithAttempt}
          initialQueries={queries}
          serviceCategories={serviceCategories}
          serviceProviders={serviceProviders}
          nextObligation={nextObligation}
          initialLease={leaseRaw ?? null}
          devMode={process.env.NODE_ENV !== "production"}
          initialTab={searchParams.tab}
        />
      </div>
    </div>
  );
}
