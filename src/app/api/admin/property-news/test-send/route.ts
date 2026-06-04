import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { sendTestDigest } from "@/lib/news/digest-sender";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { digestId, email } = await request.json();
  if (!digestId || !email) {
    return NextResponse.json(
      { error: "digestId and email required" },
      { status: 400 },
    );
  }

  try {
    await sendTestDigest(digestId, email);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
