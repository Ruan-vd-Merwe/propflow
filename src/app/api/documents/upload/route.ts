import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const documentType = formData.get("document_type") as string;
  const tenantId = formData.get("tenant_id") as string | null;
  const propertyId = formData.get("property_id") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!documentType)
    return NextResponse.json(
      { error: "document_type is required" },
      { status: 400 },
    );

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Use PDF, JPG, PNG or Word." },
      { status: 400 },
    );
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 },
    );
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${documentType}/${timestamp}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Generate a 1-year signed URL for display
  const { data: signedData } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  const displayUrl = signedData?.signedUrl ?? filePath;

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      tenant_id: tenantId || null,
      property_id: propertyId || null,
      document_type: documentType,
      file_name: file.name,
      file_url: filePath, // store path for signed URL generation
      file_size: file.size,
      mime_type: file.type,
      notes: notes || null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: doc.id,
    file_url: displayUrl,
    file_name: doc.file_name,
  });
}
