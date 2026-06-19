import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { TenantBrowseContent } from "./TenantBrowseContent";
import type { PropertyListing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TenantBrowsePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawProps } = await supabase
    .from("properties")
    .select("*")
    .in("status", ["available", "available_from"])
    .order("created_at", { ascending: false })
    .limit(100);

  const properties = (rawProps ?? []) as PropertyListing[];

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <TenantBrowseContent properties={properties} />
    </div>
  );
}
