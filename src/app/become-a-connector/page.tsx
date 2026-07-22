"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const CATEGORIES = [
  "Property viewings",
  "Photography and video",
  "Listing verification",
  "Neighbourhood guidance",
  "Key handovers",
  "Maintenance coordination",
  "Move-in support",
  "Elderly or student assistance",
];

const PROVINCES = [
  "Western Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

type FormState = "idle" | "submitting" | "success" | "error";

export default function ConnectorInterestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [province, setProvince] = useState("");
  const [motivation, setMotivation] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setFormState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/connector/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          area: area.trim(),
          province,
          motivation: motivation.trim(),
          categories,
        }),
      });

      if (res.ok) {
        setFormState("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          data.error ?? "Something went wrong. Please try again.",
        );
        setFormState("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        <MarketingNav />
        <section className="px-6 py-24 text-center md:py-32">
          <div className="mx-auto max-w-lg">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-2xl">&#10003;</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0f172a]">
              Thank you, {name.split(" ")[0] || "friend"}.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              We have received your interest in becoming a Connector. We will be
              in touch as the programme takes shape in your area.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Back to PropTrust
            </Link>
          </div>
        </section>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pb-20 md:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-400">
            Connectors
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Help people rent safely.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300">
            Register your interest in becoming a PropTrust Connector — a
            verified community member who helps tenants and landlords with
            practical, local support.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="ci-name"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="ci-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label
                htmlFor="ci-email"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="ci-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="ci-area"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Area / suburb <span className="text-red-500">*</span>
                </label>
                <input
                  id="ci-area"
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Sea Point"
                />
              </div>
              <div>
                <label
                  htmlFor="ci-province"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  id="ci-province"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="ci-motivation"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Why do you want to help?{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="ci-motivation"
                required
                rows={3}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className="input-field resize-none"
                placeholder="Tell us a bit about why you'd like to become a Connector"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                What kind of tasks interest you?{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const selected = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* POPIA consent — placeholder copy, needs legal review */}
            <div className="rounded-xl bg-slate-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs leading-relaxed text-slate-600">
                  I agree that PropTrust may store and use the information I
                  provide here to contact me about the Connector programme. My
                  data will be handled in line with PropTrust&apos;s privacy
                  approach and I can request deletion at any time.
                </span>
              </label>
            </div>

            {formState === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={formState === "submitting" || !consent}
              className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {formState === "submitting"
                ? "Submitting…"
                : "Register my interest"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            This is an expression of interest, not a commitment. We will contact
            you when the Connector programme launches in your area.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
