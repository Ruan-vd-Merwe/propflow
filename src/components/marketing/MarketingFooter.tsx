import Link from "next/link";
import { NavLogo } from "./MarketingNav";

const COLS = [
  {
    title: "For Tenants",
    links: [
      { label: "Area Match", href: "/area-match" },
      { label: "Browse properties", href: "/browse" },
      { label: "Create rental profile", href: "/register" },
      { label: "Tenant FAQ", href: "/resources/faq" },
    ],
  },
  {
    title: "For Landlords",
    links: [
      { label: "List my property", href: "/register?role=owner" },
      { label: "Pricing", href: "/pricing" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Seller Assistant", href: "/sell/listing-assistant" },
      { label: "Savings Calculator", href: "/sell/savings-calculator" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/resources/blog" },
      { label: "Features", href: "/features" },
      { label: "Professionals", href: "/professionals" },
      { label: "Buyer Due Diligence", href: "/buy/due-diligence" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Legal and Trust",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Trust and Security", href: "/trust" },
      { label: "POPIA approach", href: "/trust#popia" },
      { label: "FAQ", href: "/resources/faq" },
      { label: "How verification works", href: "/how-scoring-works" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer id="contact" className="bg-slate-950 px-6 pb-10 pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand col */}
          <div>
            <NavLogo white />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Connect tenants and landlords directly. No agent required. Built for South Africa.
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
            POPIA-aligned &middot; Made in South Africa
          </p>
        </div>
      </div>
    </footer>
  );
}
