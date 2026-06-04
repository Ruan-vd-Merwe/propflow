import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "../../_auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createClient();

  const { data: digest, error: dbErr } = await supabase
    .from("property_news_digests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (dbErr ?? !digest) {
    return NextResponse.json({ digest: null, articles: [] });
  }

  const { data: joinRows } = await supabase
    .from("property_news_digest_articles")
    .select("display_order, section, article_id, property_news_articles(*)")
    .eq("digest_id", digest.id)
    .order("display_order");

  const articles = (joinRows ?? []).map((r) => ({
    ...(r.property_news_articles as unknown as Record<string, unknown>),
    section: r.section,
    display_order: r.display_order,
  }));

  return NextResponse.json({ digest, articles });
}
