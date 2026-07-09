import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import type { TenantProfile, PropertyListing } from "@/lib/types";
import { MatchesContent } from "./MatchesContent";

export const dynamic = "force-dynamic";

export default async function TenantMatchesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tp }, { data: rawProps }] = await Promise.all([
    supabase.from("tenant_profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("properties")
      .select("*")
      .in("status", ["available", "available_from"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const tenantProfile = tp as TenantProfile | null;
  if (!tenantProfile) redirect("/onboarding/preferences");

  const prefsDone = tenantProfile.preferences_complete;

  const scoredProperties = (() => {
    const props = (rawProps ?? []) as PropertyListing[];
    if (props.length === 0 || !prefsDone) return [];
    const mapped = mapTenantProfile(tenantProfile as unknown as Record<string, unknown>);
    const propData = props.map((p) => mapProperty(p as unknown as Record<string, unknown>));
    const results = rank_properties_for_tenant_interests(propData, mapped);
    const propById = new Map(props.map((p) => [p.id, p]));
    return results
      .filter((r) => r.status === "ranked" && r.property_id && propById.has(r.property_id))
      .map((r) => ({
        property: propById.get(r.property_id!)! as PropertyListing,
        score: r.score,
        match_reasons: r.match_reasons,
      }));
  })();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Finding a place</h1>
            <p className="mt-1 text-sm text-slate-500">
              Properties matched to your search preferences.
            </p>
          </div>
          <Link
            href="/tenant/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            {tenantProfile.looking_in_area && (
              <>
                Looking in {tenantProfile.looking_in_area}
                {tenantProfile.looking_in_province ? `, ${tenantProfile.looking_in_province}` : ""}
                {" · "}
              </>
            )}
            {tenantProfile.budget_max ? (
              <>
                R{((tenantProfile.budget_min ?? 0) / 100).toLocaleString()} to R
                {(tenantProfile.budget_max / 100).toLocaleString()}/mo
              </>
            ) : (
              "No budget set"
            )}
          </p>
          <Link
            href="/tenant/preferences"
            className="shrink-0 text-sm font-medium text-blue-700 hover:underline"
          >
            Edit preferences
          </Link>
        </div>

        {scoredProperties.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-slate-500">No matching properties yet.</p>
            {!prefsDone ? (
              <Link
                href="/onboarding/preferences"
                className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
              >
                Add preferences to see matches →
              </Link>
            ) : (
              <Link
                href="/tenant/browse"
                className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
              >
                Browse all properties →
              </Link>
            )}
          </div>
        ) : (
          <MatchesContent matches={scoredProperties} />
        )}
      </main>
    </div>
  );
}
