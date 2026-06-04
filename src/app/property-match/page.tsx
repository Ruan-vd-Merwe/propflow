import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import type { ScoreResult } from "@/lib/scoring/interest-engine";
import {
  MOCK_PROPERTY_SCORING_DATA,
  MOCK_PROPERTY_META,
  type PropertyWithMeta,
} from "./mock-data";
import { PropertyMatchClient } from "./PropertyMatchClient";

export const dynamic = "force-dynamic";

// Slim serialisable result — strips large insight objects before passing to client
export type SlimResult = {
  property_id: string;
  score: number;
  confidence: number;
  status: "ranked" | "rejected";
  match_reasons: string[];
  warnings: string[];
  rejected_reasons?: string[];
};

function slim(r: ScoreResult): SlimResult {
  return {
    property_id: r.property_id ?? "",
    score: r.score,
    confidence: r.confidence,
    status: r.status,
    match_reasons: r.match_reasons,
    warnings: r.warnings,
    rejected_reasons: r.rejected_reasons,
  };
}

export default async function PropertyMatchPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should redirect before we get here, but be safe
  if (!user) redirect("/login");

  // Load tenant profile
  const { data: tp } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const hasProfile = !!(tp?.budget_max && tp?.looking_in_area);

  if (!hasProfile) {
    return (
      <PropertyMatchClient
        hasProfile={false}
        results={[]}
        properties={[]}
        isDemo={false}
        tenantSummary={null}
      />
    );
  }

  const profile = mapTenantProfile(tp as Record<string, unknown>);

  // Load real listed properties
  const { data: rawProps } = await supabase
    .from("properties")
    .select("*")
    .eq("is_listed", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const hasRealProperties = (rawProps?.length ?? 0) > 0;
  const isDemo = !hasRealProperties;

  let results: SlimResult[];
  let properties: PropertyWithMeta[];

  if (hasRealProperties) {
    const propertyData = rawProps!.map((p) =>
      mapProperty(p as Record<string, unknown>),
    );
    const scored = rank_properties_for_tenant_interests(propertyData, profile);
    results = scored.map(slim);

    properties = rawProps!.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      suburb: p.suburb ? String(p.suburb) : null,
      province: p.province ? String(p.province) : null,
      rent: Number(p.asking_rent ?? 0) / 100, // cents → ZAR
      bedrooms: p.bedrooms != null ? Number(p.bedrooms) : null,
      property_type: p.property_type ? String(p.property_type) : null,
      photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
      available_from: p.available_from ? String(p.available_from) : null,
      pets_allowed: Boolean(p.pets_allowed),
    }));
  } else {
    // Demo mode: score mock properties against the tenant's real profile
    const scored = rank_properties_for_tenant_interests(
      MOCK_PROPERTY_SCORING_DATA,
      profile,
    );
    results = scored.map(slim);
    properties = MOCK_PROPERTY_META;
  }

  const tenantSummary = {
    area: String(tp.looking_in_area ?? ""),
    budget: Number(tp.budget_max ?? 0) / 100,
  };

  return (
    <PropertyMatchClient
      hasProfile={true}
      results={results}
      properties={properties}
      isDemo={isDemo}
      tenantSummary={tenantSummary}
    />
  );
}
