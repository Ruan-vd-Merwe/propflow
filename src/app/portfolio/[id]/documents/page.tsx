import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { PropertyDocumentsClient } from "./PropertyDocumentsClient";

export const dynamic = "force-dynamic";

export default async function PropertyDocumentsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_landlord")
    .eq("id", user.id)
    .single();

  if (!profile?.is_landlord) redirect("/dashboard");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!property) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <a href="/portfolio" className="hover:text-slate-900">
            Portfolio
          </a>
          <span>/</span>
          <a
            href={`/portfolio/${params.id}`}
            className="hover:text-slate-900"
          >
            {property.name}
          </a>
          <span>/</span>
          <span className="text-slate-900">Documents</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Property Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500">{property.address}</p>
        </div>

        <PropertyDocumentsClient
          propertyId={params.id}
          ownerId={user.id}
        />
      </main>
    </div>
  );
}
