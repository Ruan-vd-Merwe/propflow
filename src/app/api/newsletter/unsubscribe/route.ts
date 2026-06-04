import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token)
    return NextResponse.json({ error: "Token required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({
      is_subscribed: false,
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", token);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
