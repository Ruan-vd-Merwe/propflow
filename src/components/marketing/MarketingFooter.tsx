import Link from "next/link";
import { NavLogo } from "./MarketingNav";

const COLS = [
  {
    title: "Sell Privately",
    links: [
      { label: "Seller Listing Assistant", href: "/sell/listing-assistant" },
      { label: "Verified Property Pack", href: "/sell/property-pack" },
      { label: "Savings Calculator", href: "/sell/savings-calculator" },
      { label: "For Landlords", href: "/solutions/landlords" },
    ],
  },
  {
    title: "Buy Privately",
    links: [
      { label: "Buyer Due Diligence", href: "/buy/due-diligence" },
      { label: "Offer-to-Purchase Guide", href: "/buy/offer-to-purchase" },
      { label: "Communication Centre", href: "/enquiry" },
      { label: "For Tenants", href: "/solutions/tenants" },
    ],
  },
  {
    title: "Browse",
    links: [
      { label: "Browse properties", href: "/browse" },
      { label: "Area Match", href: "/area-match" },
      { label: "Professionals", href: "/professionals" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "SA Rental Law Guide", href: "/resources/rental-law" },
      { label: "FAQ", href: "/resources/faq" },
      { label: "How Scoring Works", href: "/how-scoring-works" },
      { label: "About us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer id="contact" className="bg-[#0f172a] px-6 pb-10 pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand col */}
          <div>
            <NavLogo white />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Sell or rent privately, but safely — with verified documents, guided due diligence, and professional handover. No estate agent required.
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
