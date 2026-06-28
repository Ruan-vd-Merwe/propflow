import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";

export async function generateWeeklyDigest(): Promise<{
  digestId: string;
  articlesCount: number;
}> {
  const supabase = createServiceClient();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date();
  weekEnd.setHours(23, 59, 59, 999);

  const { data: articles } = await supabase
    .from("property_news_articles")
    .select("*")
    .gte("published_at", weekStart.toISOString())
    .eq("is_duplicate", false)
    .not("summary", "is", null)
    .order("relevance_score", { ascending: false })
    .limit(15);

  if (!articles?.length) throw new Error("No articles found for this week");

  // Group by category
  const byCategory: Record<string, typeof articles> = {};
  for (const a of articles) {
    const cat = a.category ?? "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  }

  // AI intro
  let introText =
    "Here is your weekly South African property market update from PropTrust.";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const titles = articles
        .slice(0, 5)
        .map((a) => a.title)
        .join("\n");
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Write a 2-3 sentence intro for a weekly South African property newsletter based on these top headlines:\n${titles}\n\nTone: professional, clear, useful. No hype. No emojis. Plain text only.`,
          },
        ],
      });
      if (msg.content[0].type === "text")
        introText = msg.content[0].text.trim();
    } catch (e) {
      console.error("AI intro failed, using default:", e);
    }
  }

  const top3 = articles.slice(0, 3);
  const html = buildDigestHTML(introText, top3, byCategory, weekStart, weekEnd);
  const text = buildDigestText(introText, top3, byCategory);

  const subject =
    `Your Weekly SA Property Update — ` +
    weekStart.toLocaleDateString("en-ZA", { day: "numeric", month: "long" });

  const { data: digest, error } = await supabase
    .from("property_news_digests")
    .insert({
      week_start_date: weekStart.toISOString().split("T")[0],
      week_end_date: weekEnd.toISOString().split("T")[0],
      subject,
      intro_text: introText,
      html_content: html,
      text_content: text,
      status: "draft",
      articles_count: articles.length,
    })
    .select()
    .single();

  if (error ?? !digest)
    throw new Error(`Failed to store digest: ${error?.message}`);

  await supabase.from("property_news_digest_articles").insert(
    articles.map((a, i) => ({
      digest_id: digest.id,
      article_id: a.id,
      display_order: i,
      section: a.category ?? "Other",
    })),
  );

  return { digestId: digest.id, articlesCount: articles.length };
}

type ArticleRow = {
  title: string;
  url: string;
  summary: string | null;
  why_it_matters: string | null;
  published_at: string | null;
  category: string | null;
};

function buildDigestHTML(
  intro: string,
  top3: ArticleRow[],
  byCategory: Record<string, ArticleRow[]>,
  weekStart: Date,
  weekEnd: Date,
): string {
  const dateRange =
    weekStart.toLocaleDateString("en-ZA", { day: "numeric", month: "long" }) +
    " – " +
    weekEnd.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>PropTrust Weekly Property Digest</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#0f172a;border-radius:12px 12px 0 0;padding:32px;margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-weight:700;">P</span>
        </div>
        <span style="color:white;font-weight:700;font-size:18px;">PropTrust</span>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px;">Weekly Property Market Digest</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0;">${dateRange}</p>
    </div>
    <div style="background:white;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;">${intro}</p>
    </div>
    <div style="background:#eff6ff;padding:24px 32px;border:1px solid #bfdbfe;margin-top:0;">
      <h2 style="color:#1e40af;font-size:16px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.05em;">Top 3 things to know this week</h2>
      ${top3
        .map(
          (a, i) => `
        <div style="margin-bottom:16px;padding-bottom:16px;${i < top3.length - 1 ? "border-bottom:1px solid #bfdbfe;" : ""}">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="width:24px;height:24px;background:#1e40af;border-radius:99px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white;font-size:12px;font-weight:700;">${i + 1}</div>
            <div>
              <a href="${a.url}" style="color:#1e40af;font-weight:600;font-size:14px;text-decoration:none;">${a.title}</a>
              ${a.why_it_matters ? `<p style="color:#64748b;font-size:13px;margin:4px 0 0;line-height:1.5;">${a.why_it_matters}</p>` : ""}
            </div>
          </div>
        </div>`,
        )
        .join("")}
    </div>
    ${Object.entries(byCategory)
      .map(
        ([cat, arts]) => `
      <div style="background:white;padding:24px 32px;border:1px solid #e2e8f0;border-top:none;margin-top:0;">
        <h2 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #e2e8f0;">${cat}</h2>
        ${arts
          .map(
            (a) => `
          <div style="margin-bottom:20px;">
            <a href="${a.url}" style="color:#1e40af;font-weight:600;font-size:14px;text-decoration:none;display:block;margin-bottom:4px;">${a.title}</a>
            ${a.summary ? `<p style="color:#374151;font-size:13px;line-height:1.6;margin:0 0 6px;">${a.summary}</p>` : ""}
            ${a.why_it_matters ? `<p style="color:#64748b;font-size:12px;margin:0;font-style:italic;">Why it matters: ${a.why_it_matters}</p>` : ""}
            <p style="color:#94a3b8;font-size:11px;margin:6px 0 0;">
              Source: ${a.url.split("/")[2] ?? "Unknown"}${a.published_at ? " · " + new Date(a.published_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long" }) : ""}
            </p>
          </div>`,
          )
          .join("")}
      </div>`,
      )
      .join("")}
    <div style="background:#0f172a;border-radius:0 0 12px 12px;padding:24px 32px;">
      <p style="color:#64748b;font-size:12px;margin:0 0 8px;">You are receiving this because you subscribed to PropTrust property market updates.</p>
      <a href="https://proptrust.co.za/unsubscribe?token={{unsubscribe_token}}" style="color:#94a3b8;font-size:12px;">Unsubscribe</a>
      <span style="color:#475569;font-size:12px;margin:0 8px;">·</span>
      <a href="https://proptrust.co.za" style="color:#94a3b8;font-size:12px;">proptrust.co.za</a>
      <p style="color:#475569;font-size:11px;margin:12px 0 0;">PropTrust (Pty) Ltd · Cape Town, South Africa · POPIA Compliant</p>
    </div>
  </div>
</body>
</html>`;
}

function buildDigestText(
  intro: string,
  top3: ArticleRow[],
  byCategory: Record<string, ArticleRow[]>,
): string {
  const lines: string[] = [
    "PROPTRUST WEEKLY PROPERTY DIGEST",
    "================================",
    "",
    intro,
    "",
    "TOP 3 THINGS TO KNOW THIS WEEK",
    "-------------------------------",
  ];

  top3.forEach((a, i) => {
    lines.push(`${i + 1}. ${a.title}`);
    if (a.why_it_matters) lines.push(`   ${a.why_it_matters}`);
    lines.push(`   Read more: ${a.url}`);
    lines.push("");
  });

  Object.entries(byCategory).forEach(([cat, arts]) => {
    lines.push(cat.toUpperCase());
    lines.push("-".repeat(cat.length));
    arts.forEach((a) => {
      lines.push(a.title);
      if (a.summary) lines.push(a.summary);
      lines.push(`Source: ${a.url}`);
      lines.push("");
    });
  });

  lines.push("---");
  lines.push(
    "Unsubscribe: https://proptrust.co.za/unsubscribe?token={{unsubscribe_token}}",
  );
  return lines.join("\n");
}
