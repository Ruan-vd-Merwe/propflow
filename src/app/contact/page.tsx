"use client";

import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const SUBJECTS = [
  "I am a tenant with a question",
  "I am a landlord with a question",
  "I would like a product demo",
  "I have a privacy or security question",
  "I have a technical issue",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  }

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
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      subject: "I would like a product demo",
                    }))
                  }
                  className="rounded-xl bg-[#1e40af] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Request a demo
                </button>
              </div>

              {submitted ? (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                    <svg
                      className="h-7 w-7 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">
                    Message sent
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Thank you for reaching out. We&apos;ll get back to you
                    within one business day.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-[#e2e8f0] bg-white p-8"
                >
                  <h2 className="mb-8 text-xl font-extrabold text-[#0f172a]">
                    Send a message
                  </h2>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Subject
                      </label>
                      <select
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-slate-900 transition focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af]"
                      >
                        <option value="" disabled>
                          Select a subject
                        </option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Message
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-[#1e40af] py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
                    >
                      {loading ? "Sending…" : "Send message"}
                    </button>
                  </div>
                </form>
              )}

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
