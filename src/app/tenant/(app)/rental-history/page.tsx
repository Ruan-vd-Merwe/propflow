import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetailHeader } from "../DetailHeader";

export const dynamic = "force-dynamic";

export default async function TenantRentalHistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6 sm:py-8">
        <DetailHeader title="Rental history" />

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-sm leading-relaxed text-slate-500">
            Nothing on record yet. Past rentals you add will show up here so landlords can see
            your track record.
          </p>
        </div>
      </main>
    </div>
  );
}
