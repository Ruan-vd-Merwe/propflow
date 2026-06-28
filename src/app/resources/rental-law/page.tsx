import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const DISCLAIMER =
  "This guide is for general information purposes only. It does not constitute legal advice. South African rental law is subject to change. Consult a qualified attorney or the Rental Housing Tribunal for advice specific to your situation.";

const SECTIONS = [
  {
    id: "rha",
    title: "The Rental Housing Act",
    intro:
      "The Rental Housing Act 50 of 1999, as amended by the Rental Housing Amendment Act 35 of 2014, is the primary legislation governing the relationship between landlords and tenants in South Africa. It sets out the rights and obligations of both parties and establishes the Rental Housing Tribunal as a dispute resolution body.",
    points: [
      {
        heading: "Written lease agreements",
        body: "A lease does not have to be in writing to be valid, but a written agreement is strongly recommended. If a tenant requests a written lease, the landlord is legally required to provide one. The lease must include the rental amount, payment date, lease duration, deposit amount and the obligations of both parties.",
      },
      {
        heading: "Rental Housing Tribunal",
        body: "Each province has a Rental Housing Tribunal that handles disputes between landlords and tenants at no cost. Either party can approach the Tribunal for matters such as unfair lease clauses, deposit disputes, illegal eviction threats and failure to maintain the property.",
      },
      {
        heading: "Rental increases",
        body: "Rental increases must be agreed upon in the lease or notified in writing with the appropriate notice period. A landlord cannot increase rent mid-lease unless the lease explicitly allows for it. For month-to-month tenancies, one month's written notice is generally required before a rental increase takes effect.",
      },
    ],
  },
  {
    id: "deposits",
    title: "Deposits",
    intro:
      "The Rental Housing Act places specific obligations on landlords regarding the handling of tenant deposits.",
    points: [
      {
        heading: "Maximum deposit amount",
        body: "The Act does not specify a maximum deposit amount, but a deposit of two months' rent is the most common standard. Some landlords request one or three months, depending on the property and applicant risk profile.",
      },
      {
        heading: "Investment of deposit",
        body: "Landlords are required to invest the deposit in an interest-bearing account at a bank. The interest accrues for the benefit of the tenant and must be paid to the tenant at the end of the lease, along with the deposit refund (less any deductions for damage or outstanding rent).",
      },
      {
        heading: "Refund timeline",
        body: "If no damage to the property has been identified, the deposit plus interest must be refunded within 14 days of the lease ending. If an inspection reveals damage, the landlord must refund the balance within 21 days of the lease ending, together with a written account of the deductions.",
      },
      {
        heading: "Joint inspection",
        body: "A joint inspection of the property at move-in and move-out is strongly recommended. A written record of the property's condition at both points protects both the landlord and the tenant in the event of a deposit dispute.",
      },
    ],
  },
  {
    id: "notice",
    title: "Notice periods and lease termination",
    intro:
      "The notice period required to end a lease depends on whether the lease is fixed-term or month-to-month.",
    points: [
      {
        heading: "Fixed-term leases",
        body: "A fixed-term lease ends on the agreed date. Neither party needs to give notice to end the lease at the agreed termination date. If a tenant wishes to vacate before the end of the term, they may be liable for a cancellation penalty. The Consumer Protection Act limits the penalty that can be charged when a tenant provides 20 business days' written notice.",
      },
      {
        heading: "Month-to-month leases",
        body: "Either the landlord or tenant must give one calendar month's written notice to end a month-to-month tenancy. Notice must be given by the first day of the month in order to take effect at the end of that month.",
      },
      {
        heading: "Automatic continuation",
        body: "If a fixed-term lease expires and neither party terminates it or signs a new agreement, it typically continues on a month-to-month basis under the same terms and conditions.",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance and habitability",
    intro:
      "Both landlords and tenants have obligations regarding the condition of the property.",
    points: [
      {
        heading: "Landlord obligations",
        body: "The landlord is responsible for ensuring the property is in a habitable condition when the tenant moves in and for maintaining it in that condition throughout the lease. This includes the roof, plumbing, electrical systems and structural elements.",
      },
      {
        heading: "Tenant obligations",
        body: "The tenant is responsible for keeping the property clean and in good order. The tenant must report defects to the landlord promptly and is responsible for damage caused by their own negligence or misuse.",
      },
      {
        heading: "Fair wear and tear",
        body: "Normal deterioration from reasonable use, such as faded paint or worn carpets over several years, is considered fair wear and tear and cannot be deducted from the deposit. Damage resulting from negligence or misuse can be deducted.",
      },
    ],
  },
  {
    id: "eviction",
    title: "Eviction",
    intro:
      "Eviction in South Africa is governed by the Prevention of Illegal Eviction from and Unlawful Occupation of Land Act 19 of 1998 (PIE Act). A landlord cannot evict a tenant without a court order.",
    points: [
      {
        heading: "No self-help eviction",
        body: "It is illegal for a landlord to evict a tenant by removing their belongings, cutting off utilities, changing the locks or using any other means that forces the tenant to vacate without a court order. Self-help eviction can result in criminal and civil liability for the landlord.",
      },
      {
        heading: "Legal eviction process",
        body: "To evict a tenant, the landlord must first cancel the lease and give the tenant notice to vacate. If the tenant does not leave, the landlord must apply to the Magistrate's Court for an eviction order. The court will consider the circumstances of the tenant, including whether they have alternative accommodation.",
      },
      {
        heading: "Grounds for eviction",
        body: "Common grounds for eviction include persistent non-payment of rent, material breach of the lease, the landlord requiring the property for personal use, or the end of the lease term. The landlord must be able to demonstrate the grounds to the court.",
      },
    ],
  },
  {
    id: "cpa",
    title: "Consumer Protection Act implications",
    intro:
      "The Consumer Protection Act 68 of 2008 applies to residential lease agreements where the landlord is acting in the ordinary course of business (e.g., professional landlords and property managers). It provides tenants with additional protections.",
    points: [
      {
        heading: "Right to cancel a fixed-term lease",
        body: "Under the CPA, a tenant may cancel a fixed-term lease before its expiry by giving 20 business days' written notice. The landlord may charge a reasonable cancellation penalty but cannot insist the tenant remain in the property or pay the full remaining rent.",
      },
      {
        heading: "Plain language requirement",
        body: "Lease agreements must be written in plain and understandable language. Clauses that are excessively one-sided, misleading or that waive the tenant's statutory rights may be found to be unfair under the CPA.",
      },
      {
        heading: "Application to private landlords",
        body: "Private landlords who rent out property only occasionally may not be subject to the CPA, but they remain subject to the Rental Housing Act. The CPA is most clearly applicable to property management companies and landlords with multiple rental units.",
      },
    ],
  },
];

export default function RentalLawPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
              Resources
            </p>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              SA Rental Law Guide
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              A practical overview of the key laws that govern residential
              rental agreements in South Africa, written for landlords and
              tenants, not lawyers.
            </p>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs leading-relaxed text-amber-800">
            <span className="font-bold">Note: </span>
            {DISCLAIMER}
          </p>
        </div>
      </div>

      {/* TABLE OF CONTENTS */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
            {/* Sidebar TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contents
                </p>
                <nav className="space-y-2">
                  {SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-sm text-slate-600 transition hover:text-[#1e40af]"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="space-y-16">
              {SECTIONS.map((section) => (
                <div key={section.id} id={section.id}>
                  <h2 className="mb-4 text-2xl font-extrabold text-[#0f172a]">
                    {section.title}
                  </h2>
                  <p className="mb-8 text-base leading-relaxed text-slate-500">
                    {section.intro}
                  </p>

                  <div className="space-y-6">
                    {section.points.map((point) => (
                      <div
                        key={point.heading}
                        className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6"
                      >
                        <h3 className="mb-2 font-bold text-[#0f172a]">
                          {point.heading}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-500">
                          {point.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Tribunal section */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8">
                <h2 className="mb-3 text-xl font-extrabold text-[#0f172a]">
                  Need to resolve a dispute?
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  The Rental Housing Tribunal handles disputes between landlords
                  and tenants at no cost. Contact your provincial tribunal to
                  lodge a complaint or seek guidance.
                </p>
                <p className="text-sm font-semibold text-[#1e40af]">
                  Western Cape: 021 483 5158
                </p>
                <p className="text-sm text-[#1e40af]">Gauteng: 011 355 4000</p>
                <p className="mt-1 text-xs text-slate-400">
                  Contact your provincial government for local tribunal details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-xl font-extrabold text-[#0f172a]">
            Related guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                label: "Tenant Screening Guide",
                href: "/resources/screening",
                desc: "How to review applicants before signing a lease.",
              },
              {
                label: "FAQ",
                href: "/resources/faq",
                desc: "Common questions about PropTrust and the rental process.",
              },
              {
                label: "Features overview",
                href: "/features",
                desc: "See how PropTrust supports a compliant rental workflow.",
              },
            ].map((r) => (
              <Link
                key={r.label}
                href={r.href}
                className="rounded-2xl border border-[#e2e8f0] bg-white p-6 transition hover:border-blue-200 hover:shadow-sm"
              >
                <p className="font-bold text-[#0f172a]">{r.label}</p>
                <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Manage rentals with structure
          </h2>
          <p className="mb-10 text-blue-100">
            PropTrust helps you stay organised and keep records that matter,
            from screening to lease-end.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50"
            >
              Start free trial
            </Link>
            <Link
              href="/contact"
              className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
