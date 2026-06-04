import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { TenantQuery, QueryCategory, QueryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CATEGORY_CONFIG: Record<
  QueryCategory,
  { label: string; icon: string; badge: string }
> = {
  emergency: {
    label: "Emergency",
    icon: "!",
    badge: "bg-red-100 text-red-700",
  },
  maintenance: {
    label: "Maintenance",
    icon: "M",
    badge: "bg-amber-100 text-amber-700",
  },
  general: {
    label: "General",
    icon: "G",
    badge: "bg-slate-100 text-slate-600",
  },
};

const STATUS_CONFIG: Record<
  QueryStatus,
  { label: string; badge: string; dot: string }
> = {
  open: {
    label: "Open",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
};

export default async function QueriesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all tenant IDs for this landlord
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .eq("owner_id", user.id);

  const propIds = (properties ?? []).map((p) => p.id);
  const propByName = new Map((properties ?? []).map((p) => [p.id, p.name]));

  const { data: tenants } = propIds.length
    ? await supabase
        .from("tenants")
        .select("id, full_name, property_id, portal_token, access_token")
        .in("property_id", propIds)
    : { data: [] };

  const tenantIds = (tenants ?? []).map((t) => t.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantById = new Map((tenants ?? []).map((t: any) => [t.id, t]));

  const { data: queries } = tenantIds.length
    ? await supabase
        .from("tenant_queries")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const queryList = (queries ?? []) as TenantQuery[];

  // Stats
  const open = queryList.filter((q) => q.status === "open").length;
  const inProgress = queryList.filter((q) => q.status === "in_progress").length;
  const resolved = queryList.filter((q) => q.status === "resolved").length;
  const emergency = queryList.filter(
    (q) => q.category === "emergency" && q.status !== "resolved",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Tenant Queries</h1>
          <p className="mt-1 text-sm text-slate-500">
            Emergency board and maintenance requests
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {emergency > 0 && (
            <div className="card col-span-2 flex items-center gap-3 border-red-200 bg-red-50 p-4 sm:col-span-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-sm font-bold text-red-700">
                !
              </span>
              <div>
                <p className="text-2xl font-bold text-red-700">{emergency}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-red-500">
                  Emergency
                </p>
              </div>
            </div>
          )}
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{open}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Open
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              In Progress
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{resolved}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Resolved
            </p>
          </div>
        </div>

        {/* Tenant portal links */}
        {(tenants ?? []).length > 0 && (
          <div className="mb-6 card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Tenant portal links
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Share these links with your tenants so they can submit queries and
              check-ins.
            </p>
            <div className="divide-y divide-slate-100">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(tenants ?? []).map((t: any) => {
                const token = t.portal_token ?? t.access_token;
                const url = `/tenant/${token}`;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      {t.full_name}
                    </span>
                    <span className="font-mono text-xs text-violet-700 truncate max-w-xs">
                      {url}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Query list */}
        {queryList.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">No queries yet.</p>
            {(tenants ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                Add tenants to your properties first, then share their portal
                links.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                Share the portal links above with your tenants so they can
                submit queries.
              </p>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Sort: emergency first, then by date */}
            {[...queryList]
              .sort((a, b) => {
                const catPriority: Record<QueryCategory, number> = {
                  emergency: 0,
                  maintenance: 1,
                  general: 2,
                };
                const statusPriority: Record<QueryStatus, number> = {
                  open: 0,
                  in_progress: 1,
                  resolved: 2,
                };
                const catDiff =
                  catPriority[a.category] - catPriority[b.category];
                if (catDiff !== 0) return catDiff;
                const stDiff =
                  statusPriority[a.status] - statusPriority[b.status];
                if (stDiff !== 0) return stDiff;
                return (
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
                );
              })
              .map((query) => {
                const cat = CATEGORY_CONFIG[query.category];
                const status = STATUS_CONFIG[query.status];
                const tenant = tenantById.get(query.tenant_id);
                const prop = tenant ? propByName.get(tenant.property_id) : null;

                return (
                  <Link
                    key={query.id}
                    href={`/queries/${query.id}`}
                    className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 transition hover:bg-slate-50 last:border-0"
                  >
                    <span className="mt-0.5 text-xl">{cat.icon}</span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {query.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.badge}`}
                        >
                          {cat.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.badge}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {query.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {tenant?.full_name} · {prop} ·{" "}
                        {formatDate(query.created_at)}
                      </p>
                    </div>

                    <svg
                      className="mt-1 h-4 w-4 shrink-0 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}
