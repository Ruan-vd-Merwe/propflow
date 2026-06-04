import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { QueryDetail } from "./QueryDetail";

export const dynamic = "force-dynamic";

const CATEGORY_CONFIG = {
  emergency: {
    label: "Emergency",
    icon: "!",
    colour: "text-red-700",
    bg: "bg-red-50",
  },
  maintenance: {
    label: "Maintenance",
    icon: "M",
    colour: "text-amber-700",
    bg: "bg-amber-50",
  },
  general: {
    label: "General",
    icon: "G",
    colour: "text-slate-700",
    bg: "bg-slate-50",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function QueryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: query } = await supabase
    .from("tenant_queries")
    .select(
      `
      *,
      tenants!inner (
        full_name, email, phone,
        properties!inner ( name, address, owner_id )
      )
    `,
    )
    .eq("id", params.id)
    .single();

  if (!query) notFound();

  // Verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (query as any).tenants.properties;
  if (property.owner_id !== user.id) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant = (query as any).tenants;

  const cat = CATEGORY_CONFIG[query.category as keyof typeof CATEGORY_CONFIG];

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/queries" className="hover:text-slate-900">
            Queries
          </Link>
          <span>/</span>
          <span className="text-slate-900">{query.title}</span>
        </nav>

        {/* Header */}
        <div
          className={`card mb-5 p-6 ${query.category === "emergency" ? "border-red-200" : ""}`}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">{cat.icon}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${cat.colour}`}
                >
                  {cat.label}
                  {query.subcategory &&
                    ` · ${query.subcategory.replace(/_/g, " ")}`}
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold text-slate-900">
                {query.title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {tenant.full_name} · {property.name} ·{" "}
                {formatDate(query.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {query.description}
            </p>
          </div>

          {/* Tenant contact */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Tenant contact
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {tenant.full_name}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${tenant.email}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {tenant.email}
              </a>
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {tenant.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Detail / actions panel */}
        <QueryDetail
          queryId={query.id}
          currentStatus={query.status}
          currentNotes={query.landlord_notes ?? ""}
        />
      </main>
    </div>
  );
}
