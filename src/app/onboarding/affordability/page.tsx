import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AffordabilityForm } from "./AffordabilityForm";

export const dynamic = "force-dynamic";

export default async function AffordabilityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Must complete preferences first
  if (!tp?.preferences_complete) {
    redirect("/onboarding/preferences");
  }

  // Already done → advance
  if (tp?.affordability_complete) {
    redirect("/onboarding/verification");
  }

  return (
    <AffordabilityForm
      userId={user.id}
      existing={
        tp
          ? {
              employmentStatus: tp.employment_status ?? "",
              incomeBand: tp.income_band ?? "",
            }
          : null
      }
    />
  );
}
