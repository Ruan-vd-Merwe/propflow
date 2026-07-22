import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ApplyPanel } from "./ApplyPanel";

export const dynamic = "force-dynamic";

export default async function FlatmateListingPage({
  params,
}: {
  params: { token: string };
}) {
  const service = createServiceClient();

  // Token lookup goes through the service role key. flatmate_listings has
  // no public RLS SELECT policy, same caution as /tenant/[token].
  const { data: listing, error: listingErr } = await service
    .from("flatmate_listings")
    .select(
      `id, status, note, rent_portion_cents, move_in_date,
       properties ( suburb, province )`,
    )
    .eq("share_token", params.token)
    .single();

  if (listingErr || !listing) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (listing as any).properties as {
    suburb: string | null;
    province: string | null;
  } | null;

  // If the visitor is signed in, read their own TrustScore (verification
  // status) so the panel knows whether to show the apply form or route them
  // into TrustScore verification first. Anonymous visitors get null.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let visitorVerificationStatus: string | null = null;
  if (user) {
    const { data: tp, error: tpErr } = await supabase
      .from("tenant_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (tpErr) {
      console.error("[flatmate page] tenant_profiles lookup failed:", tpErr.message);
    }
    visitorVerificationStatus = tp?.verification_status ?? "unverified";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="border-b border-slate-700">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
          <span className="text-base font-bold text-white">PropTrust</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
            Flatmate Finder
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-8">
        <ApplyPanel
          token={params.token}
          listing={{
            status: listing.status,
            note: listing.note,
            rentPortionCents: listing.rent_portion_cents,
            moveInDate: listing.move_in_date,
            suburb: property?.suburb ?? null,
            province: property?.province ?? null,
          }}
          visitorVerificationStatus={visitorVerificationStatus}
        />
      </main>
    </div>
  );
}
