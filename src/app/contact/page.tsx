"use client";

import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  const [subject, setSubject] = useState("");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 text-center md:pt-28">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
            Contact
          </p>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Get in touch
          </h1>
          <p className="text-lg text-slate-300">
            Questions about PropTrust, pricing or partnerships? We&apos;re happy
            to help.
          </p>
        </div>
      </section>

      {/* CONTACT BODY */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-[5fr_7fr]">
            {/* Left: contact details */}
            <div>
              <h2 className="mb-8 text-2xl font-extrabold text-[#0f172a]">
                Contact details
              </h2>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">Email</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      hello@proptrust.co.za
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">Location</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Cape Town, South Africa
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">Office hours</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Monday to Friday
                    </p>
                    <p className="text-sm text-slate-500">8am – 5pm SAST</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882a.5.5 0 00.611.611l6.109-1.48A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-5.002-1.369l-.357-.213-3.705.897.913-3.618-.233-.372A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">WhatsApp</p>
                    <a
                      href="https://wa.me/27746020084?text=Hi%20PropTrust%2C%20I%20have%20a%20question"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block text-sm font-semibold text-green-600 underline-offset-2 hover:underline"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-[#e2e8f0] bg-white p-6">
                <p className="text-sm font-bold text-[#0f172a]">
                  Quick answers
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  For pricing questions, see the{" "}
                  <a
                    href="/pricing"
                    className="text-[#1e40af] underline-offset-2 hover:underline"
                  >
                    pricing page
                  </a>
                  . For common questions, check the{" "}
                  <a
                    href="/resources/faq"
                    className="text-[#1e40af] underline-offset-2 hover:underline"
                  >
                    FAQ
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Right: form */}
            <div>
              {/* Demo CTA */}
              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <p className="mb-1 text-sm font-bold text-[#0f172a]">
                  Are you a landlord or property manager?
                </p>
                <p className="mb-4 text-sm text-slate-500">
                  We can walk you through the platform.
                </p>
                <button
                  type="button"
                  onClick={() => setSubject("I would like a product demo")}
                  className="rounded-xl bg-[#1e40af] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Request a demo
                </button>
              </div>

              <ContactForm source="contact_page" initialSubject={subject} />

              <p className="mt-5 text-xs text-slate-400">
                We are based in Cape Town, South Africa. We aim to respond
                within 1 to 2 business days, Monday to Friday.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
