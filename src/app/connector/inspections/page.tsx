import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConnectorInspectionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
      <p className="mt-2 text-sm text-slate-500">
        Property inspections assigned to you will appear here.
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="text-sm text-slate-400">No inspections scheduled.</p>
      </div>
    </main>
  );
}
