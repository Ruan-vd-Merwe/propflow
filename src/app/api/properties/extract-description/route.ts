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

  const body = (await req.json()) as { transcript?: string };
  const transcript = body.transcript?.trim();
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
    console.error("[extract-description] extraction failed:", err);
    return NextResponse.json(
      { error: "Failed to extract listing data from transcript" },
      { status: 500 },
    );
  }
}
