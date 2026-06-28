import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

type RawTransaction = {
  transaction_date: string;
  description: string;
  amount_cents: number;
  transaction_type: "credit" | "debit";
  category: string;
};

const VALID_CATEGORIES = new Set([
  "rental_income",
  "bond_payment",
  "levy_payment",
  "rates_payment",
  "maintenance",
  "insurance",
  "management_fee",
  "other_income",
  "other_expense",
  "uncategorised",
]);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("property_id");

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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    // Verify property ownership if property_id supplied
    let resolvedPropertyId: string | null = null;
    if (propertyId && typeof propertyId === "string") {
      const { data: prop } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("owner_id", user.id)
        .single();
      if (!prop) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      resolvedPropertyId = propertyId;
    }

    // Extract text from PDF
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
            "Could not extract text from this PDF. Upload a digital bank statement.",
        },
        { status: 422 },
      );
    }

    // Use Claude to extract transactions
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Parse this South African Nedbank bank statement.
Extract all transactions and return ONLY a JSON array with no other text.
Each item: {
  "transaction_date": "YYYY-MM-DD",
  "description": "string",
  "amount_cents": number (positive for credits, negative for debits — in cents, so R1234.56 = 123456),
  "transaction_type": "credit" or "debit",
  "category": one of: rental_income / bond_payment / levy_payment / rates_payment / maintenance / insurance / management_fee / other_income / other_expense / uncategorised
}
SA category patterns:
- HOMELOAN or BOND or NEDBANK HOME → bond_payment
- LEVY or BODY CORP or SECTIONAL → levy_payment
- RATES or MUNICIPALITY or CITY OF CT or CITY OF CPT → rates_payment
- INSURANCE → insurance
- Rental credits (regular monthly amounts from tenant names) → rental_income

Statement text:
${rawText.slice(0, 60_000)}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = (response.content[0] as { text: string }).text.trim();

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse statement — no transactions found" },
        { status: 422 },
      );
    }

    const rawTransactions = JSON.parse(jsonMatch[0]) as RawTransaction[];

    if (!Array.isArray(rawTransactions)) {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 422 },
      );
    }

    // Validate and clean
    const toInsert = rawTransactions
      .filter(
        (tx) =>
          typeof tx.transaction_date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(tx.transaction_date) &&
          typeof tx.description === "string" &&
          typeof tx.amount_cents === "number",
      )
      .map((tx) => ({
        owner_id: user.id,
        property_id: resolvedPropertyId,
        transaction_date: tx.transaction_date,
        description: tx.description,
        amount_cents: Math.round(tx.amount_cents),
        transaction_type:
          tx.transaction_type === "credit" || tx.transaction_type === "debit"
            ? tx.transaction_type
            : (tx.amount_cents >= 0 ? "credit" : "debit"),
        category: VALID_CATEGORIES.has(tx.category)
          ? tx.category
          : "uncategorised",
        source: "statement" as const,
        is_reconciled: false,
      }));

    if (toInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in statement" },
        { status: 422 },
      );
    }

    const { data: inserted, error } = await supabase
      .from("bank_transactions")
      .insert(toInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      inserted: (inserted ?? []).length,
      transactions: inserted ?? [],
    });
  } catch (err) {
    console.error("[finance/parse-statement]", err);
    return NextResponse.json(
      { error: "Failed to parse statement. Please try a different file." },
      { status: 500 },
    );
  }
}
