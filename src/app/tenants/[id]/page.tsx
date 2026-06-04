import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { RiskBadge } from "@/components/RiskBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { calculateRiskScore } from "@/lib/risk";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysLate(payment: Payment): number | null {
  if (!payment.paid_date || payment.status === "missed") return null;
  const diff =
    new Date(payment.paid_date).getTime() -
    new Date(payment.due_date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

export default async function TenantPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, properties!inner(owner_id, name, id)")
    .eq("id", params.id)
    .single();

  if (!tenant) notFound();

  // Ensure the property belongs to this landlord
  if ((tenant.properties as { owner_id: string }).owner_id !== user.id)
    notFound();

  const property = tenant.properties as {
    id: string;
    name: string;
    owner_id: string;
  };

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("due_date", { ascending: false });

  const paymentList: Payment[] = payments ?? [];
  const risk = calculateRiskScore(paymentList);

  const paid = paymentList.filter((p) => p.status === "paid").length;
  const late = paymentList.filter((p) => p.status === "late").length;
  const missed = paymentList.filter((p) => p.status === "missed").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href={`/properties/${property.id}`}
            className="hover:text-slate-900"
          >
            {property.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">{tenant.full_name}</span>
        </nav>

        {/* Tenant header */}
        <div className="card mb-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                {tenant.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {tenant.full_name}
                </h1>
                <p className="text-sm text-slate-500">{tenant.email}</p>
                {tenant.phone && (
                  <p className="text-sm text-slate-500">{tenant.phone}</p>
                )}
              </div>
            </div>
            <RiskBadge risk={risk} size="lg" />
          </div>

          {/* Details grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
            <Detail
              label="Monthly rent"
              value={formatRand(tenant.monthly_rent)}
            />
            <Detail
              label="Lease start"
              value={formatDate(tenant.lease_start)}
            />
            <Detail label="Lease end" value={formatDate(tenant.lease_end)} />
            <Detail label="Property" value={property.name} />
          </div>
        </div>

        {/* Risk breakdown */}
        <div className="card mb-6 p-6">
          <h2 className="mb-4 font-semibold text-slate-900">
            Risk Score Breakdown
          </h2>

          <div className="mb-4 flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-900">
              {risk.score}
            </span>
            <span className="mb-1 text-lg text-slate-400">/ 100</span>
          </div>

          {/* Score bar */}
          <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                risk.colour === "green"
                  ? "bg-emerald-500"
                  : risk.colour === "amber"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${risk.score}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreStat label="On-time" value={paid} colour="text-emerald-600" />
            <ScoreStat
              label="Late"
              value={late}
              colour={late > 0 ? "text-amber-600" : "text-slate-400"}
            />
            <ScoreStat
              label="Missed"
              value={missed}
              colour={missed > 0 ? "text-red-600" : "text-slate-400"}
            />
            <ScoreStat
              label="Streak bonus"
              value={`+${risk.breakdown.streak * 10}`}
              colour={
                risk.breakdown.streak > 0
                  ? "text-emerald-600"
                  : "text-slate-400"
              }
            />
          </div>
        </div>

        {/* Payment history */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Payment History
              <span className="ml-2 text-sm font-normal text-slate-400">
                {paymentList.length} records
              </span>
            </h2>
          </div>

          {paymentList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No payment records yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header row */}
              <div className="grid grid-cols-4 px-6 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                <span>Due date</span>
                <span>Paid date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {paymentList.map((p) => {
                const late = daysLate(p);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-4 items-center px-6 py-3.5"
                  >
                    <span className="text-sm text-slate-700">
                      {formatDate(p.due_date)}
                    </span>
                    <span className="text-sm text-slate-700">
                      {formatDate(p.paid_date)}
                      {late !== null && (
                        <span className="ml-1 text-xs text-amber-500">
                          +{late}d
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatRand(p.amount)}
                    </span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ScoreStat({
  label,
  value,
  colour,
}: {
  label: string;
  value: number | string;
  colour: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={`text-xl font-bold ${colour}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
