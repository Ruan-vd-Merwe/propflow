import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { XpelloLandlordConcept } from "./XpelloLandlordConcept";

export const dynamic = "force-dynamic";

export default async function XpelloLandlordPage({
  searchParams,
}: {
  searchParams: { property_id?: string; property_name?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <XpelloLandlordConcept propertyName={searchParams.property_name} />
      </main>
    </div>
  );
}
