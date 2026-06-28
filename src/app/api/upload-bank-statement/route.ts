import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `applications/${Date.now()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("tenant-documents")
      .upload(path, buffer, { contentType: "application/pdf", upsert: false });

    if (upErr) {
      console.error("[upload-bank-statement]", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Signed URL valid for 1 year — landlord needs to be authenticated to access
    const { data: signed } = await supabase.storage
      .from("tenant-documents")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    return NextResponse.json({ url: signed?.signedUrl ?? null });
  } catch (err) {
    console.error("[upload-bank-statement]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
