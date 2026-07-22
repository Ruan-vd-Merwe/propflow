import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPropertyFromTranscript } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    transcript?: string;
    mode?: "voice" | "paste";
  };
  const transcript = body.transcript?.trim();
  const mode = body.mode === "paste" ? "paste" : "voice";

  if (!transcript) {
    return NextResponse.json(
      { error: "transcript is required" },
      { status: 400 },
    );
  }

  try {
    const result = await extractPropertyFromTranscript(transcript);
    return NextResponse.json({ result });
  } catch (err) {
    // Only genuine service failures (Anthropic API/network) reach here now —
    // malformed model output is handled inside extractPropertyFromTranscript
    // and returns a partial/empty result instead of throwing.
    console.error(
      `[extract-description] service failure (mode=${mode}, transcript length=${transcript.length}):`,
      err,
    );
    return NextResponse.json(
      { error: "The listing assistant is temporarily unavailable. Your text wasn't lost, try again in a moment." },
      { status: 502 },
    );
  }
}
