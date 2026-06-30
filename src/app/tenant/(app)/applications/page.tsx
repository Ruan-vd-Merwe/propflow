import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AppRow = {
  id: string;
  property_id: string;
  status: string;
  created_at: string;
  properties: { name: string; suburb: string | null } | null;
};

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Under review", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved",     cls: "bg-green-100 text-green-700" },
  rejected: { label: "Not approved", cls: "bg-red-100 text-red-700"    },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TenantApplicationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appsRaw } = await supabase
    .from("tenant_applications")
    .select("id, property_id, status, created_at, properties(name, suburb)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const applications = (appsRaw ?? []) as unknown as AppRow[];

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
            <p className="mt-1 text-sm text-slate-500">
              Properties you&apos;ve applied to via PropTrust
            </p>
          </div>
          <Link
            href="/tenant/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">
              You haven&apos;t applied to any properties yet.
            </p>
            <Link
              href="/tenant/browse"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Find Properties
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Table header (desktop) */}
            <div className="hidden grid-cols-[1fr_160px_120px] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 sm:grid">
              <span>Property</span>
              <span>Status</span>
              <span>Applied</span>
            </div>

            <div className="divide-y divide-slate-100">
              {applications.map((app) => {
                const s =
                  APP_STATUS[app.status] ?? {
                    label: app.status,
                    cls: "bg-slate-100 text-slate-500",
                  };
                const prop = app.properties;
                return (
                  <div
                    key={app.id}
                    className="flex flex-col gap-2 px-6 py-4 sm:grid sm:grid-cols-[1fr_160px_120px] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {prop?.name ?? "Property"}
                      </p>
                      {prop?.suburb && (
                        <p className="text-xs text-slate-400">{prop.suburb}</p>
                      )}
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                    >
                      {s.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {fmtDate(app.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
