import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("file_url, owner_id")
    .eq("id", params.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.owner_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete from storage
  await supabase.storage.from("documents").remove([doc.file_url]);

  // Delete DB record
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", params.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
