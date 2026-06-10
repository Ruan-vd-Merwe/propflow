import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { SetupForm } from "./SetupForm";
import type { PropertyWithFinance, Tenant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PropertySetupPage({
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

  // Load tenants to calculate current monthly rent for live preview
  const { data: tenantsRaw } = await supabase
    .from("tenants")
    .select("id, monthly_rent")
    .eq("property_id", property.id);

  const tenants: Pick<Tenant, "id" | "monthly_rent">[] = tenantsRaw ?? [];
  const totalRentCents = tenants.reduce((s, t) => s + t.monthly_rent, 0);

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
            {(property as PropertyWithFinance).name}
          </a>
          <span>/</span>
          <span className="text-slate-900">Financial Setup</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Financial Setup
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {(property as PropertyWithFinance).address}
          </p>
        </div>

        <SetupForm
          property={property as PropertyWithFinance}
          totalRentCents={totalRentCents}
        />
      </main>
    </div>
  );
}
