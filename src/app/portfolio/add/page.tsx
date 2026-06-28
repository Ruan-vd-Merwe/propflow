import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { AddPropertyFlow } from "./AddPropertyFlow";

export const dynamic = "force-dynamic";

export default async function AddPropertyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_landlord, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_landlord) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <a href="/portfolio" className="hover:text-slate-900">
            Portfolio
          </a>
          <span>/</span>
          <span className="text-slate-900">Add property</span>
        </nav>
        <AddPropertyFlow />
      </main>
    </div>
  );
}
