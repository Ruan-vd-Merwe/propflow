import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
function Warning() {
  return (
    <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

const STEPS = [
  {
    title: 'Collect a complete application',
    body:  'Ask every applicant for the same set of information. Consistency reduces bias and ensures you have enough to make an informed decision. A standard application should include the applicant\'s full name, contact details, employment status, monthly income and previous rental history.',
    items: [
      'Full name and contact details',
      'SA ID number (for verification)',
      'Proof of income or bank statements (3 months)',
      'Employment confirmation or payslip',
      'Previous landlord references',
    ],
  },
  {
    title: 'Verify identity',
    body:  'Confirming that the applicant is who they say they are is the first step in any serious screening process. A valid South African ID should be cross-checked for authenticity. Mismatched details between the ID, bank statements and stated income are a significant warning sign.',
    items: [
      'Request a clear copy of their SA ID',
      'Check that the ID number is valid (Luhn check + DOB match)',
      'Confirm the name matches all other documents',
      'Watch for signs of document manipulation',
    ],
  },
  {
    title: 'Review bank statements',
    body:  'Three months of bank statements provide a realistic picture of how an applicant manages money — more reliable than a payslip alone. Look for consistent income deposits, evidence of regular expense management, and whether the applicant has the income to cover rent comfortably.',
    items: [
      'Look for consistent monthly income deposits',
      'Note any large unexplained deposits (potential red flag)',
      'Check if the account is regularly overdrawn',
      'Assess monthly obligations against stated income',
    ],
  },
  {
    title: 'Assess income against rent',
    body:  'A widely used benchmark is that a tenant\'s gross monthly income should be at least three times the monthly rent. This is not a legal requirement, but it helps reduce the risk of payment difficulties. Be consistent in how you apply this benchmark across all applicants.',
    items: [
      'Verify gross monthly income from statements',
      'Apply a consistent income-to-rent ratio',
      'Consider total financial obligations, not just income',
      'Factor in employment stability and income type',
    ],
  },
  {
    title: 'Check rental references',
    body:  'Speaking to a previous landlord directly is one of the most valuable steps in tenant screening. Ask specific questions — not just whether the tenant was good, but whether they paid on time, how they handled maintenance issues and whether the landlord would rent to them again.',
    items: [
      'Request contact details for previous landlords',
      'Ask whether rent was paid on time and consistently',
      'Ask about property condition at end of tenancy',
      'Ask if they would rent to the same tenant again',
    ],
  },
  {
    title: 'Make a documented decision',
    body:  'Keep a record of the information you reviewed and the basis for your decision — whether you accept or decline an applicant. This protects you in the event of a dispute and helps you apply criteria consistently across all applications.',
    items: [
      'Record the documents you reviewed',
      'Note the basis for your decision',
      'Treat all applicants consistently',
      'Keep records for at least 12 months',
    ],
  },
]

const RED_FLAGS = [
  { flag: 'Refuses to submit bank statements',           why: 'May indicate financial difficulty or reluctance to be transparent.' },
  { flag: 'Income does not match stated employment',      why: 'Could indicate unreliable self-employment income or misrepresentation.' },
  { flag: 'Multiple large irregular deposits',            why: 'May indicate income instability or undeclared income sources.' },
  { flag: 'Account regularly in overdraft',              why: 'Suggests limited financial buffer and potential payment risk.' },
  { flag: 'ID number does not match date of birth',       why: 'Could indicate an invalid or falsified ID document.' },
  { flag: 'Cannot provide previous landlord contact',     why: 'Makes reference verification impossible; may suggest a difficult tenancy history.' },
  { flag: 'Urgency to move in immediately with no context', why: 'May indicate they have been evicted or are in a problematic housing situation.' },
  { flag: 'Pressure to skip any part of the screening process', why: 'Legitimate applicants generally welcome a structured process.' },
]

export default function ScreeningGuidePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Resources</p>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Tenant Screening Guide
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              A practical, step-by-step guide to reviewing tenant applications before you sign a lease — written for South African landlords managing their own properties.
            </p>
          </div>
        </div>
      </section>

      {/* WHY SCREEN */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Why tenant screening matters
              </h2>
              <p className="mb-5 text-base leading-relaxed text-slate-500">
                A single problematic tenancy can result in months of unpaid rent, property damage and a difficult eviction process. South African eviction law is tenant-protective, which means the cost of placing the wrong tenant can be significant — both financially and in time.
              </p>
              <p className="text-base leading-relaxed text-slate-500">
                A structured screening process does not eliminate risk entirely, but it significantly reduces it. It also gives you a documented basis for your decisions — which matters if a dispute arises later.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Average eviction timeline in SA',     value: '3–6 months' },
                { label: 'Court and legal costs (typical)',     value: 'R8,000–R25,000+' },
                { label: 'Lost rent during dispute',            value: 'R10,000–R50,000+' },
                { label: 'Screening time with PropTrust',       value: 'Under 30 min' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
                  <p className="text-xl font-extrabold text-[#0f172a]">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            A step-by-step screening process
          </h2>

          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <div key={i} className="grid gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-8 md:grid-cols-[auto_1fr]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-sm font-extrabold text-white">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-extrabold text-[#0f172a]">{step.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-slate-500">{step.body}</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {step.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RED FLAGS */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            Red flags to watch for
          </h2>
          <p className="mb-12 max-w-xl text-base text-slate-500">
            None of these are automatic disqualifiers — context always matters. But each is worth investigating further before making a decision.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {RED_FLAGS.map(r => (
              <div key={r.flag} className="flex items-start gap-4 rounded-xl border border-amber-100 bg-amber-50 p-5">
                <Warning />
                <div>
                  <p className="font-semibold text-slate-800">{r.flag}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{r.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPTRUST WORKFLOW */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#0f172a] p-10 text-white md:p-14">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-extrabold">How PropTrust handles screening</h2>
          <p className="mb-6 text-base leading-relaxed text-slate-300">
            PropTrust guides tenants through a structured submission process. They upload their ID, bank statements and references through their portal. You receive a clear summary — with ID validation, bank statement analysis and income assessment — so you can review the application without chasing documents manually.
          </p>
          <ul className="mb-8 space-y-3">
            {[
              'SA ID validation (Luhn check + date of birth match)',
              'Bank statement parsing for income and spending patterns',
              'Structured reference workflow',
              'Consistent application format for every applicant',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Check />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/features#screening"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0f172a] transition hover:bg-slate-100">
            See how screening works
          </Link>
        </div>
      </section>

      {/* RELATED */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-xl font-extrabold text-[#0f172a]">Related resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              { label: 'SA Rental Law Guide',  href: '/resources/rental-law', desc: 'Know the legal framework before you sign a lease.' },
              { label: 'FAQ',                  href: '/resources/faq',        desc: 'Common questions about the platform and the process.' },
              { label: 'Tenant Screening',     href: '/features#screening',   desc: 'How PropTrust\'s screening feature works.' },
            ].map(r => (
              <Link key={r.label} href={r.href}
                className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 transition hover:border-blue-200 hover:shadow-sm">
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
          <h2 className="mb-5 text-3xl font-extrabold text-white">Screen tenants with PropTrust</h2>
          <p className="mb-10 text-blue-100">Structured applications, ID validation and bank statement review — all in one place.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50">
              Start free trial
            </Link>
            <Link href="/features#screening"
              className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10">
              See the feature
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
