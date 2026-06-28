import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
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

  if (!tenant) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, document_type, file_name, file_url, file_size, mime_type, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs
  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_url, 3600);
      return { ...doc, signed_url: data?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ documents: docsWithUrls });
}
