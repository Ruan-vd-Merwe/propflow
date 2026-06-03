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
    title: 'Manage portfolios at scale',
    body:  'Track all properties, tenants and tasks in one organised dashboard. Designed to reduce the administrative burden as your portfolio grows.',
    perks: ['Multi-property dashboard', 'Portfolio-wide rent overview', 'Task and maintenance tracking'],
  },
  {
    title: 'Structured tenant workflows',
    body:  'Run a consistent tenant screening process across every property. Standardised applications, verification steps and document collection.',
    perks: ['Consistent screening workflow', 'Bank statement review', 'Centralised applicant records'],
  },
  {
    title: 'Body corporate administration',
    body:  'Handle levy tracking, meeting minutes and shared-property notices for sectional title units in your portfolio — all from one place.',
    perks: ['Levy tracking', 'Notice storage', 'Meeting minute uploads'],
  },
  {
    title: 'Efficient communication',
    body:  'Send WhatsApp and email reminders to tenants at scale. Reduce the time spent on payment follow-ups and maintenance coordination.',
    perks: ['WhatsApp notifications', 'Automated reminders', 'Maintenance request tracking'],
  },
]

const STEPS = [
  { title: 'Set up your management account', body: 'Create a property management account and configure your team access settings.' },
  { title: 'Add your portfolio',              body: 'Import properties and invite tenants. Existing tenants receive a portal link to get started.' },
  { title: 'Manage with structure',           body: 'Track rent, screen new applicants, manage maintenance and keep landlord reporting organised.' },
]

export default function ManagersPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">For Property Managers</p>
            <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Grow your property<br />
              <span className="text-[#3b82f6]">management business</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-300">
              PropTrust gives property managers a structured platform for screening, rent tracking, maintenance and body corporate administration — across any portfolio size.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-500">
                Start free trial
              </Link>
              <Link href="/pricing" className="rounded-full border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white transition hover:border-white/60 hover:bg-white/5">
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">Professional plans from R299/month. 30-day free trial.</p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            Built for professional property managers
          </h2>

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
            Getting started as a property manager
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7">
                {i < 2 && (
                  <div className="absolute right-[-13px] top-9 z-10 hidden h-px w-6 border-t-2 border-dashed border-slate-200 md:block" />
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#1e40af] text-sm font-extrabold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-bold text-[#0f172a]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-10 text-2xl font-extrabold text-[#0f172a]">Features for property managers</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Portfolio Dashboard',    href: '/features#dashboard'   },
              { label: 'Tenant Screening',       href: '/features#screening'   },
              { label: 'Rent Tracking',          href: '/features#rent'        },
              { label: 'Maintenance Requests',   href: '/features#maintenance' },
              { label: 'Body Corporate Support', href: '/features#bodycorp'    },
              { label: 'WhatsApp Notifications', href: '/features#whatsapp'    },
            ].map(f => (
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

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">Start your 30-day free trial</h2>
          <p className="mb-10 text-blue-100">Professional plan from R299/month. No credit card required to start.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50">
              Start free trial
            </Link>
            <Link href="/contact" className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10">
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
