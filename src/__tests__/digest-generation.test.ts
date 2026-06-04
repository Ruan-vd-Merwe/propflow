import { describe, it, expect } from "vitest";

// Pure helpers extracted from digest-generator — test them in isolation without
// touching Supabase or Anthropic.

type ArticleRow = {
  title: string;
  url: string;
  summary: string | null;
  why_it_matters: string | null;
  published_at: string | null;
  category: string | null;
};

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

const sampleArticles: ArticleRow[] = [
  {
    title: "Rental yields hold firm in Cape Town",
    url: "https://property24.com/news/1",
    summary: "Landlords report stable returns despite interest rate pressure.",
    why_it_matters: "Investors can expect consistent income in this market.",
    published_at: "2026-06-01T08:00:00Z",
    category: "Rental market",
  },
  {
    title: "SARB keeps rates on hold",
    url: "https://businesstech.co.za/news/2",
    summary: "The Monetary Policy Committee voted to hold the repo rate.",
    why_it_matters:
      "Bond holders see short-term relief on monthly instalments.",
    published_at: "2026-06-02T08:00:00Z",
    category: "Interest rates",
  },
  {
    title: "New development launched in Woodstock",
    url: "https://moneyweb.co.za/news/3",
    summary: "80 units coming to market in Q3.",
    why_it_matters: "Supply increase may soften Woodstock asking rents.",
    published_at: "2026-06-03T08:00:00Z",
    category: "New developments",
  },
];

describe("buildDigestText", () => {
  it("includes the intro text", () => {
    const text = buildDigestText(
      "Test intro for this week.",
      sampleArticles,
      {},
    );
    expect(text).toContain("Test intro for this week.");
  });

  it("includes all top 3 article titles", () => {
    const text = buildDigestText("Intro.", sampleArticles, {});
    sampleArticles.forEach((a) => {
      expect(text).toContain(a.title);
    });
  });

  it("includes unsubscribe URL with {{unsubscribe_token}} placeholder", () => {
    const text = buildDigestText("Intro.", sampleArticles, {});
    expect(text).toContain(
      "https://proptrust.co.za/unsubscribe?token={{unsubscribe_token}}",
    );
  });

  it("numbers the top 3 articles correctly", () => {
    const text = buildDigestText("Intro.", sampleArticles, {});
    expect(text).toContain("1. Rental yields hold firm in Cape Town");
    expect(text).toContain("2. SARB keeps rates on hold");
    expect(text).toContain("3. New development launched in Woodstock");
  });

  it("includes category sections when byCategory is provided", () => {
    const byCategory = {
      "Interest rates": [sampleArticles[1]],
    };
    const text = buildDigestText("Intro.", [sampleArticles[0]], byCategory);
    expect(text).toContain("INTEREST RATES");
    expect(text).toContain("SARB keeps rates on hold");
  });

  it("includes why_it_matters when present", () => {
    const text = buildDigestText("Intro.", sampleArticles, {});
    expect(text).toContain(
      "Investors can expect consistent income in this market.",
    );
  });
});

describe("unsubscribe token replacement", () => {
  it("replaces {{unsubscribe_token}} placeholder in text", () => {
    const text = buildDigestText("Intro.", sampleArticles, {});
    const personalised = text.replace("{{unsubscribe_token}}", "abc-123-token");
    expect(personalised).toContain(
      "https://proptrust.co.za/unsubscribe?token=abc-123-token",
    );
    expect(personalised).not.toContain("{{unsubscribe_token}}");
  });
});
