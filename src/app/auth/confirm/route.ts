import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthPath, resolveRoleFlags } from "@/lib/auth/roles";
import { NextResponse } from "next/server";

function getSafeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const safeNext = getSafeNext(searchParams.get("next"));

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL(
        "/login?error=missing_confirmation_params",
        request.url,
      ),
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error("[auth/confirm] verifyOtp failed:", error);
    return NextResponse.redirect(
      new URL(
        `/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const m = user.user_metadata ?? {};
    const { isLandlord, isTenant, isConnector } = resolveRoleFlags(m);

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: m.full_name ?? user.email ?? "",
      email: user.email ?? "",
      is_landlord: isLandlord,
      is_tenant: isTenant,
      is_connector: isConnector,
      user_type: isLandlord ? "landlord" : isTenant ? "tenant" : "connector",
      phone: (m.phone as string) ?? null,
      province: (m.province as string) ?? null,
      city: (m.city as string) ?? null,
      whatsapp_opted_in: m.whatsapp_opted_in ?? true,
      email_confirmed: true,
    });

    if (isTenant) {
      const { data: existing } = await supabase
        .from("tenant_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        try {
          await supabase.from("tenant_profiles").insert({
            user_id: user.id,
            sa_id_number: m.sa_id_number ?? null,
            current_area: m.current_area ?? null,
            current_province: m.current_province ?? null,
            looking_in_area: m.looking_in_area ?? null,
            looking_in_province: m.looking_in_province ?? null,
            budget_min: m.budget_min ?? null,
            budget_max: m.budget_max ?? null,
            move_in_date: m.move_in_date ?? null,
            lease_length_months: m.lease_length_months ?? null,
            employment_status: m.employment_status ?? null,
            monthly_income: m.monthly_income ?? null,
            is_visible: true,
            whatsapp_opted_in: m.whatsapp_opted_in ?? true,
          });
        } catch (e) {
          console.error("[auth/confirm] tenant_profiles insert failed:", e);
        }
      }
    }

    if (safeNext) {
      return NextResponse.redirect(new URL(safeNext, request.url));
    }

    return NextResponse.redirect(
      new URL(getPostAuthPath(isLandlord, isTenant, isConnector), request.url),
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
