import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateListingCopy,
  type ListingCopyFacts,
  type ListingCopyTone,
} from "@/lib/anthropic";

const VALID_TONES: ListingCopyTone[] = ["default", "concise", "warm", "professional"];

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    facts?: ListingCopyFacts;
    tone?: string;
  };
  const facts = body.facts ?? {};
  const tone: ListingCopyTone = VALID_TONES.includes(body.tone as ListingCopyTone)
    ? (body.tone as ListingCopyTone)
    : "default";

  try {
    const draft = await generateListingCopy(facts, tone);
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("[generate-listing-copy] failed:", err);
    return NextResponse.json(
      { error: "Could not generate a draft right now. Try again in a moment." },
      { status: 502 },
    );
  }
}
