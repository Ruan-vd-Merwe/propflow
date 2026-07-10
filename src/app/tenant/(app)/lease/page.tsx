import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { LogMaintenanceButton } from "../dashboard/LogMaintenanceButton";
import { DetailHeader } from "../DetailHeader";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

export default async function TenantLeasePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  let hasActiveLease = false;
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
      .select("id, lease_start, lease_end, monthly_rent")
      .eq("email", profile.email)
      .or(`lease_end.is.null,lease_end.gte.${today}`)
      .limit(1)
      .maybeSingle();
    hasActiveLease = !!activeTenant;

    if (activeTenant) {
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
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6 sm:py-8">
        <DetailHeader title="Lease vault" />

        {!hasActiveLease ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm leading-relaxed text-slate-500">
              Nothing added yet. Add your lease once so rent, deposit, and notice period are all
              in one place for next time.
            </p>
            <Link
              href="/tenant/applications#lease-upload"
              className="mt-4 inline-block rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add rental details
            </Link>
          </div>
        ) : (
          <div className="card p-5">
            <ul className="divide-y divide-slate-100">
              <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-slate-600">Lease start and end date</span>
                <span className="font-medium text-slate-900">
                  {currentLease?.lease_start ? fmtDate(currentLease.lease_start) : "Not set"} to{" "}
                  {currentLease?.lease_end ? fmtDate(currentLease.lease_end) : "month to month"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-slate-600">Monthly rent</span>
                <span className="font-medium text-slate-900">
                  {currentLease?.monthly_rent ? fmtRand(currentLease.monthly_rent) : "Not added yet"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-slate-600">Deposit</span>
                <span
                  className={
                    currentLease?.deposit_amount
                      ? "font-medium text-slate-900"
                      : "text-slate-400"
                  }
                >
                  {currentLease?.deposit_amount ? fmtRand(currentLease.deposit_amount) : "Not added yet"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-slate-600">Notice period</span>
                <span
                  className={
                    currentLease?.notice_period_days
                      ? "font-medium text-slate-900"
                      : "text-slate-400"
                  }
                >
                  {currentLease?.notice_period_days
                    ? `${currentLease.notice_period_days} days`
                    : "Not added yet"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-slate-600">Pets and subletting</span>
                <span
                  className={
                    currentLease?.pet_allowed !== null && currentLease?.subletting_allowed !== null
                      ? "font-medium text-slate-900"
                      : "text-slate-400"
                  }
                >
                  {currentLease?.pet_allowed !== null && currentLease?.subletting_allowed !== null
                    ? `Pets ${currentLease?.pet_allowed ? "allowed" : "not allowed"}, subletting ${
                        currentLease?.subletting_allowed ? "allowed" : "not allowed"
                      }`
                    : "Not added yet"}
                </span>
              </li>
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/tenant/applications#lease-upload"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Update lease details
              </Link>
              <LogMaintenanceButton
                hasActiveLease={hasActiveLease}
                tenantEmail={profile?.email}
                tenantName={profile?.full_name}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
