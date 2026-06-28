import Parser from "rss-parser";
import { createServiceClient } from "@/lib/supabase/service";

const CATEGORIES = [
  "Property prices",
  "Rental market",
  "Interest rates",
  "New developments",
  "Rezoning and planning",
  "Cape Town property news",
  "South African property news",
  "Neighbourhood lifestyle",
  "Investment insights",
  "Tenant updates",
  "Landlord updates",
  "Other",
] as const;

export type NewsCategory = (typeof CATEGORIES)[number];

const SA_LOCATIONS = [
  "Cape Town",
  "Sea Point",
  "Green Point",
  "Gardens",
  "Woodstock",
  "Bellville",
  "Durbanville",
  "Stellenbosch",
  "Paarl",
  "Somerset West",
  "Constantia",
  "Claremont",
  "Rondebosch",
  "Observatory",
  "Johannesburg",
  "Sandton",
  "Pretoria",
  "Durban",
  "Umhlanga",
  "Port Elizabeth",
  "Gqeberha",
  "Bloemfontein",
  "East London",
  "Western Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
];

function detectLocations(text: string): string[] {
  const lower = text.toLowerCase();
  return SA_LOCATIONS.filter((loc) => lower.includes(loc.toLowerCase()));
}

function detectCategory(
  title: string,
  excerpt: string,
  hint?: string | null,
): NewsCategory {
  const text = (title + " " + excerpt).toLowerCase();

  if (
    text.includes("interest rate") ||
    text.includes("repo rate") ||
    text.includes("bond") ||
    text.includes("afford")
  )
    return "Interest rates";

  if (
    text.includes("rent") ||
    text.includes("tenant") ||
    text.includes("lease")
  )
    return "Rental market";

  if (
    text.includes("price") ||
    text.includes("value") ||
    text.includes("growth") ||
    text.includes("decline")
  )
    return "Property prices";

  if (
    text.includes("develop") ||
    text.includes("new unit") ||
    text.includes("launch") ||
    text.includes("complex")
  )
    return "New developments";

  if (
    text.includes("rezone") ||
    text.includes("rezoning") ||
    text.includes("zoning") ||
    text.includes("planning")
  )
    return "Rezoning and planning";

  if (
    text.includes("cape town") ||
    text.includes("western cape") ||
    text.includes("sea point") ||
    text.includes("stellenbosch")
  )
    return "Cape Town property news";

  if (
    text.includes("invest") ||
    text.includes("yield") ||
    text.includes("return") ||
    text.includes("portfolio")
  )
    return "Investment insights";

  if (text.includes("landlord")) return "Landlord updates";
  if (text.includes("tenant")) return "Tenant updates";

  if (hint) {
    const match = CATEGORIES.find(
      (c) => c.toLowerCase() === hint.toLowerCase(),
    );
    if (match) return match;
  }

  return "South African property news";
}

function scoreRelevance(title: string, excerpt: string): number {
  const text = (title + " " + excerpt).toLowerCase();
  let score = 30;

  const highValue = [
    "cape town",
    "south africa",
    "rental",
    "property",
    "interest rate",
    "landlord",
    "tenant",
    "price",
    "market",
    "development",
    "afford",
  ];
  const boosts = highValue.filter((kw) => text.includes(kw));
  score += boosts.length * 8;
  return Math.min(score, 100);
}

export async function fetchAllSources(): Promise<{
  fetched: number;
  stored: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  const parser = new Parser({ timeout: 10000 });
  const errors: string[] = [];
  let fetched = 0;
  let stored = 0;

  const { data: sources } = await supabase
    .from("property_news_sources")
    .select("*")
    .eq("is_active", true);

  if (!sources?.length)
    return { fetched: 0, stored: 0, errors: ["No active sources"] };

  for (const source of sources) {
    const url = source.rss_url || source.url;
    if (!url) continue;

    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items ?? []) {
        if (!item.title || !item.link) continue;
        fetched++;

        const { data: existing } = await supabase
          .from("property_news_articles")
          .select("id")
          .eq("url", item.link)
          .single();

        if (existing) continue;

        const excerpt =
          item.contentSnippet ||
          (item.content?.replace(/<[^>]*>/g, "").slice(0, 500) ?? "");

        const locations = detectLocations(item.title + " " + excerpt);
        const category = detectCategory(
          item.title,
          excerpt,
          source.category_hint,
        );
        const relevance = scoreRelevance(item.title, excerpt);
        const provinces = [
          "Western Cape",
          "Gauteng",
          "KwaZulu-Natal",
          "Eastern Cape",
          "Free State",
        ];

        const { error } = await supabase.from("property_news_articles").insert({
          source_id: source.id,
          title: item.title,
          url: item.link,
          author: ((item as Record<string, unknown>).creator as string) || null,
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : null,
          raw_excerpt: excerpt.slice(0, 1000),
          category,
          relevance_score: relevance,
          location_tags: locations,
          suburb_tags: locations.filter((l) => !provinces.includes(l)),
          province_tags: locations.filter((l) => provinces.includes(l)),
        });

        if (!error) stored++;
      }
    } catch (err) {
      const msg = `Failed to fetch ${source.name}: ${err}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  return { fetched, stored, errors };
}
