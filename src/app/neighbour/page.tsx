import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

export const dynamic = "force-dynamic";

const PROVINCES = [
  "Western Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Free State",
  "Northern Cape",
];

const OFFERS = [
  { slug: "welcome_newcomer", label: "Welcome newcomers" },
  { slug: "area_orientation", label: "Area orientation tips" },
  { slug: "pet_sitting", label: "Pet sitting" },
  { slug: "package_collection", label: "Package collection" },
  { slug: "emergency_contact", label: "Emergency contact" },
  { slug: "local_advice", label: "Local advice & recommendations" },
];

type NeighbourProfile = {
  id: string;
  user_id: string;
  offers: string[];
  area: string | null;
  province: string | null;
  is_active: boolean;
};

export default async function NeighbourPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: npRaw }, { count: endorsementCount }] = await Promise.all([
    supabase
      .from("neighbour_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("neighbour_endorsements")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", user.id),
  ]);

  const profile = npRaw as NeighbourProfile | null;
  const count = endorsementCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/tenant/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900">Good Neighbour</span>
        </nav>

        {/* Header + badge */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Be a Good Neighbour
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Offer small acts of goodwill to your community. No money involved
              — just reputation.
            </p>
          </div>
          {profile && count > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                Good Neighbour
              </span>
              <span className="text-xs text-slate-400">
                {count} endorsement{count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {profile && count === 0 && profile.is_active && (
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
              Good Neighbour
            </span>
          )}
        </div>

        {/* Status banners */}
        {searchParams.saved && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {profile?.is_active
              ? "Your Good Neighbour profile is live!"
              : "Your profile has been updated."}
          </div>
        )}
        {searchParams.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {searchParams.error}
          </div>
        )}

        {/* Opt-in explainer (only when not yet opted in) */}
        {!profile && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-900">
              How it works
            </p>
            <ul className="mt-2 space-y-1 text-sm text-emerald-800">
              <li>✓ Opt in and choose what you&apos;re willing to offer</li>
              <li>✓ Other members can endorse you for being helpful</li>
              <li>✓ Endorsements build your Good Neighbour reputation</li>
              <li>✓ Zero payments — purely goodwill</li>
            </ul>
          </div>
        )}

        {/* ── Profile form ───────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">
            {profile ? "Your Good Neighbour profile" : "Opt in"}
          </h2>

          <form method="POST" action="/api/neighbour" className="space-y-5">
            {/* Offers */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">
                What are you happy to offer? (select all that apply)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {OFFERS.map((offer) => {
                  const checked = profile?.offers.includes(offer.slug) ?? false;
                  return (
                    <label
                      key={offer.slug}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800"
                    >
                      <input
                        type="checkbox"
                        name="offers"
                        value={offer.slug}
                        defaultChecked={checked}
                        className="accent-emerald-600"
                      />
                      {offer.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Area */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Your area / suburb
                </label>
                <input
                  type="text"
                  name="area"
                  className="input-field"
                  placeholder="e.g. Sea Point"
                  defaultValue={profile?.area ?? ""}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Province
                </label>
                <select
                  name="province"
                  className="input-field"
                  defaultValue={profile?.province ?? ""}
                >
                  <option value="">Select province…</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active toggle — if already opted in, allow opting out */}
            {profile && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">
                  Profile visible to community
                </span>
                <input
                  type="hidden"
                  name="is_active"
                  value={profile.is_active ? "true" : "false"}
                />
                <a
                  href={`/api/neighbour`}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 hover:underline"
                >
                  {/* Opt-out handled via separate toggle form below */}
                </a>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    profile.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {profile.is_active ? "Visible" : "Hidden"}
                </span>
              </div>
            )}

            {!profile && (
              <input type="hidden" name="is_active" value="true" />
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {profile ? "Save changes" : "Join as a Good Neighbour"}
            </button>
          </form>

          {/* Opt-out toggle if active */}
          {profile?.is_active && (
            <form method="POST" action="/api/neighbour" className="mt-3">
              <input type="hidden" name="is_active" value="false" />
              <input
                type="hidden"
                name="area"
                value={profile.area ?? ""}
              />
              <input
                type="hidden"
                name="province"
                value={profile.province ?? ""}
              />
              {profile.offers.map((o) => (
                <input key={o} type="hidden" name="offers" value={o} />
              ))}
              <button
                type="submit"
                className="text-xs text-slate-400 hover:text-red-500 hover:underline"
              >
                Opt out of the Good Neighbour programme
              </button>
            </form>
          )}
        </div>

        {/* ── Endorsement count card ─────────────────────────────────────── */}
        {profile && (
          <div className="mt-6 card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Your endorsements
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Received from other PropTrust members who found you helpful.
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-xl font-bold text-emerald-700">
                  {count}
                </span>
              </div>
            </div>
            {count === 0 && (
              <p className="mt-3 text-xs text-slate-400">
                Endorsements will appear here as you help your neighbours.
                {/* TODO: add endorsement button when neighbour discovery UI is built */}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
