import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPostAuthPath, resolveRoleFlags } from "@/lib/auth/roles";

function getSafeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const safeNext = getSafeNext(searchParams.get("next"));

  if (!token_hash || !type) {
    console.error("[auth/confirm] missing params — token_hash:", token_hash, "type:", type);
    return NextResponse.redirect(
      new URL("/login?error=missing_confirmation_params", request.url),
    );
  }

  // Build a redirect response FIRST so the cookie adapter can write onto it.
  // We'll update the redirect URL after we know where to send the user.
  const redirectTo = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error("[auth/confirm] verifyOtp failed:", error.message);
    const dest = new URL("/login", request.url);
    dest.searchParams.set("error", "confirmation_failed");
    dest.searchParams.set("message", error.message);
    response.headers.set("Location", dest.toString());
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[auth/confirm] verifyOtp succeeded but getUser returned null");
    response.headers.set(
      "Location",
      new URL("/login?error=session_not_established", request.url).toString(),
    );
    return response;
  }

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
    phone: (m.phone as string) ?? null,
    province: (m.province as string) ?? null,
    city: (m.city as string) ?? null,
    whatsapp_opted_in: m.whatsapp_opted_in ?? true,
    email_confirmed: true,
  });

  if (profileErr) {
    console.error("[auth/confirm] profiles upsert failed:", profileErr);
    const dest = new URL("/login", request.url);
    dest.searchParams.set("error", "profile_write_failed");
    dest.searchParams.set("message", profileErr.message);
    response.headers.set("Location", dest.toString());
    return response;
  }

  // Create tenant_profiles row from signup metadata
  if (isTenant) {
    const { data: existing } = await supabase
      .from("tenant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      const { error: tenantErr } = await supabase
        .from("tenant_profiles")
        .insert({
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

      if (tenantErr) {
        console.error("[auth/confirm] tenant_profiles insert failed:", tenantErr);
      }
    }
  }

  // Redirect to the caller-supplied path, or the role-based default
  const dest = safeNext
    ? new URL(safeNext, request.url)
    : new URL(getPostAuthPath(isLandlord, isTenant, isConnector), request.url);

  response.headers.set("Location", dest.toString());
  return response;
}
