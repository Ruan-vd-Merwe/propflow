import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

type ServiceCategory = {
  id: string;
  name: string;
  icon: string | null;
};

type OwnListing = {
  id: string;
  name: string;
  area: string | null;
  province: string | null;
  rate_description: string | null;
  is_active: boolean;
  category_id: string;
};

export default async function ListYourServicePage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const [{ data: cats }, { data: myListingsRaw }] = await Promise.all([
    service
      .from("service_categories")
      .select("id, name, icon")
      .order("sort_order"),
    service
      .from("service_providers")
      .select("id, name, area, province, rate_description, is_active, category_id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const categories: ServiceCategory[] = (cats ?? []) as ServiceCategory[];
  const myListings: OwnListing[] = (myListingsRaw ?? []) as OwnListing[];
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/services" className="hover:text-slate-900">
            Services
          </Link>
          <span>/</span>
          <span className="text-slate-900">List your service</span>
        </nav>

        <h1 className="mb-1 text-2xl font-bold text-slate-900">
          List your service
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          Offer your skills to residents in your community. Listings are visible
          to other PropTrust members — no payments handled here.
        </p>

        {/* Status banners */}
        {searchParams.created && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            Your listing is live!
          </div>
        )}
        {searchParams.updated && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
            Listing updated.
          </div>
        )}
        {searchParams.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {searchParams.error === "missing_fields"
              ? "Please fill in category and name."
              : searchParams.error}
          </div>
        )}

        {/* ── Registration form ──────────────────────────────────────────── */}
        <div className="card mb-8 p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">
            New listing
          </h2>

          <form method="POST" action="/api/services/providers" className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Category *
              </label>
              <select name="category_id" className="input-field" required>
                <option value="">Select a category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Business / service name *
              </label>
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="e.g. John's Garden Service"
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  placeholder="0821234567"
                  maxLength={15}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  WhatsApp number
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  className="input-field"
                  placeholder="0821234567"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Area / suburb
                </label>
                <input
                  type="text"
                  name="area"
                  className="input-field"
                  placeholder="e.g. Sea Point, Sandton"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Province
                </label>
                <select name="province" className="input-field">
                  <option value="">Select province…</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Rate description
              </label>
              <input
                type="text"
                name="rate_description"
                className="input-field"
                placeholder="e.g. From R250/hour, first hour minimum"
                maxLength={200}
              />
              <p className="mt-1 text-xs text-slate-400">
                Free text — no pricing engine, just a description for enquirers.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Publish listing
            </button>
          </form>
        </div>

        {/* ── My listings ────────────────────────────────────────────────── */}
        {myListings.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              My listings
            </h2>
            <div className="space-y-3">
              {myListings.map((listing) => {
                const cat = catMap.get(listing.category_id);
                return (
                  <div
                    key={listing.id}
                    className="card flex items-center gap-4 p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {listing.name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            listing.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {listing.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {cat ? `${cat.icon ?? ""} ${cat.name}` : ""}
                        {listing.area ? ` · ${listing.area}` : ""}
                        {listing.province ? `, ${listing.province}` : ""}
                      </p>
                      {listing.rate_description && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {listing.rate_description}
                        </p>
                      )}
                    </div>

                    <form
                      method="POST"
                      action={`/api/services/providers/${listing.id}`}
                    >
                      <input
                        type="hidden"
                        name="is_active"
                        value={listing.is_active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          listing.is_active
                            ? "border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            : "border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {listing.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
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
