import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveRoleFlags } from "@/lib/auth/roles";

function getSafeNext(raw: string | null): string {
  const fallback = "/login?confirmed=true";
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function isAlreadyConfirmedError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("expired") ||
    m.includes("already confirmed") ||
    m.includes("token not found") ||
    m.includes("otp_expired")
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // URLSearchParams.get() already decodes the value, so next="/login?confirmed=true"
  const next = getSafeNext(searchParams.get("next"));

  if (!token_hash || !type) {
    console.error(
      "[auth/confirm] missing params — token_hash:",
      token_hash,
      "type:",
      type,
    );
    return NextResponse.redirect(
      new URL("/login?error=missing_confirmation_code", request.url),
    );
  }

  // Build a server client whose setAll is a NO-OP.
  // verifyOtp marks email_confirmed_at server-side; because cookies are never
  // written to the response, the browser receives NO session from this redirect.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Intentional no-op — session must not be created in the browser.
        },
      },
    },
  );

  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error("[auth/confirm] verifyOtp failed:", error.message);
    // Expired or already-used links are idempotent — treat as already confirmed.
    if (isAlreadyConfirmedError(error.message)) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", request.url),
    );
  }

  const user = data.user;
  if (user) {
    const service = createServiceClient();
    const m = user.user_metadata ?? {};
    const { isLandlord, isTenant, isConnector } = resolveRoleFlags(m);

    const { error: profileErr } = await service.from("profiles").upsert({
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
      console.error("[auth/confirm] profiles upsert failed:", profileErr.message);
    }

    if (isTenant) {
      const { data: existing } = await service
        .from("tenant_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        const { error: tenantErr } = await service
          .from("tenant_profiles")
          .insert({ user_id: user.id });

        if (tenantErr) {
          console.error(
            "[auth/confirm] tenant_profiles insert failed:",
            tenantErr.message,
          );
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
