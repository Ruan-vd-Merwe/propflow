import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type {
  BodyCorpDocument,
  BodyCorpFlag,
  BodyCorpFlagCategory,
} from "@/lib/types";
import { FlagResolveButton } from "./FlagResolveButton";

export const dynamic = "force-dynamic";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SEVERITY_CONFIG = {
  red: {
    label: "Red",
    badge: "bg-red-100 text-red-700",
    border: "border-red-200 bg-red-50",
  },
  amber: {
    label: "Amber",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200 bg-amber-50",
  },
  green: {
    label: "Green",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200 bg-emerald-50",
  },
};

const CATEGORY_LABEL: Record<BodyCorpFlagCategory, string> = {
  special_levy: "Special Levy",
  maintenance: "Maintenance",
  legal: "Legal",
  financial: "Financial",
  action_required: "Action Required",
};

export default async function BodyCorpDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: doc } = await supabase
    .from("body_corporate_documents")
    .select("*, properties!inner(name, owner_id)")
    .eq("id", params.id)
    .single();

  if (!doc) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((doc.properties as any).owner_id !== user.id) notFound();

  const document = doc as BodyCorpDocument & { properties: { name: string } };
  const propName = (doc.properties as { name: string }).name;

  const { data: flagsRaw } = await supabase
    .from("body_corporate_flags")
    .select("*")
    .eq("document_id", params.id)
    .order("severity")
    .order("created_at");

  const flags = (flagsRaw ?? []) as BodyCorpFlag[];
  const sortedFlags = [...flags].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    const sdiff = order[a.severity] - order[b.severity];
    if (sdiff !== 0) return sdiff;
    // unresolved first
    return Number(a.resolved) - Number(b.resolved);
  });

  const unresolved = flags.filter((f) => !f.resolved).length;
  const redCount = flags.filter(
    (f) => f.severity === "red" && !f.resolved,
  ).length;
  const amberCount = flags.filter(
    (f) => f.severity === "amber" && !f.resolved,
  ).length;

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
          <Link href="/body-corporate" className="hover:text-slate-900">
            Body Corporate
          </Link>
          <span>/</span>
          <span className="text-slate-900">{document.title}</span>
        </nav>

        {/* Header */}
        <div className="card mb-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {document.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {propName}
                {document.meeting_date
                  ? ` · Meeting: ${formatDate(document.meeting_date)}`
                  : ""}
                {" · "}Parsed {formatDate(document.created_at)}
                {document.source === "pdf" && document.filename
                  ? ` · ${document.filename}`
                  : ""}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              {redCount > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  🔴 {redCount}
                </span>
              )}
              {amberCount > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  🟡 {amberCount}
                </span>
              )}
              {unresolved === 0 && flags.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  ✓ All resolved
                </span>
              )}
            </div>
          </div>

          {/* AI Summary */}
          {document.claude_summary && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI Summary
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {document.claude_summary}
              </p>
            </div>
          )}
        </div>

        {/* Flags */}
        {flags.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-500">
              No flags were extracted from this document.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">
              Flagged Items
              <span className="ml-2 text-sm font-normal text-slate-400">
                {unresolved} unresolved · {flags.length} total
              </span>
            </h2>

            {sortedFlags.map((flag) => {
              const sev = SEVERITY_CONFIG[flag.severity];
              return (
                <div
                  key={flag.id}
                  className={`card border p-5 transition-opacity ${
                    flag.resolved ? "opacity-50" : ""
                  } ${sev.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${sev.badge}`}
                        >
                          {sev.label}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
                          {CATEGORY_LABEL[flag.category]}
                        </span>
                        {flag.requires_owner_action && !flag.resolved && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                            Action Required
                          </span>
                        )}
                        {flag.resolved && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            ✓ Resolved
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-semibold text-slate-900">
                        {flag.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {flag.description}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-4">
                        {flag.amount_zar != null && (
                          <p className="text-sm font-semibold text-slate-800">
                            R {flag.amount_zar.toLocaleString("en-ZA")}
                          </p>
                        )}
                        {flag.due_date && (
                          <p className="text-sm text-slate-500">
                            Due: {formatDate(flag.due_date)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Resolve toggle */}
                    <FlagResolveButton
                      documentId={params.id}
                      flagId={flag.id}
                      resolved={flag.resolved}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete document */}
        <div className="mt-8 flex justify-end">
          <DeleteDocButton documentId={params.id} />
        </div>
      </main>
    </div>
  );
}

// Tiny server-side placeholder — actual interaction is via FlagResolveButton
function DeleteDocButton({ documentId }: { documentId: string }) {
  return (
    <form action={`/api/body-corporate/${documentId}`} method="DELETE">
      <DeleteForm documentId={documentId} />
    </form>
  );
}

import { DeleteForm } from "./FlagResolveButton";
