import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { FlatmateListing, FlatmateApplicant } from "@/lib/types";
import { FlatmateListingPanel } from "../dashboard/FlatmateListingPanel";

export const dynamic = "force-dynamic";

export default async function TenantFlatmatePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  let hasActiveLease = false;
  let flatmateListing: FlatmateListing | null = null;
  let flatmateApplicants: FlatmateApplicant[] = [];

  if (profile?.email) {
    const today = new Date().toISOString().split("T")[0];
    const service = createServiceClient();
    const { data: activeTenant } = await service
      .from("tenants")
      .select("id")
      .eq("email", profile.email)
      .or(`lease_end.is.null,lease_end.gte.${today}`)
      .limit(1)
      .maybeSingle();
    hasActiveLease = !!activeTenant;

    if (activeTenant) {
      const { data: listingRaw, error: listingErr } = await supabase
        .from("flatmate_listings")
        .select("*")
        .eq("created_by_tenant_id", activeTenant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (listingErr) {
        console.error("[tenant flatmate] flatmate_listings lookup failed:", listingErr.message);
      }
      flatmateListing = (listingRaw as FlatmateListing | null) ?? null;

      if (flatmateListing) {
        const { data: applicantsRaw, error: applicantsErr } = await supabase
          .from("flatmate_applicants")
          .select("*")
          .eq("listing_id", flatmateListing.id)
          .order("created_at", { ascending: false });
        if (applicantsErr) {
          console.error("[tenant flatmate] flatmate_applicants lookup failed:", applicantsErr.message);
        }
        flatmateApplicants = (applicantsRaw as FlatmateApplicant[]) ?? [];
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Replacing a flatmate</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create an opportunity for your current place and review applicants.
            </p>
          </div>
          <Link
            href="/tenant/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>

        {!hasActiveLease ? (
          <div className="card p-10 text-center">
            <p className="text-slate-500">
              This is for tenants with a current lease. Add your lease details first to set this up.
            </p>
            <Link
              href="/tenant/applications#lease-upload"
              className="mt-4 inline-block rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Add your lease details
            </Link>
          </div>
        ) : (
          <FlatmateListingPanel
            initialListing={flatmateListing}
            initialApplicants={flatmateApplicants}
          />
        )}
      </main>
    </div>
  );
}
