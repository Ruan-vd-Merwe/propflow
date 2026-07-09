import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingNav from "@/components/marketing/MarketingNav";
import {
  calculateRentalReliabilityScore,
  mockRentalReliabilityProfiles,
} from "@/lib/rental-reliability";

export const metadata = {
  title: "Tenant verification prototype | PropTrust",
  description:
    "Prototype of PropTrust's consent-led tenant verification and Rental Reliability Score.",
};

const profiles = mockRentalReliabilityProfiles.map((profile) => ({
  profile,
  result: calculateRentalReliabilityScore(profile),
}));

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate";
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function scoreTone(score: number) {
  if (score >= 70) return "green";
  if (score >= 55) return "amber";
  return "red";
}

export default function TenantVerificationPrototypePage() {
  const featured = profiles[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketingNav />

      <main>
        <section className="border-b border-slate-200 bg-white px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">
                  PropTrust verification prototype
                </p>
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-5xl">
                  Build your rental trust profile
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                  A consent-led screening flow that weighs verified rent behaviour,
                  affordability, references, documents, and bureau-derived risk
                  without turning one credit score into an automatic rejection.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Mock consent capture</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-950">Consent recorded</p>
                  </div>
                  <Badge tone="green">Explicit</Badge>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-600">
                  <div className="flex justify-between gap-4">
                    <span>Purpose</span>
                    <strong className="text-right text-slate-900">Rental application screening</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Data sources</span>
                    <strong className="text-right text-slate-900">Tenant uploads, mock bureau, references</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Expiry</span>
                    <strong className="text-right text-slate-900">60 days</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Landlord view</span>
                    <strong className="text-right text-slate-900">Summary only</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Tenant view</p>
                    <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                      {featured.profile.tenantName}
                    </h2>
                  </div>
                  <Badge tone={scoreTone(featured.result.score)}>{featured.result.band}</Badge>
                </div>

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-6xl font-extrabold tracking-tight text-slate-950">
                    {featured.result.score}
                  </span>
                  <span className="pb-2 text-sm font-semibold text-slate-500">/ 100</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{featured.result.summary}</p>

                <div className="mt-6 space-y-3">
                  {featured.result.components.map((item) => (
                    <div key={item.key}>
                      <div className="mb-1 flex justify-between gap-4 text-sm">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <span className="text-slate-500">
                          {item.points}/{item.maxPoints}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-700"
                          style={{ width: `${(item.points / item.maxPoints) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-extrabold text-slate-950">Improve score checklist</h2>
                <div className="mt-4 space-y-3">
                  {featured.result.tenantActions.length > 0 ? (
                    featured.result.tenantActions.map((action) => (
                      <div key={action} className="flex gap-3 text-sm text-slate-700">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-700" />
                        <span>{action}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No urgent actions. Keep rent evidence current each month.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Landlord view</p>
                    <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Applicant trust summary</h2>
                  </div>
                  <Badge tone="blue">Raw bureau hidden</Badge>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Payment confidence
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-950">
                      {featured.result.landlordSummary.paymentConfidence}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Affordability confidence
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-950">
                      {featured.result.landlordSummary.affordabilityConfidence}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-sm font-bold text-slate-900">Verification badges</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {featured.result.landlordSummary.verificationBadges.map((badge) => (
                      <Badge key={badge} tone="green">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-sm font-bold text-slate-900">Warning flags</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {featured.result.landlordSummary.warningFlags.length > 0 ? (
                      featured.result.landlordSummary.warningFlags.map((flag) => (
                        <Badge key={flag} tone="amber">
                          {flag}
                        </Badge>
                      ))
                    ) : (
                      <Badge tone="slate">No landlord-visible warning flags</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                    Request more info
                  </button>
                  <button className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                    Record decision reason
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-extrabold text-slate-950">Mock applicant scenarios</h2>
                <div className="mt-4 space-y-3">
                  {profiles.map(({ profile, result }) => (
                    <div
                      key={profile.tenantName}
                      className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{profile.tenantName}</h3>
                          <Badge tone={scoreTone(result.score)}>{result.score}/100</Badge>
                          <Badge>{result.confidence} confidence</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{result.summary}</p>
                      </div>
                      <div className="flex items-start md:justify-end">
                        <Badge tone={result.landlordSummary.warningFlags.length > 0 ? "amber" : "green"}>
                          {result.landlordSummary.warningFlags.length > 0 ? "Review" : "Clear"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
