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

const BENEFITS = [
  {
    title: 'Save on agent commission',
    body:  'A typical rental agent charges 8–10% of monthly rent. PropTrust gives you the tools to manage the rental process yourself, at a fixed, transparent monthly subscription.',
    perks: ['No percentage-based fees', 'Flat monthly subscription', 'Cancel anytime'],
  },
  {
    title: 'Screen tenants properly',
    body:  'Review structured tenant applications including ID verification, bank statement analysis and income confirmation, before you sign any lease.',
    perks: ['SA ID validation', 'Bank statement review', 'Income confirmation', 'Reference workflow'],
  },
  {
    title: 'Track rent automatically',
    body:  'Keep a clear payment record for every tenant. Set due dates, log payments and receive automated reminders so nothing falls through the cracks.',
    perks: ['Payment history per tenant', 'Due date tracking', 'Automated email reminders', 'WhatsApp reminders (Professional+)'],
  },
  {
    title: 'Keep everything organised',
    body:  'Store leases, inspection reports and property documents in one place. Access them from any device, at any time.',
    perks: ['Lease storage', 'Inspection reports', 'Document folders per tenant', 'Any file type'],
  },
]

const STEPS = [
  { title: 'Create your account',            body: 'Sign up and set up your landlord profile. It takes a few minutes and no credit card is required.' },
  { title: 'Add your property',              body: 'Capture property details, rental amount and lease information. Invite existing tenants or wait for new applications.' },
  { title: 'Manage tenants with confidence', body: 'Screen applicants, track rent, handle maintenance requests and keep documents organised, all from one dashboard.' },
]

const FEATURES = [
  { label: 'Tenant Screening',     href: '/features#screening'   },
  { label: 'Rent Tracking',        href: '/features#rent'        },
  { label: 'Maintenance Requests', href: '/features#maintenance' },
  { label: 'Property Dashboard',   href: '/features#dashboard'   },
  { label: 'Document Storage',     href: '/features#documents'   },
  { label: 'WhatsApp Alerts',      href: '/features#whatsapp'    },
]

export default function LandlordsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">For Landlords</p>
            <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Manage your properties<br />
              <span className="text-[#3b82f6]">without a rental agent</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-300">
              PropTrust gives you the tools to screen tenants, track rent, manage maintenance and keep documents organised, without handing control to an agent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-500">
                Start free trial
              </Link>
              <Link href="/pricing" className="rounded-full border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white transition hover:border-white/60 hover:bg-white/5">
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">No credit card required. 30-day free trial.</p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              What landlords use PropTrust for
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {BENEFITS.map(b => (
              <div key={b.title} className="rounded-2xl border border-[#e2e8f0] bg-white p-8">
                <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">{b.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">{b.body}</p>
                <ul className="space-y-2">
                  {b.perks.map(p => (
                    <li key={p} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            How it works for landlords
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7">
                {i < 2 && (
                  <div className="absolute right-[-13px] top-9 z-10 hidden h-px w-6 border-t-2 border-dashed border-slate-200 md:block" />
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm font-extrabold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-bold text-[#0f172a]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RELEVANT FEATURES */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-10 text-2xl font-extrabold text-[#0f172a]">Features designed for landlords</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {FEATURES.map(f => (
              <Link
                key={f.label}
                href={f.href}
                className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 text-sm font-semibold text-[#1e40af] transition hover:border-blue-200 hover:shadow-sm"
              >
                {f.label}
              </Link>
            ))}
          </div>
          <Link href="/features" className="mt-8 inline-block text-sm font-semibold text-[#1e40af] underline-offset-2 hover:underline">
            View all platform features
          </Link>
        </div>
      </section>

      {/* PRICING SUMMARY */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-10 text-center">
          <h2 className="mb-4 text-2xl font-extrabold text-[#0f172a]">Landlord pricing</h2>
          <p className="mb-8 text-slate-500">Flat monthly subscription. No agent commission. No setup fee.</p>
          <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
            {[
              { name: 'Starter',      price: 'R99/mo',  note: 'Up to 3 properties' },
              { name: 'Professional', price: 'R299/mo', note: 'Up to 15 properties', featured: true },
              { name: 'Enterprise',   price: 'R799/mo', note: 'Unlimited properties' },
            ].map(p => (
              <div key={p.name} className={`flex-1 rounded-2xl p-6 ${p.featured ? 'bg-[#0f172a] text-white' : 'bg-white border border-[#e2e8f0]'}`}>
                <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${p.featured ? 'text-blue-300' : 'text-slate-400'}`}>{p.name}</p>
                <p className={`text-2xl font-extrabold ${p.featured ? 'text-white' : 'text-[#0f172a]'}`}>{p.price}</p>
                <p className={`mt-1 text-xs ${p.featured ? 'text-blue-200' : 'text-slate-400'}`}>{p.note}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="mt-8 inline-block text-sm font-semibold text-[#1e40af] underline-offset-2 hover:underline">
            Full pricing details
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">Start managing your properties</h2>
          <p className="mb-10 text-blue-100">30-day free trial. No credit card required.</p>
          <Link href="/register" className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50">
            Start free trial
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
