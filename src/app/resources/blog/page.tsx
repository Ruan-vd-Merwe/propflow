import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const COMING_SOON_ARTICLES = [
  {
    category: "Landlord guides",
    title: "How to set a rental price in Cape Town and Johannesburg in 2026",
    summary:
      "A practical guide to pricing your rental competitively, what data to look at, what platforms to compare and how to account for vacancy risk.",
    readTime: "7 min read",
  },
  {
    category: "Tenant guides",
    title:
      "What landlords actually look at when screening a tenant application",
    summary:
      "A behind-the-scenes look at what a landlord reviews when assessing an application, and how to prepare a profile that stands out for the right reasons.",
    readTime: "5 min read",
  },
  {
    category: "Legal",
    title:
      "Deposit disputes in South Africa: what landlords and tenants need to know",
    summary:
      "Common causes of deposit disputes, the legal requirements around refunds and how a joint inspection at move-in and move-out protects both parties.",
    readTime: "8 min read",
  },
  {
    category: "Property management",
    title: "Managing maintenance requests without losing track",
    summary:
      "Why verbal and WhatsApp-based maintenance requests create problems, and how a structured request process protects both landlords and tenants.",
    readTime: "5 min read",
  },
  {
    category: "Landlord guides",
    title:
      "Body corporate basics for sectional title landlords in South Africa",
    summary:
      "What body corporate levies cover, how to track levy payments and what landlords need to understand about sectional title ownership and rental.",
    readTime: "6 min read",
  },
  {
    category: "Tenant guides",
    title: "Building a rental history when you are renting for the first time",
    summary:
      "How to present yourself as a reliable applicant without an existing rental record, and why building a verified profile early makes future rentals easier.",
    readTime: "4 min read",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Landlord guides": "bg-blue-50 text-[#1e40af]",
  "Tenant guides": "bg-green-50 text-green-700",
  Legal: "bg-amber-50 text-amber-700",
  "Property management": "bg-purple-50 text-purple-700",
};

export default function BlogPage() {
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
              PropTrust Blog
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              Practical guides, legal explainers and property management advice
              written for South African landlords, tenants and property
              managers.
            </p>
          </div>
        </div>
      </section>

      {/* COMING SOON BANNER */}
      <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-5">
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e40af]">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Coming soon.</span>{" "}
            The PropTrust blog is being written and will be published shortly.
            The articles below are a preview of what is planned.
          </p>
        </div>
      </div>

      {/* ARTICLE GRID */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Featured */}
          <div className="mb-12 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] p-10 md:p-14">
            <span
              className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_COLORS[COMING_SOON_ARTICLES[0].category]}`}
            >
              {COMING_SOON_ARTICLES[0].category}
            </span>
            <h2 className="mb-4 text-2xl font-extrabold text-[#0f172a] md:text-3xl">
              {COMING_SOON_ARTICLES[0].title}
            </h2>
            <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-500">
              {COMING_SOON_ARTICLES[0].summary}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {COMING_SOON_ARTICLES[0].readTime}
              </span>
              <span className="text-xs font-semibold text-slate-300">·</span>
              <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-xs font-semibold text-slate-500">
                Coming soon
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {COMING_SOON_ARTICLES.slice(1).map((article, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7"
              >
                <span
                  className={`mb-4 inline-block self-start rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_COLORS[article.category]}`}
                >
                  {article.category}
                </span>
                <h3 className="mb-3 flex-1 font-bold leading-snug text-[#0f172a]">
                  {article.title}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">
                  {article.summary}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {article.readTime}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    ·
                  </span>
                  <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-xs font-semibold text-slate-500">
                    Coming soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESOURCES LINKS */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-xl font-extrabold text-[#0f172a]">
            Available guides now
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                label: "SA Rental Law Guide",
                href: "/resources/rental-law",
                desc: "An overview of the key legislation governing residential rentals in South Africa.",
              },
              {
                label: "Tenant Screening Guide",
                href: "/resources/screening",
                desc: "A step-by-step guide to reviewing applicants before signing a lease.",
              },
              {
                label: "FAQ",
                href: "/resources/faq",
                desc: "Common questions about PropTrust, pricing and how the platform works.",
              },
            ].map((r) => (
              <Link
                key={r.label}
                href={r.href}
                className="rounded-2xl border border-[#e2e8f0] bg-white p-7 transition hover:border-blue-200 hover:shadow-sm"
              >
                <p className="font-bold text-[#0f172a]">{r.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {r.desc}
                </p>
                <p className="mt-4 text-xs font-semibold text-[#1e40af]">
                  Read guide
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NOTIFY */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-10 text-center">
          <h2 className="mb-3 text-2xl font-extrabold text-[#0f172a]">
            Get notified when articles are published
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-500">
            Create a PropTrust account to receive new guides and resources as
            they are published.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-[#1e40af] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Create free account
            </Link>
            <Link
              href="/contact"
              className="rounded-full border-2 border-[#e2e8f0] px-7 py-3.5 text-sm font-bold text-[#0f172a] transition hover:border-slate-400"
            >
              Suggest a topic
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
