import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerificationForm } from "./VerificationForm";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tenant_profiles")
    .select("preferences_complete, affordability_complete, verification_status")
    .eq("user_id", user.id)
    .single();

  // Must complete prior steps first
  if (!tp?.preferences_complete) {
    redirect("/onboarding/preferences");
  }
  if (!tp?.affordability_complete) {
    redirect("/onboarding/affordability");
  }

  return (
    <VerificationForm
      userId={user.id}
      currentStatus={tp?.verification_status ?? "unverified"}
    />
  );
}
