import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const is_active = form.get("is_active") === "true";

  const { error } = await supabase
    .from("service_providers")
    .update({ is_active })
    .eq("id", params.id)
    .eq("owner_user_id", user.id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/services/list?error=${encodeURIComponent(error.message)}`,
        req.url,
      ),
    );
  }

  return NextResponse.redirect(new URL("/services/list?updated=1", req.url));
}
