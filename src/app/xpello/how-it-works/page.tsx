import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { HowXpelloWorksConcept } from "./HowXpelloWorksConcept";

export const dynamic = "force-dynamic";

export default async function HowXpelloWorksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <HowXpelloWorksConcept />
      </main>
    </div>
  );
}
