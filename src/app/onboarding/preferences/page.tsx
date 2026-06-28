import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "./PreferencesForm";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
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

  // If preferences already done, advance to next incomplete step
  if (tp?.preferences_complete) {
    redirect(
      tp.affordability_complete
        ? "/onboarding/verification"
        : "/onboarding/affordability",
    );
  }

  return (
    <PreferencesForm
      userId={user.id}
      existing={
        tp
          ? {
              currentArea: tp.current_area ?? "",
              currentProvince: tp.current_province ?? "",
              lookingArea: tp.looking_in_area ?? "",
              lookingProvince: tp.looking_in_province ?? "",
              budgetMin: tp.budget_min ? tp.budget_min / 100 : 3000,
              budgetMax: tp.budget_max ? tp.budget_max / 100 : 15000,
              moveInDate: tp.move_in_date ?? "",
              leaseLength: tp.lease_length_months ?? 12,
              hasPets: tp.has_pets ?? false,
              hasCar: tp.has_car ?? true,
              furnishedPreference: tp.furnished_preference ?? "no_preference",
              occupants: tp.occupants ?? null,
            }
          : null
      }
    />
  );
}
