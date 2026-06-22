import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { EditPropertyForm } from "./EditPropertyForm";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!property) notFound();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, full_name, email, phone, monthly_rent, lease_start, lease_end")
    .eq("property_id", property.id)
    .order("full_name");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href={`/properties/${params.id}`}
            className="hover:text-slate-900"
          >
            {property.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">Edit</span>
        </nav>

        <EditPropertyForm
          property={property}
          tenants={tenants ?? []}
        />
      </main>
    </div>
  );
}
