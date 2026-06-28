import { NextRequest, NextResponse } from "next/server";
import { parseBankStatementText } from "@/lib/bank-statement-parser";

// Force Node.js runtime — pdf-parse requires it
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse");
    const pdfParser = new PDFParse({ data: buffer });
    const parsed = await pdfParser.getText();
    await pdfParser.destroy();
    const rawText: string = parsed.text ?? "";

    if (!rawText.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the PDF. " +
            "The file may be a scanned image — please upload a digital bank statement.",
        },
        { status: 422 },
      );
    }

    const analysis = parseBankStatementText(rawText);

    return NextResponse.json({
      success: true,
      filename: file.name,
      analysis,
    });
  } catch (err) {
    console.error("[parse-bank-statement]", err);
    return NextResponse.json(
      { error: "Failed to parse bank statement. Please try a different file." },
      { status: 500 },
    );
  }
}
