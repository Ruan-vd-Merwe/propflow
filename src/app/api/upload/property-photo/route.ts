import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const propertyId = form.get("propertyId") as string | null;

  if (!file || !propertyId) {
    return NextResponse.json(
      { error: "Missing file or propertyId" },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("property-photos")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("property-photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
