import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// PATCH /api/tenant-profile/discoverable — set discoverable true/false
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const discoverable = Boolean(body.discoverable);

  const { error } = await supabase
    .from("tenant_profiles")
    .update({ discoverable, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ discoverable });
}
