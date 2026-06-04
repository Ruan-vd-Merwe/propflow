import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { LeaseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type LeaseRow = {
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number;
  status: LeaseStatus;
  xpello_enrolled: boolean;
  properties: { name: string; address: string } | null;
  tenants: { full_name: string } | null;
};

function StatusBadge({ status }: { status: LeaseStatus }) {
  const map: Record<LeaseStatus, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-amber-100 text-amber-700",
    signed: "bg-emerald-100 text-emerald-700",
    expired: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}

function XpelloBadge({ enrolled }: { enrolled: boolean }) {
  if (enrolled) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        Protected
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">
      Not enrolled
    </span>
  );
}

export default async function LeasesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase
    .from("lease_agreements")
    .select(`*, properties ( name, address ), tenants ( full_name )`)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  const rows: LeaseRow[] = (leases ?? []) as LeaseRow[];

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  function fmtRand(cents: number) {
    return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leases</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage lease agreements and legal protection
            </p>
          </div>
          <Link
            href="/leases/new"
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
            Create lease
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="card p-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="mt-4 font-semibold text-slate-700">
              No lease agreements yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Create your first lease to get started.
            </p>
            <Link
              href="/leases/new"
              className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Create lease
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[2fr_1.5fr_120px_120px_120px_80px] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 sm:grid">
              <span>Property</span>
              <span>Tenant</span>
              <span>Start date</span>
              <span>Monthly rent</span>
              <span>Status</span>
              <span>Xpello</span>
            </div>

            <div className="divide-y divide-slate-100">
              {rows.map((lease) => (
                <div
                  key={lease.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:grid sm:grid-cols-[2fr_1.5fr_120px_120px_120px_80px] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900 leading-tight">
                      {lease.properties?.name ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {lease.properties?.address}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700">
                    {lease.tenants?.full_name ?? "—"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {fmtDate(lease.lease_start)}
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {fmtRand(lease.monthly_rent)}
                  </p>
                  <StatusBadge status={lease.status} />
                  <XpelloBadge enrolled={lease.xpello_enrolled} />
                  <div className="sm:col-span-6 sm:hidden" />
                  <Link
                    href={`/leases/${lease.id}`}
                    className="text-xs font-medium text-blue-700 hover:underline sm:col-start-7"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
