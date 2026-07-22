import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const to_user_id = body.to_user_id as string;
  const note = (body.note as string | undefined) ?? null;

  if (!to_user_id || to_user_id === user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const { error } = await supabase.from("neighbour_endorsements").insert({
    from_user_id: user.id,
    to_user_id,
    note,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already endorsed" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
