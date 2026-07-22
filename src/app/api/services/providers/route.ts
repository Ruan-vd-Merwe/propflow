import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const category_id = (form.get("category_id") as string) ?? "";
  const name = ((form.get("name") as string) ?? "").trim();
  const phone = ((form.get("phone") as string) ?? "").trim() || null;
  const whatsapp = ((form.get("whatsapp") as string) ?? "").trim() || null;
  const area = ((form.get("area") as string) ?? "").trim() || null;
  const province = ((form.get("province") as string) ?? "").trim() || null;
  const rate_description =
    ((form.get("rate_description") as string) ?? "").trim() || null;

  if (!category_id || !name) {
    return NextResponse.redirect(
      new URL("/services/list?error=missing_fields", req.url),
    );
  }

  const { error } = await supabase.from("service_providers").insert({
    category_id,
    name,
    phone,
    whatsapp,
    area,
    province, 
    rate_description,
    is_active: true,
    is_self_listed: true,
    owner_user_id: user.id,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/services/list?error=${encodeURIComponent(error.message)}`,
        req.url,
      ),
    );
  }

  return NextResponse.redirect(new URL("/services/list?created=1", req.url));
}
