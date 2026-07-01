import { createClient } from "@/lib/supabase/server";
import { getPostAuthPath, resolveRoleFlags } from "@/lib/auth/roles";
import { NextResponse } from "next/server";

function getSafeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const safeNext = getSafeNext(requestUrl.searchParams.get("next"));
  const supabase = createClient();

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_auth_code", request.url),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const m = user.user_metadata ?? {};
    const { isLandlord, isTenant, isConnector } = resolveRoleFlags(m);

    // Upsert profile with role flags
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: m.full_name ?? user.email ?? "",
      email: user.email ?? "",
      is_landlord: isLandlord,
      is_tenant: isTenant,
      is_connector: isConnector,
      user_type: isLandlord ? "landlord" : isTenant ? "tenant" : "connector",
      phone: m.phone ?? null,
      province: m.province ?? null,
      city: m.city ?? null,
      whatsapp_opted_in: m.whatsapp_opted_in ?? true,
    });

    if (profileErr) {
      console.error("[auth/callback] profiles upsert failed:", profileErr);
      return NextResponse.redirect(
        new URL(
          `/login?error=profile_write_failed&message=${encodeURIComponent(profileErr.message)}`,
          request.url,
        ),
      );
    }

    // Create tenant_profiles row on first confirmation
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
            whatsapp_opted_in: m.whatsapp_opted_in ?? true,
          });
        } catch (e) {
          console.error("tenant_profiles insert failed:", e);
        }
      }
    }

    // Honour caller-supplied next path (e.g. from magic link or resend flow),
    // otherwise fall back to role-based default
    if (safeNext) {
      return NextResponse.redirect(new URL(safeNext, request.url));
    }

    return NextResponse.redirect(
      new URL(getPostAuthPath(isLandlord, isTenant, isConnector), request.url),
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
