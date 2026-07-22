import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

type ParseResult = {
  meeting_date: string | null;
  levy_amount_cents: number | null;
  special_levy_cents: number | null;
  maintenance_items: string[];
  financial_summary: string | null;
  action_items: string[];
  notes: string | null;
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { document_id?: string };
  if (!body.document_id || typeof body.document_id !== "string") {
    return NextResponse.json(
      { error: "document_id required" },
      { status: 400 },
    );
  }

  const { data: doc } = await supabase
    .from("property_documents")
    .select("id, owner_id, storage_path, storage_bucket, document_type, mime_type")
    .eq("id", body.document_id)
    .single();

  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.owner_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (doc.document_type !== "body_corporate_minutes")
    return NextResponse.json(
      { error: "Document must be of type body_corporate_minutes" },
      { status: 400 },
    );

  // Short-lived signed URL — only used for this request
  const { data: signed } = await supabase.storage
    .from(doc.storage_bucket as string)
    .createSignedUrl(doc.storage_path as string, 60);

  if (!signed?.signedUrl)
    return NextResponse.json(
      { error: "Could not generate signed URL" },
      { status: 500 },
    );

  const fileRes = await fetch(signed.signedUrl);
  if (!fileRes.ok)
    return NextResponse.json(
      { error: "Could not fetch document" },
      { status: 502 },
    );

  let documentText = "";

  if (doc.mime_type === "application/pdf") {
    const buffer = await fileRes.arrayBuffer();
    const { PDFParse } = await import("pdf-parse");
    const pdfParser = new PDFParse({ data: Buffer.from(buffer) });
    const parsed = await pdfParser.getText();
    await pdfParser.destroy();
    documentText = parsed.text ?? "";
  } else {
    documentText = await fileRes.text();
  }

  if (!documentText.trim()) {
    return NextResponse.json(
      { error: "Could not extract text from document" },
      { status: 422 },
    );
  }

  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a South African property management assistant. Extract structured information from this body corporate meeting minutes document. Return ONLY valid JSON with no markdown fencing. Use these fields (null if not found):
- meeting_date: ISO date string (YYYY-MM-DD)
- levy_amount_cents: integer, monthly levy in cents (multiply Rands by 100), null if not mentioned
- special_levy_cents: integer, any special levy in cents, null if not found
- maintenance_items: array of strings, each a brief description of a maintenance item discussed
- financial_summary: string, summary of financial matters discussed (max 200 chars), null if none
- action_items: array of strings, decisions or tasks requiring action
- notes: string, any other important information (max 300 chars), null if none

Document text:
${documentText.slice(0, 8000)}`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: ParseResult;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object in response");
    parsed = JSON.parse(jsonMatch[0]) as ParseResult;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw: responseText },
      { status: 500 },
    );
  }

  await supabase.from("document_access_log").insert({
    document_id: doc.id,
    accessed_by: user.id,
    action: "view",
  });

  return NextResponse.json({ result: parsed });
}
