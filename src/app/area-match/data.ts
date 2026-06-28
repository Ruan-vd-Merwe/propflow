// ─── Types ────────────────────────────────────────────────────────────────────

export type TransportMode = "walk" | "drive" | "public" | "uber" | "cycle";
export type MoveInTiming = "asap" | "1month" | "2to3months" | "flexible";
export type LifestylePriority =
  | "beach"
  | "safety"
  | "running_routes"
  | "restaurants"
  | "coffee_shops"
  | "social_life"
  | "quiet_streets"
  | "schools"
  | "short_commute"
  | "value_for_money"
  | "remote_work"
  | "gym"
  | "parks_mountain";

export interface AreaMatchInputs {
  budget: number; // ZAR/month
  workLocation: string; // free text — used for display, future geocoding
  hasСar: boolean;
  transport: TransportMode;
  lifestyle: LifestylePriority[];
  bedrooms: number; // 0 = studio, 1, 2, 3+
  moveIn: MoveInTiming;
}

export interface AreaData {
  id: string;
  name: string;
  city: string;
  province: string;

  // Rent ranges per bedroom count (ZAR/month)
  rent: {
    studio: [number, number]; // [min, max]
    bed1: [number, number];
    bed2: [number, number];
    bed3plus: [number, number];
  };

  // Transport suitability (0–10)
  transport: {
    walkability: number;
    drive_friendly: number;
    public_transit: number;
    cycling: number;
  };

  // Approximate commute to city centre (minutes by main mode)
  commute_cbd: {
    drive: number;
    transit: number;
    cycle: number;
    walk: number;
  };

  // Lifestyle tags — matched against user priorities
  tags: string[];

  // Safety (0–100, higher = safer)
  safety_score: number;

  // Rich card content
  best_for: string[];
  watch_outs: string[];
  lifestyle_highlights: string;
  public_transport_note: string;
  safety_note: string;
}

export interface AreaRecommendation {
  area: AreaData;
  score: number; // 0–100 overall match
  breakdown: {
    budget: number;
    lifestyle: number;
    transport: number;
    safety: number;
    commute: number;
  };
  rentRange: [number, number]; // for user's bedroom count
  commuteMinutes: number; // estimated commute using preferred transport
  matchReasons: string[]; // up to 3 positive signals
  concerns: string[]; // up to 2 concerns
}

// ─── Static area data ─────────────────────────────────────────────────────────
// Replace this with a Supabase query against an `areas` table when real
// data exists. The shape of AreaData is intentionally DB-friendly.

export const AREAS: AreaData[] = [
  {
    id: "sea-point",
    name: "Sea Point",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [8000, 12000],
      bed1: [11000, 16000],
      bed2: [16000, 24000],
      bed3plus: [22000, 35000],
    },
    transport: {
      walkability: 9,
      drive_friendly: 5,
      public_transit: 7,
      cycling: 6,
    },
    commute_cbd: { drive: 15, transit: 22, cycle: 28, walk: 60 },
    tags: [
      "beach",
      "restaurants",
      "coffee",
      "social",
      "running",
      "gym",
      "outdoor",
      "nightlife",
    ],
    safety_score: 55,
    best_for: ["Beach lifestyle", "Walkability", "Social scene"],
    watch_outs: ["Parking is difficult", "Premium pricing"],
    lifestyle_highlights:
      "Beachfront promenade, vibrant café culture and a dense restaurant strip.",
    public_transport_note: "MyCiTi Bus Route T01 runs along Main Road.",
    safety_note:
      "Moderate crime index. Well-lit promenade with consistent foot traffic.",
  },
  {
    id: "green-point",
    name: "Green Point",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [7000, 11000],
      bed1: [9000, 14000],
      bed2: [13000, 20000],
      bed3plus: [18000, 28000],
    },
    transport: {
      walkability: 8,
      drive_friendly: 6,
      public_transit: 7,
      cycling: 7,
    },
    commute_cbd: { drive: 10, transit: 16, cycle: 18, walk: 45 },
    tags: [
      "beach",
      "restaurants",
      "coffee",
      "social",
      "gym",
      "parks",
      "outdoor",
      "running",
    ],
    safety_score: 60,
    best_for: ["CBD access", "Active lifestyle", "Convenience"],
    watch_outs: ["On-street parking only in most blocks", "Weekend event noise"],
    lifestyle_highlights:
      "Green Point Park, the stadium precinct and easy access to both the waterfront and Sea Point promenade.",
    public_transport_note: "MyCiTi routes to CBD and Camps Bay.",
    safety_note: "Reasonably safe with active neighbourhood watch.",
  },
  {
    id: "gardens",
    name: "Gardens",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [6000, 9000],
      bed1: [8000, 13000],
      bed2: [11000, 17000],
      bed3plus: [15000, 23000],
    },
    transport: {
      walkability: 8,
      drive_friendly: 6,
      public_transit: 7,
      cycling: 6,
    },
    commute_cbd: { drive: 8, transit: 12, cycle: 14, walk: 35 },
    tags: ["restaurants", "coffee", "social", "mountain", "parks", "outdoor"],
    safety_score: 63,
    best_for: ["Short commute", "Mountain access", "Walkable streets"],
    watch_outs: ["Limited parking in older blocks", "Some road noise near De Waal"],
    lifestyle_highlights:
      "Walking distance to Company's Garden, Signal Hill slopes and the city's best independent restaurants.",
    public_transport_note: "Frequent minibus routes. MyCiTi within 10 min walk.",
    safety_note: "Well-established residential area with low serious crime.",
  },
  {
    id: "vredehoek",
    name: "Vredehoek",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [5500, 8500],
      bed1: [7000, 11000],
      bed2: [10000, 15000],
      bed3plus: [14000, 20000],
    },
    transport: {
      walkability: 7,
      drive_friendly: 7,
      public_transit: 5,
      cycling: 5,
    },
    commute_cbd: { drive: 12, transit: 20, cycle: 25, walk: 55 },
    tags: ["mountain", "parks", "outdoor", "quiet", "running", "remote_work"],
    safety_score: 73,
    best_for: ["Safety", "Mountain access", "Peaceful streets"],
    watch_outs: ["Limited public transport", "Steep streets for cyclists"],
    lifestyle_highlights:
      "Direct access to Table Mountain hiking trails and the De Waal Park. Quiet tree-lined streets.",
    public_transport_note: "Mostly car-dependent. Minibus taxis to Gardens.",
    safety_note: "One of the safer pockets in the City Bowl with a low crime rate.",
  },
  {
    id: "woodstock",
    name: "Woodstock",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [5000, 8000],
      bed1: [6000, 10000],
      bed2: [9000, 14000],
      bed3plus: [12000, 18000],
    },
    transport: {
      walkability: 7,
      drive_friendly: 7,
      public_transit: 8,
      cycling: 8,
    },
    commute_cbd: { drive: 8, transit: 10, cycle: 14, walk: 40 },
    tags: [
      "coffee",
      "restaurants",
      "social",
      "remote_work",
      "outdoor",
      "nightlife",
    ],
    safety_score: 48,
    best_for: ["Value", "CBD workers", "Creative crowd"],
    watch_outs: [
      "Higher crime in some pockets — choose block carefully",
      "Industrial feel in Lower Woodstock",
    ],
    lifestyle_highlights:
      "Thriving café scene, the Old Biscuit Mill market and a strong remote-working culture.",
    public_transport_note:
      "Cape Metro Rail (Woodstock station) and frequent minibus routes.",
    safety_note:
      "Mixed. Upper Woodstock is safer. Street awareness is advised.",
  },
  {
    id: "bellville",
    name: "Bellville",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [4000, 6500],
      bed1: [5500, 8500],
      bed2: [7500, 11500],
      bed3plus: [10000, 14500],
    },
    transport: {
      walkability: 6,
      drive_friendly: 8,
      public_transit: 7,
      cycling: 4,
    },
    commute_cbd: { drive: 25, transit: 35, cycle: 70, walk: 180 },
    tags: ["schools", "quiet", "value", "parks"],
    safety_score: 63,
    best_for: ["Value for money", "Schools", "Car owners"],
    watch_outs: ["Long commute to CBD", "Not walkable for daily errands"],
    lifestyle_highlights:
      "Good schools, access to the N1 corridor and more space for the budget.",
    public_transport_note: "Cape Metro Rail (Bellville station) to CBD.",
    safety_note: "Generally safe residential areas. Selective pockets to avoid.",
  },
  {
    id: "durbanville",
    name: "Durbanville",
    city: "Cape Town",
    province: "Western Cape",
    rent: {
      studio: [4500, 7000],
      bed1: [5500, 9000],
      bed2: [8000, 13000],
      bed3plus: [11000, 17000],
    },
    transport: {
      walkability: 5,
      drive_friendly: 9,
      public_transit: 4,
      cycling: 4,
    },
    commute_cbd: { drive: 30, transit: 50, cycle: 90, walk: 240 },
    tags: ["schools", "quiet", "parks", "outdoor", "value"],
    safety_score: 76,
    best_for: ["Families", "Schools", "Safety"],
    watch_outs: [
      "Car essential — limited public transport",
      "Long commute to Cape Town CBD",
    ],
    lifestyle_highlights:
      "Top-rated schools, wine farms nearby, open parks and a quiet suburban pace.",
    public_transport_note: "Largely car-dependent. Limited bus routes.",
    safety_note: "One of the safest suburbs in the Cape Town metro.",
  },
  {
    id: "stellenbosch",
    name: "Stellenbosch",
    city: "Cape Winelands",
    province: "Western Cape",
    rent: {
      studio: [4500, 7000],
      bed1: [5500, 9000],
      bed2: [7500, 12000],
      bed3plus: [10000, 16000],
    },
    transport: {
      walkability: 7,
      drive_friendly: 7,
      public_transit: 4,
      cycling: 8,
    },
    commute_cbd: { drive: 45, transit: 70, cycle: 180, walk: 999 },
    tags: [
      "running",
      "mountain",
      "coffee",
      "restaurants",
      "quiet",
      "parks",
      "outdoor",
      "remote_work",
    ],
    safety_score: 70,
    best_for: ["Outdoor lifestyle", "Winelands setting", "Remote workers"],
    watch_outs: [
      "Far from Cape Town CBD",
      "Public transport to Cape Town is limited",
    ],
    lifestyle_highlights:
      "Trail running on Stellenbosch Mountain, wine farms within cycling distance and a walkable town centre.",
    public_transport_note:
      "MyCiTi or Uber to intercity buses. No direct rail to CT.",
    safety_note:
      "Safe town centre. Some student-area considerations after dark.",
  },
  {
    id: "paarl",
    name: "Paarl",
    city: "Cape Winelands",
    province: "Western Cape",
    rent: {
      studio: [3500, 5500],
      bed1: [4500, 7500],
      bed2: [6000, 10000],
      bed3plus: [8000, 13000],
    },
    transport: {
      walkability: 5,
      drive_friendly: 8,
      public_transit: 4,
      cycling: 5,
    },
    commute_cbd: { drive: 55, transit: 80, cycle: 999, walk: 999 },
    tags: ["mountain", "quiet", "parks", "outdoor", "value"],
    safety_score: 62,
    best_for: ["Budget", "Space and peace", "Winelands lifestyle"],
    watch_outs: ["Car is essential", "Far from Cape Town employment centres"],
    lifestyle_highlights:
      "Groot Drakenstein wine valley, Berg River and Paarl Mountain — serious space and scenery for the price.",
    public_transport_note:
      "Cape Metro Rail (Paarl line) runs to Cape Town, though infrequent.",
    safety_note: "Mixed. Town centre and older areas require street awareness.",
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

function getRentRange(area: AreaData, bedrooms: number): [number, number] {
  if (bedrooms === 0) return area.rent.studio;
  if (bedrooms === 1) return area.rent.bed1;
  if (bedrooms === 2) return area.rent.bed2;
  return area.rent.bed3plus;
}

function getCommuteMinutes(area: AreaData, transport: TransportMode): number {
  switch (transport) {
    case "drive":
      return area.commute_cbd.drive;
    case "public":
      return area.commute_cbd.transit;
    case "cycle":
      return area.commute_cbd.cycle;
    case "walk":
      return area.commute_cbd.walk;
    case "uber":
      return area.commute_cbd.drive + 5; // Uber ~ drive + wait
  }
}

function getTransportScore(area: AreaData, transport: TransportMode): number {
  switch (transport) {
    case "walk":
      return area.transport.walkability * 10;
    case "drive":
      return area.transport.drive_friendly * 10;
    case "public":
      return area.transport.public_transit * 10;
    case "cycle":
      return area.transport.cycling * 10;
    case "uber":
      // Uber works everywhere; walkability proxies how urban/convenient the area is
      return (area.transport.walkability * 0.6 + area.transport.drive_friendly * 0.4) * 10;
  }
}

// Maps user lifestyle priority keys to area tags
const LIFESTYLE_TAG_MAP: Record<LifestylePriority, string[]> = {
  beach: ["beach"],
  safety: [], // handled via safety_score threshold
  running_routes: ["running", "outdoor"],
  restaurants: ["restaurants"],
  coffee_shops: ["coffee"],
  social_life: ["social", "nightlife"],
  quiet_streets: ["quiet"],
  schools: ["schools"],
  short_commute: [], // handled via commute score
  value_for_money: [], // handled via budget score
  remote_work: ["remote_work"],
  gym: ["gym"],
  parks_mountain: ["parks", "mountain"],
};

function budgetScore(budget: number, rentRange: [number, number]): number {
  const mid = (rentRange[0] + rentRange[1]) / 2;
  const ratio = budget / mid;
  if (ratio >= 1.5) return 100; // well above — very affordable for tenant
  if (ratio >= 1.0) return 90;
  if (ratio >= 0.85) return 75;
  if (ratio >= 0.7) return 55;
  if (ratio >= 0.55) return 30;
  return 10; // below 55% of mid-market — area is likely out of reach
}

function lifestyleScore(
  area: AreaData,
  priorities: LifestylePriority[],
): number {
  if (priorities.length === 0) return 60; // neutral

  let matched = 0;
  for (const p of priorities) {
    if (p === "safety") {
      if (area.safety_score >= 65) matched++;
    } else if (p === "short_commute") {
      // scored separately; skip here to avoid double-counting
    } else if (p === "value_for_money") {
      // scored via budget; skip here
    } else {
      const requiredTags = LIFESTYLE_TAG_MAP[p];
      if (requiredTags.some((tag) => area.tags.includes(tag))) matched++;
    }
  }
  const effectivePriorities = priorities.filter(
    (p) => p !== "short_commute" && p !== "value_for_money",
  ).length;

  return effectivePriorities === 0 ? 60 : Math.round((matched / effectivePriorities) * 100);
}

function safetyScore(
  area: AreaData,
  priorities: LifestylePriority[],
): number {
  // Straight area safety score.
  // If user specifically chose "safety" as priority, penalise unsafe areas harder.
  const base = area.safety_score;
  if (priorities.includes("safety") && base < 65) {
    return Math.max(0, base - 20); // heavier penalty
  }
  return base;
}

function commuteScore(minutes: number): number {
  if (minutes <= 10) return 100;
  if (minutes <= 20) return 85;
  if (minutes <= 30) return 65;
  if (minutes <= 45) return 45;
  if (minutes <= 60) return 25;
  return 10;
}

function buildMatchReasons(
  area: AreaData,
  inputs: AreaMatchInputs,
  breakdown: AreaRecommendation["breakdown"],
  commuteMinutes: number,
): string[] {
  const reasons: string[] = [];
  if (breakdown.budget >= 80) reasons.push("Fits your budget well");
  if (breakdown.lifestyle >= 75) reasons.push("Strong lifestyle match");
  if (commuteMinutes <= 20) reasons.push(`~${commuteMinutes} min commute`);
  else if (commuteMinutes <= 35) reasons.push(`~${commuteMinutes} min commute`);
  if (area.safety_score >= 70) reasons.push("Safe neighbourhood");
  if (breakdown.transport >= 75) reasons.push("Good for your transport preference");
  if (inputs.lifestyle.includes("beach") && area.tags.includes("beach"))
    reasons.push("Beach access");
  if (inputs.lifestyle.includes("schools") && area.tags.includes("schools"))
    reasons.push("Good schools nearby");
  return reasons.slice(0, 3);
}

function buildConcerns(
  area: AreaData,
  inputs: AreaMatchInputs,
  commuteMinutes: number,
): string[] {
  const concerns: string[] = [];
  const [min] = getRentRange(area, inputs.bedrooms);
  if (inputs.budget < min * 0.75) concerns.push("Budget may be tight for this area");
  if (commuteMinutes > 50) concerns.push("Long commute from here");
  if (inputs.transport === "public" && area.transport.public_transit < 5)
    concerns.push("Limited public transport options");
  if (inputs.transport === "walk" && area.transport.walkability < 5)
    concerns.push("Not very walkable");
  if (
    inputs.lifestyle.includes("safety") &&
    area.safety_score < 60
  )
    concerns.push("Lower safety rating");
  return concerns.slice(0, 2);
}

export function scoreAreas(inputs: AreaMatchInputs): AreaRecommendation[] {
  const results: AreaRecommendation[] = AREAS.map((area) => {
    const rentRange = getRentRange(area, inputs.bedrooms);
    const commuteMinutes = getCommuteMinutes(area, inputs.transport);

    const bScore = budgetScore(inputs.budget, rentRange);
    const lScore = lifestyleScore(area, inputs.lifestyle);
    const tScore = getTransportScore(area, inputs.transport);
    const sScore = safetyScore(area, inputs.lifestyle);
    const cScore = commuteScore(commuteMinutes);

    // Weights: adjust when "short_commute" or "safety" is a stated priority
    const commuteWeight = inputs.lifestyle.includes("short_commute") ? 0.2 : 0.1;
    const safetyWeight = inputs.lifestyle.includes("safety") ? 0.18 : 0.08;
    const budgetWeight = inputs.lifestyle.includes("value_for_money") ? 0.35 : 0.3;
    const transportWeight = 0.15;
    const lifestyleWeight =
      1 - budgetWeight - commuteWeight - safetyWeight - transportWeight;

    const overall = Math.round(
      bScore * budgetWeight +
        lScore * Math.max(0, lifestyleWeight) +
        tScore * transportWeight +
        sScore * safetyWeight +
        cScore * commuteWeight,
    );

    const breakdown = {
      budget: bScore,
      lifestyle: lScore,
      transport: tScore,
      safety: sScore,
      commute: cScore,
    };

    return {
      area,
      score: Math.min(99, overall), // cap at 99 — perfect match is rare
      breakdown,
      rentRange,
      commuteMinutes,
      matchReasons: buildMatchReasons(area, inputs, breakdown, commuteMinutes),
      concerns: buildConcerns(area, inputs, commuteMinutes),
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function fmtRent(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

export function scoreColour(score: number): string {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 55) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export const LIFESTYLE_LABELS: Record<LifestylePriority, string> = {
  beach: "Beach",
  safety: "Safety",
  running_routes: "Running routes",
  restaurants: "Restaurants",
  coffee_shops: "Coffee shops",
  social_life: "Social life",
  quiet_streets: "Quiet streets",
  schools: "Schools nearby",
  short_commute: "Short commute",
  value_for_money: "Value for money",
  remote_work: "Remote work",
  gym: "Gym",
  parks_mountain: "Parks / mountain",
};

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  walk: "Walk",
  drive: "Drive",
  public: "MyCiTi / train",
  uber: "Uber / taxi",
  cycle: "Cycle",
};
