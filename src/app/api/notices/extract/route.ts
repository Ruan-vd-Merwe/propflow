import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { extractNoticeFields } from "@/lib/anthropic";
import { notifyOwnerOfNotice } from "@/lib/notices/notify";
import type { Notice } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/notices/extract
 * Internal route — called async by the inbound-email webhook after ACK.
 * Body: { notice_id: string }
 *
 * 1. Downloads the PDF from Supabase Storage
 * 2. Extracts text via pdf-parse
 * 3. Calls Claude to extract structured fields
 * 4. Updates the notices row
 * 5. Notifies the property owner
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.SUPABASE_HOOK_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notice_id } = await req.json();
  if (!notice_id) {
    return NextResponse.json({ error: "Missing notice_id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: notice, error: fetchErr } = await supabase
    .from("notices")
    .select("*")
    .eq("id", notice_id)
    .single();

  if (fetchErr || !notice) {
    return NextResponse.json(
      { error: "Notice not found" },
      { status: 404 },
    );
  }

  const n = notice as Notice;

  if (n.status !== "received") {
    return NextResponse.json({ ok: true, skipped: "already processed" });
  }

  let pdfText = "";

  if (n.pdf_path) {
    try {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("bc-notices")
        .download(n.pdf_path);

      if (dlErr || !fileData) {
        throw new Error(dlErr?.message ?? "Download failed");
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require("pdf-parse");
      const pdfParser = new PDFParse({ data: buffer });
      const parsed = await pdfParser.getText();
      await pdfParser.destroy();
      pdfText = parsed.text ?? "";
    } catch (err) {
      console.error("[notices/extract] PDF parse failed:", err);
      await supabase
        .from("notices")
        .update({
          status: "failed",
          extraction_error:
            err instanceof Error ? err.message : "PDF parse failed",
        })
        .eq("id", notice_id);
      return NextResponse.json({ ok: false, error: "PDF parse failed" });
    }
  }

  if (!pdfText.trim()) {
    await supabase
      .from("notices")
      .update({
        status: "failed",
        extraction_error: "No text could be extracted from the PDF",
      })
      .eq("id", notice_id);
    return NextResponse.json({ ok: false, error: "No text in PDF" });
  }

  try {
    const extraction = await extractNoticeFields(pdfText);

    await supabase
      .from("notices")
      .update({
        status: "extracted",
        notice_type: extraction.notice_type,
        title: extraction.title,
        summary: extraction.summary,
        key_dates: extraction.key_dates,
        amounts: extraction.amounts,
        action_required: extraction.action_required,
        deadline: extraction.deadline,
      })
      .eq("id", notice_id);

    // Reload the notice with extracted fields for the notification
    const { data: updated } = await supabase
      .from("notices")
      .select("*")
      .eq("id", notice_id)
      .single();

    const updatedNotice = (updated ?? n) as Notice;

    // Look up property + owner for notification
    const { data: property } = await supabase
      .from("properties")
      .select("name, owner_id")
      .eq("id", n.property_id)
      .single();

    if (property) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", property.owner_id)
        .single();

      let pdfSignedUrl: string | null = null;
      if (n.pdf_path) {
        const { data: signed } = await supabase.storage
          .from("bc-notices")
          .createSignedUrl(n.pdf_path, 7 * 24 * 60 * 60);
        pdfSignedUrl = signed?.signedUrl ?? null;
      }

      if (owner) {
        await notifyOwnerOfNotice({
          supabase,
          notice: updatedNotice,
          propertyName: property.name,
          ownerName: owner.full_name,
          ownerEmail: owner.email,
          ownerId: property.owner_id,
          pdfSignedUrl,
        });
      }
    }

    return NextResponse.json({ ok: true, status: "extracted" });
  } catch (err) {
    console.error("[notices/extract] LLM extraction failed:", err);
    await supabase
      .from("notices")
      .update({
        status: "failed",
        extraction_error:
          err instanceof Error ? err.message : "Extraction failed",
      })
      .eq("id", notice_id);
    return NextResponse.json({ ok: false, error: "Extraction failed" });
  }
}
