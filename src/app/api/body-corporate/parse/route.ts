import { NextRequest, NextResponse } from "next/server";
import { parseBodyCorpMinutes } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/body-corporate/parse
 *
 * Accepts either:
 *   multipart/form-data { file: PDF, property_id }
 *   application/json    { text: string, property_id }
 *
 * Returns the Claude analysis without saving to DB (user reviews first).
 */
export async function POST(req: NextRequest) {
  try {
    let rawText: string;
    let filename: string | null = null;
    let source: "pdf" | "text_paste";

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // ── PDF upload ─────────────────────────────────────────────────────────
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 },
        );
      }
      if (
        !file.name.toLowerCase().endsWith(".pdf") &&
        file.type !== "application/pdf"
      ) {
        return NextResponse.json(
          { error: "File must be a PDF" },
          { status: 400 },
        );
      }
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File exceeds 20 MB limit" },
          { status: 400 },
        );
      }

      filename = file.name;
      source = "pdf";

      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/node");
      const parsed = await pdfParse(buffer);
      rawText = parsed.text ?? "";

      if (!rawText.trim()) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from PDF. Please paste the text instead.",
          },
          { status: 422 },
        );
      }
    } else {
      // ── Text paste ──────────────────────────────────────────────────────────
      const body = await req.json();
      rawText = body.text ?? "";
      source = "text_paste";

      if (!rawText.trim()) {
        return NextResponse.json(
          { error: "No text provided" },
          { status: 400 },
        );
      }
    }

    const analysis = await parseBodyCorpMinutes(rawText);

    return NextResponse.json({
      success: true,
      source,
      filename,
      rawText,
      analysis,
    });
  } catch (err) {
    console.error("[body-corporate/parse]", err);
    const msg = err instanceof Error ? err.message : "Failed to parse document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
