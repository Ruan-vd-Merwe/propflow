import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/anon";
import { ApplicationForm } from "./ApplicationForm";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: { propertyId: string };
}) {
  const supabase = createAnonClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address")
    .eq("id", params.propertyId)
    .single();

  if (!property) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            PropTrust
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Property context */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Rental Application
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {property.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{property.address}</p>
        </div>

        <ApplicationForm propertyId={property.id} />
      </main>
    </div>
  );
}
