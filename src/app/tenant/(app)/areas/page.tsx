import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TenantAreasContent } from "./TenantAreasContent";

export const dynamic = "force-dynamic";

export default async function TenantAreasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-white">
      <TenantAreasContent />
    </div>
  );
}
