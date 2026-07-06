import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractLeaseFields } from "@/lib/anthropic";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;

/**
 * POST /api/lease/extract
 *
 * Shared by both landlord and tenant upload entry points. Stores the
 * document in the existing private "lease-contracts" bucket (path convention
 * matches migration_secure_documents.sql: {auth.uid()}/{context}/{file}),
 * creates a lease_extractions row, then calls Claude with the PDF as
 * document input. A parse failure marks the row failed rather than
 * throwing; the raw model response is logged, not swallowed.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const uploadedByRole = formData.get("uploaded_by_role") as string | null;
  const propertyId = formData.get("property_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (uploadedByRole !== "landlord" && uploadedByRole !== "tenant") {
    return NextResponse.json(
      { error: "uploaded_by_role must be landlord or tenant" },
      { status: 400 },
    );
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are supported for lease extraction" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum 20MB." },
      { status: 400 },
    );
  }

  if (uploadedByRole === "landlord") {
    if (!propertyId) {
      return NextResponse.json(
        { error: "property_id is required for a landlord upload" },
        { status: 400 },
      );
    }
    const { data: property, error: propertyErr } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", user.id)
      .single();
    if (propertyErr || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathContext = uploadedByRole === "landlord" ? propertyId : "self";
  const storagePath = `${user.id}/${pathContext}/${Date.now()}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadErr } = await supabase.storage
    .from("lease-contracts")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error("[lease/extract] storage upload failed:", uploadErr.message);
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: extraction, error: insertErr } = await supabase
    .from("lease_extractions")
    .insert({
      uploaded_by_role: uploadedByRole,
      uploaded_by_profile_id: user.id,
      property_id: uploadedByRole === "landlord" ? propertyId : null,
      storage_path: storagePath,
      original_filename: file.name,
      status: "pending",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[lease/extract] lease_extractions insert failed:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

  let extractedFields = null;
  let status: "extracted" | "failed" = "failed";

  try {
    const result = await extractLeaseFields({
      base64Pdf,
      mediaType: "application/pdf",
    });
    if (result.ok) {
      extractedFields = result.fields;
      status = "extracted";
    } else {
      console.error(
        "[lease/extract] extraction parse failed for",
        extraction.id,
        result.error,
      );
    }
  } catch (err) {
    console.error(
      "[lease/extract] Anthropic call failed for",
      extraction.id,
      err instanceof Error ? err.message : err,
    );
  }

  const { data: updated, error: updateErr } = await supabase
    .from("lease_extractions")
    .update({ status, extracted_fields: extractedFields })
    .eq("id", extraction.id)
    .select()
    .single();

  if (updateErr) {
    console.error("[lease/extract] status update failed:", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ extraction: updated }, { status: 201 });
}
