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
  const area = ((form.get("area") as string) ?? "").trim() || null;
  const province = ((form.get("province") as string) ?? "").trim() || null;
  const is_active = form.get("is_active") !== "false";
  const rawOffers = form.getAll("offers") as string[];
  const offers = rawOffers.filter(Boolean);

  const { error } = await supabase.from("neighbour_profiles").upsert(
    {
      user_id: user.id,
      offers,
      area,
      province,
      is_active,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/neighbour?error=${encodeURIComponent(error.message)}`,
        req.url,
      ),
    );
  }

  return NextResponse.redirect(new URL("/neighbour?saved=1", req.url));
}
