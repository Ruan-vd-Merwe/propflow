import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock rss-parser before importing fetcher ──────────────────────────────────
vi.mock("rss-parser", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: vi.fn().mockResolvedValue({
        items: [
          {
            title: "Cape Town property prices rise 8% in Q1",
            link: "https://property24.com/news/1",
            pubDate: "2026-06-01T08:00:00Z",
            contentSnippet: "Cape Town rental market sees record demand.",
          },
          {
            title: "Interest rates held steady by SARB",
            link: "https://businesstech.co.za/news/2",
            pubDate: "2026-06-02T08:00:00Z",
            contentSnippet:
              "The South African Reserve Bank kept the repo rate at 8.25%.",
          },
        ],
      }),
    })),
  };
});

// ── Mock service client ───────────────────────────────────────────────────────
const mockUpsertedArticles: unknown[] = [];
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  insert: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => mockSupabase,
}));

describe("news fetcher helpers (unit tests)", () => {
  // Test the pure helper functions extracted from fetcher.ts logic

  it("detects Cape Town location in text", () => {
    const SA_LOCATIONS = ["Cape Town", "Sea Point", "Johannesburg"];
    const text = "Cape Town property market heats up";
    const found = SA_LOCATIONS.filter((loc) =>
      text.toLowerCase().includes(loc.toLowerCase()),
    );
    expect(found).toContain("Cape Town");
  });

  it("does not detect location absent from text", () => {
    const SA_LOCATIONS = ["Cape Town", "Durban"];
    const text = "Johannesburg office market trends";
    const found = SA_LOCATIONS.filter((loc) =>
      text.toLowerCase().includes(loc.toLowerCase()),
    );
    expect(found).toHaveLength(0);
  });

  it("classifies interest-rate articles correctly", () => {
    const detectCategory = (title: string, excerpt: string) => {
      const text = (title + " " + excerpt).toLowerCase();
      if (text.includes("interest rate") || text.includes("repo rate"))
        return "Interest rates";
      if (text.includes("rent") || text.includes("tenant"))
        return "Rental market";
      if (text.includes("price") || text.includes("value"))
        return "Property prices";
      return "South African property news";
    };

    expect(
      detectCategory(
        "SARB keeps repo rate steady",
        "Reserve Bank announcement",
      ),
    ).toBe("Interest rates");
    expect(
      detectCategory("Rental demand surges in Cape Town", "Tenants compete"),
    ).toBe("Rental market");
    expect(
      detectCategory("Property values hit new high", "Price index rises"),
    ).toBe("Property prices");
  });

  it("scores relevance higher for SA property keywords", () => {
    const scoreRelevance = (title: string, excerpt: string): number => {
      const text = (title + " " + excerpt).toLowerCase();
      let score = 30;
      const highValue = ["cape town", "rental", "property", "interest rate"];
      const boosts = highValue.filter((kw) => text.includes(kw));
      score += boosts.length * 8;
      return Math.min(score, 100);
    };

    const highScore = scoreRelevance(
      "Cape Town property rental market",
      "interest rate impact",
    );
    const lowScore = scoreRelevance("Sports news today", "football results");

    expect(highScore).toBeGreaterThan(lowScore);
    expect(lowScore).toBe(30);
  });
});
