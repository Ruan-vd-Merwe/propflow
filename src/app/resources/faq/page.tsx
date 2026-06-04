"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

type FaqItem = { q: string; a: string };
type FaqSection = { title: string; items: FaqItem[] };

const SECTIONS: FaqSection[] = [
  {
    title: "General",
    items: [
      {
        q: "What is PropTrust?",
        a: "PropTrust is a South African property management platform that helps landlords screen tenants, track rent and manage their rental properties without relying on traditional rental agents.",
      },
      {
        q: "Who is PropTrust for?",
        a: "PropTrust is built for landlords, tenants and property managers in South Africa. Landlords use it to manage their rental properties. Tenants use it to build a verified profile and connect with landlords. Property managers use it to handle portfolios more efficiently.",
      },
      {
        q: "Is PropTrust available across South Africa?",
        a: "Yes. PropTrust is built for the South African rental market and works for properties across all provinces.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. PropTrust is POPIA compliant and uses industry-standard encryption to protect your data. Your personal details are only shared with other parties when you actively choose to do so.",
      },
      {
        q: "Can I use PropTrust on my phone?",
        a: "Yes. PropTrust is mobile-responsive and works on any smartphone or tablet browser. A dedicated mobile app is in development.",
      },
    ],
  },
  {
    title: "For Landlords",
    items: [
      {
        q: "How do I add a property?",
        a: "After signing up, click Add Property from your dashboard and follow the steps to add your property details, photos and rental information. You can add multiple properties on the Professional and Enterprise plans.",
      },
      {
        q: "How does tenant screening work?",
        a: "PropTrust guides tenants through uploading their ID, bank statements and references. You receive a structured summary of the applicant information before making a decision. This helps you review applicants more consistently, without chasing documents manually.",
      },
      {
        q: "Can I manage multiple properties?",
        a: "Yes. You can add multiple properties under one account. The Starter plan supports up to 3 properties. Professional supports up to 15. Enterprise supports unlimited properties.",
      },
      {
        q: "How are rent payments tracked?",
        a: "You can log payments manually or mark them as received when tenants confirm. PropTrust tracks the full payment history per tenant and sends automated reminders before and after due dates.",
      },
      {
        q: "Do I still need a rental agent?",
        a: "PropTrust gives you the tools to manage rentals yourself. Many landlords use it to reduce agent dependency for day-to-day management. You can still work with an agent alongside the platform if preferred.",
      },
    ],
  },
  {
    title: "For Tenants",
    items: [
      {
        q: "Is PropTrust free for tenants?",
        a: "Yes. Creating and maintaining a tenant profile on PropTrust is always free.",
      },
      {
        q: "What documents do I need to upload?",
        a: "Typically a copy of your SA ID and recent bank statements. Some landlords may request additional documents such as payslips or references. You only share documents you choose to submit.",
      },
      {
        q: "Will landlords see my personal details?",
        a: "Only the details you choose to share. Your full contact information is only shared when you accept a landlord introduction. You control what is visible on your profile.",
      },
      {
        q: "How do I submit a maintenance request?",
        a: "Log in to your tenant portal, navigate to Maintenance and submit a request with a description and any relevant photos. Your landlord or property manager will receive the request and can update the status as it progresses.",
      },
    ],
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="pr-4 font-semibold text-[#0f172a]">{item.q}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-[#e2e8f0] px-6 py-4">
          <p className="text-sm leading-relaxed text-slate-500">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 text-center md:pt-28">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
            Resources
          </p>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Frequently asked questions
          </h1>
          <p className="text-lg text-slate-300">
            Answers to common questions about PropTrust, accounts, pricing and
            how the platform works.
          </p>
        </div>
      </section>

      {/* FAQ SECTIONS */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-16">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-6 text-xl font-extrabold text-[#0f172a]">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${idx}`;
                  return (
                    <AccordionItem
                      key={key}
                      item={item}
                      isOpen={openKey === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-10 text-center">
          <h2 className="mb-3 text-2xl font-extrabold text-[#0f172a]">
            Still have a question?
          </h2>
          <p className="mb-8 text-slate-500">
            Our team is available Monday to Friday, 8am–5pm SAST.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-[#1e40af] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Contact us
            </Link>
            <a
              href="mailto:hello@proptrust.co.za"
              className="rounded-full border-2 border-[#e2e8f0] px-7 py-3.5 text-sm font-bold text-[#0f172a] transition hover:border-slate-400"
            >
              hello@proptrust.co.za
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
