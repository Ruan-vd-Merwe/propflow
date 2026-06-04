import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "../_auth";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;
  const from = (page - 1) * limit;

  const supabase = createClient();
  const {
    data,
    error: dbErr,
    count,
  } = await supabase
    .from("property_news_articles")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, from + limit - 1);

  if (dbErr)
    return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ articles: data ?? [], count: count ?? 0, page });
}
