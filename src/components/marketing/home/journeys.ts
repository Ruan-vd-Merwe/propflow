// ── Journey data ────────────────────────────────────────────────────────────
// Content and accent colors ported from the proptrust-landing-journeys.html
// mockup (source of truth for copy/layout/timing), with one deviation: the
// "renter" journey's accent was swapped from the mockup's green (#1B7A5E) to
// violet, per the repo's no-green rule (green is reserved for the chat-prop
// demo and must never appear in real product/marketing surfaces).

export type JourneyId = "search" | "renter" | "flatmate" | "landlord";

export type Journey = {
  id: JourneyId;
  label: string;
  sub: string;
  accent: string;
  accentSoft: string;
  problemH: string;
  problemP: string;
  solutionH: string;
  solutionP: string;
  cta: string;
  ctaHref: string;
};

export const JOURNEY_ORDER: JourneyId[] = [
  "search",
  "renter",
  "flatmate",
  "landlord",
];

export const JOURNEYS: Record<JourneyId, Journey> = {
  search: {
    id: "search",
    label: "I'm looking for a place",
    sub: "Browse with a profile landlords already trust",
    accent: "#2D6E8E",
    accentSoft: "#DCE7EC",
    problemH: "Every application asks you to prove yourself from zero.",
    problemP: "Payslips, references, screenshots, again and again.",
    solutionH: "Apply once. Show up verified.",
    solutionP: "Your TrustScore travels with you to every listing.",
    cta: "Browse verified listings",
    ctaHref: "/browse",
  },
  renter: {
    id: "renter",
    label: "I already rent a home",
    sub: "Turn your track record into a portable score",
    accent: "#6B4E9C",
    accentSoft: "#E4DCEF",
    problemH: "I'm tired of proving I'm a good tenant every time I move.",
    problemP:
      "Years of on-time payments, and every lease starts the story over.",
    solutionH: "Build your profile once.",
    solutionP: "Keep your rental history forever. Share it everywhere.",
    cta: "Build my TrustScore",
    ctaHref: "/register?role=tenant",
  },
  flatmate: {
    id: "flatmate",
    label: "I'm replacing a flatmate",
    sub: "Find someone your landlord will actually approve",
    accent: "#B98A1F",
    accentSoft: "#EFE3C4",
    problemH: "Finding someone your landlord will actually approve isn't easy.",
    problemP: "You end up vetting strangers with no real way to check them.",
    solutionH: "Share your listing. Vet with confidence.",
    solutionP: "Applicants arrive with their TrustScore already attached.",
    cta: "Start flatmate search",
    ctaHref: "/register?role=tenant",
  },
  landlord: {
    id: "landlord",
    label: "I own property",
    sub: "See who you can actually trust",
    accent: "#B54732",
    accentSoft: "#F0DCD5",
    problemH: "I don't know who I can trust with my property.",
    problemP: "A payslip and a gut feeling is all most landlords get.",
    solutionH: "See the whole picture, before you decide.",
    solutionP: "Verified tenants, tracked payments, legal protection built in.",
    cta: "Find trusted tenants",
    ctaHref: "/register?role=owner",
  },
};
