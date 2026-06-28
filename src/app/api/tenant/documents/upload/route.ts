import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get("token") as string | null;
  const file = formData.get("file") as File | null;
  const documentType = formData.get("document_type") as string | null;

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!documentType) return NextResponse.json({ error: "document_type required" }, { status: 400 });

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
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("portal_token", token)
    .single();

  if (!tenant) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `tenant/${tenant.id}/${documentType}/${timestamp}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Remove any existing doc of same type for this tenant, then insert new
  await supabase
    .from("documents")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("document_type", documentType)
    .is("owner_id", null);

  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      owner_id: null,
      tenant_id: tenant.id,
      document_type: documentType,
      file_name: file.name,
      file_url: filePath,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const { data: signedData } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 3600);

  return NextResponse.json({
    id: doc.id,
    file_name: doc.file_name,
    signed_url: signedData?.signedUrl ?? null,
  });
}
