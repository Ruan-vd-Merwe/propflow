"use client";

import { useState, useEffect } from "react";

type Source = "homepage" | "contact_page";

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
  "I have a legal question about my lease",
  "I have a privacy or security question",
  "I have a technical issue",
  "Other",
];

export default function ContactForm({
  source,
  initialSubject,
}: {
  source: Source;
  initialSubject?: string;
}) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: initialSubject ?? "",
    message: "",
  });

  useEffect(() => {
    if (initialSubject) {
      setForm((prev) => ({ ...prev, subject: initialSubject }));
    }
  }, [initialSubject]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
          <svg
            className="h-7 w-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">Message sent</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Thank you for reaching out. We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#e2e8f0] bg-white p-8"
    >
      <h2 className="mb-8 text-xl font-extrabold text-[#0f172a]">Send a message</h2>

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

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#1e40af] py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
