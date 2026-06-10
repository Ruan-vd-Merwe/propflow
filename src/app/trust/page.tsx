import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = {
  title: "Trust and security | PropTrust",
  description:
    "How PropTrust handles your personal and financial information.",
};

const SECTIONS = [
  {
    id: "documents",
    heading: "Documents stay private",
    paragraphs: [
      "When you upload documents to PropTrust, they are stored securely and linked to your account only.",
      "Documents are shared with a landlord only when you submit an application or explicitly give permission.",
      "Landlords you have not applied to cannot access your documents.",
    ],
  },
  {
    id: "popia",
    heading: "POPIA-aligned approach",
    paragraphs: [
      "PropTrust is designed to handle personal information in line with South African privacy expectations, including the principles of the Protection of Personal Information Act (POPIA).",
      "We collect only what is needed, store it securely, and do not share it without a legitimate reason.",
    ],
    disclaimer:
      "PropTrust is designed with POPIA principles in mind. This page describes our approach and intentions. If you have a specific compliance or legal question, contact us at hello@proptrust.co.za.",
  },
  {
    id: "landlords",
    heading: "What landlords can see",
    paragraphs: [
      "Landlords can only see information submitted as part of an application to their property.",
      "A landlord cannot browse tenant profiles or documents without a formal application.",
      "Full contact details are only shared once both parties agree to proceed.",
    ],
  },
  {
    id: "bank",
    heading: "Bank statements and financial data",
    paragraphs: [
      "When tenants upload bank statements, PropTrust uses them to support an affordability assessment.",
      "We aim to share what is relevant to a rental decision without exposing unnecessary transaction history.",
    ],
  },
  {
    id: "deletion",
    heading: "Deleting your data",
    paragraphs: [
      "You can request deletion of your account and associated data at any time.",
      "Email hello@proptrust.co.za to request account deletion.",
      "We will process requests within a reasonable timeframe.",
    ],
  },
  {
    id: "contact",
    heading: "Questions about privacy or security",
    paragraphs: [
      "Email: hello@proptrust.co.za",
      "We aim to respond within 1 to 2 business days.",
    ],
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#f8fafc] px-6 pb-16 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            Trust and Security
          </p>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-[#0f172a] md:text-5xl">
            Your data. Your control.
          </h1>
          <p className="text-lg leading-relaxed text-slate-500">
            PropTrust is designed to handle tenant and landlord information with
            care, privacy, and transparency.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl space-y-14">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id}>
              <h2 className="mb-5 text-xl font-extrabold text-[#0f172a]">
                {s.heading}
              </h2>
              <div className="space-y-4">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-slate-500">
                    {p}
                  </p>
                ))}
              </div>
              {s.disclaimer && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <p className="text-sm leading-relaxed text-amber-800">
                    {s.disclaimer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM LINKS */}
      <section className="bg-[#f8fafc] px-6 py-12">
        <div className="mx-auto max-w-3xl flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Contact us
          </Link>
          <Link
            href="/privacy"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Terms of Service
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
