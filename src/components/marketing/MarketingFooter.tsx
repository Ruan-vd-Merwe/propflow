import Link from "next/link";
import { NavLogo } from "./MarketingNav";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Area Match", href: "/area-match" },
      { label: "Browse properties", href: "/browse" },
      { label: "For Tenants", href: "/solutions/tenants" },
      { label: "For Landlords", href: "/solutions/landlords" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Blog", href: "/resources/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "SA Rental Law Guide", href: "/resources/rental-law" },
      { label: "FAQ", href: "/resources/faq" },
      { label: "Tenant Screening Guide", href: "/resources/screening" },
      { label: "How Scoring Works", href: "/how-scoring-works" },
      { label: "Suburb Investment Scores", href: "/areas" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer id="contact" className="bg-[#0f172a] px-6 pb-10 pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand col */}
          <div>
            <NavLogo white />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              PropTrust helps tenants find a home that fits their life and helps
              landlords manage their properties without a rental agent.
            </p>
            <div className="mt-5 space-y-1">
              <p className="text-sm text-slate-500">hello@proptrust.co.za</p>
              <p className="text-sm text-slate-500">Cape Town, South Africa</p>
            </div>
          </div>

          {/* Link cols */}
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-600">
            &copy; 2026 PropTrust (Pty) Ltd &middot; proptrust.co.za
          </p>
          <p className="text-xs text-slate-600">
            POPIA Compliant &middot; Made in South Africa
          </p>
        </div>
      </div>
    </footer>
  );
}
