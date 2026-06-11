import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthCallbackUrl } from "@/lib/site-url";

export async function POST(request: Request) {
  const { email } = await request.json();
  const supabase = createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
