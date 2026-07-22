import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingNav from "@/components/marketing/MarketingNav";
import { XpelloDisclaimer } from "@/components/xpello/XpelloDisclaimer";
import {
  calculateRentalReliabilityScore,
  mockRentalReliabilityProfiles,
} from "@/lib/rental-reliability";

export const metadata = {
  title: "Rental ecosystem prototype | PropTrust",
  description:
    "How PropTrust's trust layer, PayProp positioning, and Xpello legal confidence fit together across a tenancy.",
};

const featuredProfile = mockRentalReliabilityProfiles[0];
const featuredResult = calculateRentalReliabilityScore(featuredProfile);
const verifiedPayments = featuredProfile.rentalPayments.filter((p) => p.verified);

type Tone = "blue" | "amber" | "rose" | "slate";

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function scoreTone(score: number): Tone {
  if (score >= 70) return "blue";
  if (score >= 55) return "amber";
  return "rose";
}

const LIFECYCLE_STEPS: { label: string; detail: string; future?: boolean }[] = [
  { label: "Find tenant", detail: "Landlord browses verified, discoverable tenant profiles." },
  { label: "Verify trust", detail: "Identity, documents, income, and references are checked." },
  { label: "Review lease", detail: "Tenant reviews the lease with Xpello before signing." },
  { label: "Start tenancy", detail: "Lease begins with a shared, agreed record." },
  { label: "Track payment behaviour", detail: "Rent payments are logged as verified evidence." },
  { label: "Improve TrustScore", detail: "Consistent on-time payments lift the score over time." },
  { label: "Escalate with Xpello", detail: "If payments stop, Xpello supports resolution." },
  { label: "PayProp sync", detail: "Concept only: export the tenancy to PayProp for collection.", future: true },
];

const POSITIONING = {
  payprop: [
    "Rent collection",
    "Payments and reconciliation",
    "Trust accounting",
    "Arrears management",
    "Property management reporting",
  ],
  proptrust: [
    "Finding a trustworthy tenant",
    "Identity and document verification",
    "Rental Reliability / TrustScore",
    "Lease confidence through Xpello",
    "Ongoing reputation as rent is paid",
  ],
};

const ECOSYSTEM_CARDS: {
  key: string;
  title: string;
  status: string;
  tone: Tone;
  description: string;
  href?: string;
  linkLabel?: string;
}[] = [
  {
    key: "reliability",
    title: "Rental Reliability",
    status: "Prototype: scoring live",
    tone: "blue",
    description:
      "A tenant's score weighs verified rent payments, affordability, references, and documents. Credit bureau data is one input, not the deciding factor.",
    href: "/tenant-verification",
    linkLabel: "See the scoring prototype",
  },
  {
    key: "legal-health",
    title: "Legal Health",
    status: "Concept",
    tone: "blue",
    description:
      "Landlords see a breach-readiness checklist backed by Xpello. Tenants see a clause-by-clause lease review before they sign.",
    href: "/xpello/landlord",
    linkLabel: "View legal protection concept",
  },
  {
    key: "payment-history",
    title: "Payment History",
    status: "Prototype: scoring live",
    tone: "blue",
    description:
      "Verified on-time rent payments are logged as evidence and reduce how much the score depends on bureau data over time.",
  },
  {
    key: "xpello-support",
    title: "Xpello Support",
    status: "Concept",
    tone: "blue",
    description:
      "Fixed monthly legal support, with legal escalation handled under the membership terms. Most matters are meant to resolve before court.",
    href: "/xpello/tenant",
    linkLabel: "View lease review concept",
  },
  {
    key: "payprop-sync",
    title: "Future PayProp Sync",
    status: "Not connected. Concept only.",
    tone: "slate",
    description:
      "Illustrative only. No PayProp account or API is connected. A future sync could use PayProp's payment records as verified rent evidence.",
  },
];

const PAYPROP_SYNC_ITEMS = ["Rent collection sync", "Arrears sync", "Reconciliation export"];

export default function RentalEcosystemPrototypePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="border-b border-slate-200 bg-white px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">
              PropTrust ecosystem prototype
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-5xl">
              The trust layer before, during, and after a tenancy
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              PropTrust helps create trusted rentals before they become managed rentals.
              Verified rent payments should strengthen a tenant&rsquo;s profile more than an
              old, unrelated credit issue weakens it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tenant-verification"
                className="rounded-full bg-[#1e40af] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                See Rental Reliability prototype
              </Link>
              <Link
                href="/xpello/landlord"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See Xpello concept
              </Link>
            </div>
          </div>
        </section>

        {/* Positioning: PropTrust vs PayProp */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              Positioning
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              PayProp manages rentals. PropTrust builds the trust profile around them.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              PropTrust is not trying to become a payments and reconciliation platform.
              PayProp already does that well. PropTrust owns the earlier and broader trust
              layer: finding a reliable tenant, verifying them, and building their rental
              reputation over time.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">PayProp</h3>
                  <Badge tone="slate">Reference point, not a target to clone</Badge>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  {POSITIONING.payprop.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-6 ring-1 ring-blue-50">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">PropTrust</h3>
                  <Badge tone="blue">Trust, verification, and reputation layer</Badge>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  {POSITIONING.proptrust.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Lifecycle */}
        <section className="border-y border-slate-200 bg-white px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              Lifecycle
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              One trust layer, across the whole tenancy
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {LIFECYCLE_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className={`rounded-xl border p-4 ${
                    step.future
                      ? "border-dashed border-slate-300 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    {step.future && <Badge tone="slate">Future concept</Badge>}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystem cards */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              Ecosystem cards
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              What exists today, and what is still a concept
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {ECOSYSTEM_CARDS.map((card) => (
                <div key={card.key} className="card flex flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                    <Badge tone={card.tone}>{card.status}</Badge>
                  </div>
                  <p className="flex-1 text-sm leading-6 text-slate-600">{card.description}</p>

                  {card.key === "payment-history" && (
                    <div className="mt-4 flex items-center gap-2">
                      {verifiedPayments.map((payment) => (
                        <span
                          key={payment.month}
                          className="flex h-8 flex-1 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-700"
                        >
                          {payment.month}
                        </span>
                      ))}
                      <span className="ml-1 text-xs text-slate-400">on time</span>
                    </div>
                  )}

                  {card.key === "reliability" && (
                    <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <span className="text-2xl font-extrabold text-slate-950">
                        {featuredResult.score}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                      <Badge tone={scoreTone(featuredResult.score)}>{featuredResult.band}</Badge>
                    </div>
                  )}

                  {card.key === "payprop-sync" && (
                    <div className="mt-4 space-y-2">
                      {PAYPROP_SYNC_ITEMS.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500"
                        >
                          {item}
                          <Badge tone="slate">Planned</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {card.href && (
                    <Link
                      href={card.href}
                      className="mt-4 text-xs font-semibold text-blue-700 hover:underline"
                    >
                      {card.linkLabel} &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Both sides */}
        <section className="border-t border-slate-200 bg-white px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              Built for both sides
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              Xpello gives both sides legal confidence before problems become disputes
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  For landlords
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>See a rental reliability summary, not a raw credit score.</li>
                  <li>Know a breach or arrears case is escalation-ready if needed.</li>
                  <li>Get legal support through Xpello without handling it alone.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  For tenants
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>Old or unrelated credit issues do not define the whole profile.</li>
                  <li>Verified rent payments build a reusable, improving trust history.</li>
                  <li>Understand a lease and their rights before signing, through Xpello.</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-500">
              Full strategy notes, including what is mocked today and what still needs legal
              and commercial confirmation, are documented in
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                docs/proptrust-payprop-xpello-strategy.md
              </code>
              .
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6">
          <XpelloDisclaimer />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
