"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

type EnquiryType = "question" | "documents" | "viewing" | "interest";

type Message = {
  id: string;
  from: "buyer" | "seller";
  type: EnquiryType | "reply";
  content: string;
  timestamp: string;
  name: string;
};

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_LISTING = {
  address: "14 Oakhurst Avenue, Rondebosch, Cape Town",
  price: "R2,850,000",
  beds: 3,
  baths: 2,
  size: "210m²",
  sellerName: "Johan van der Berg",
  sellerInitials: "JV",
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    from: "buyer",
    type: "question",
    content: "Hi Johan, are there any outstanding disputes with the body corporate? Also, has there been any water ingress in the past 3 years?",
    timestamp: "3 Jun 2026, 09:14",
    name: "Sarah Naidoo",
  },
  {
    id: "2",
    from: "seller",
    type: "reply",
    content: "Hi Sarah. No body corporate disputes — levies are fully paid up. We did have a small leak around the north-facing window in 2023 which was repaired by a waterproofing contractor. I have the invoice if you would like to see it.",
    timestamp: "3 Jun 2026, 11:42",
    name: "Johan van der Berg",
  },
  {
    id: "3",
    from: "buyer",
    type: "documents",
    content: "Thank you. Could you please share the waterproofing invoice, the body corporate financials, and the most recent AGM minutes?",
    timestamp: "3 Jun 2026, 12:05",
    name: "Sarah Naidoo",
  },
  {
    id: "4",
    from: "seller",
    type: "reply",
    content: "I have uploaded the body corporate financials and AGM minutes to the property pack. I will get the waterproofing invoice from my email and share it by tomorrow.",
    timestamp: "3 Jun 2026, 14:20",
    name: "Johan van der Berg",
  },
];

const ENQUIRY_TYPES: { id: EnquiryType; label: string; desc: string; color: string }[] = [
  { id: "question", label: "Ask a question", desc: "General enquiry about the property", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { id: "documents", label: "Request documents", desc: "Ask for specific documentation", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { id: "viewing", label: "Request a viewing", desc: "Arrange a time to view the property", color: "bg-green-50 border-green-200 text-green-800" },
  { id: "interest", label: "Submit interest", desc: "Indicate you intend to make an offer", color: "bg-amber-50 border-amber-200 text-amber-800" },
];

const DOCUMENT_TEMPLATES = [
  "Title deed extract",
  "Defect disclosure form",
  "Body corporate financials (last 3 years)",
  "Body corporate AGM minutes",
  "Levy schedule and arrears statement",
  "Rates clearance certificate",
  "Electrical compliance certificate",
  "Gas compliance certificate",
  "Approved building plans",
  "Compliance inspection report",
];

const VIEWING_TIMES = [
  "Sat 7 Jun — 09:00 to 11:00",
  "Sat 7 Jun — 11:30 to 13:00",
  "Sun 8 Jun — 10:00 to 12:00",
  "Tue 10 Jun — 17:00 to 18:30",
  "Sat 14 Jun — 09:00 to 11:00",
];

// ── Badge ─────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: EnquiryType | "reply" }) {
  const map: Record<string, string> = {
    question: "bg-blue-100 text-blue-700",
    documents: "bg-purple-100 text-purple-700",
    viewing: "bg-green-100 text-green-700",
    interest: "bg-amber-100 text-amber-700",
    reply: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    question: "Question",
    documents: "Document request",
    viewing: "Viewing request",
    interest: "Interest",
    reply: "Reply",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[type]}`}>
      {labels[type]}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EnquiryPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [selectedType, setSelectedType] = useState<EnquiryType>("question");
  const [messageText, setMessageText] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedViewing, setSelectedViewing] = useState("");
  const [sent, setSent] = useState(false);
  const [senderName] = useState("Sarah Naidoo");

  function toggleDoc(doc: string) {
    setSelectedDocs((prev) => prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]);
  }

  function buildMessage(): string {
    if (selectedType === "documents" && selectedDocs.length > 0) {
      return `Please share the following documents:\n${selectedDocs.map((d) => `• ${d}`).join("\n")}${messageText ? `\n\n${messageText}` : ""}`;
    }
    if (selectedType === "viewing" && selectedViewing) {
      return `I would like to request a viewing on: ${selectedViewing}.${messageText ? `\n\n${messageText}` : ""}`;
    }
    if (selectedType === "interest") {
      return `I would like to register my interest in this property and intend to submit an offer.${messageText ? `\n\n${messageText}` : ""}`;
    }
    return messageText;
  }

  function handleSend() {
    const content = buildMessage();
    if (!content.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      from: "buyer",
      type: selectedType,
      content,
      timestamp: new Date().toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      name: senderName,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessageText("");
    setSelectedDocs([]);
    setSelectedViewing("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-12 pt-16 md:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Direct Communication</p>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Buyer-Seller Communication Centre
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300">
            Ask questions, request documents, arrange viewings and submit interest — all in one auditable, timestamped thread.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Left: property info */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Property</p>
                <p className="text-sm font-bold text-slate-900">{DEMO_LISTING.address}</p>
                <p className="mt-1 text-xl font-extrabold text-[#1e40af]">{DEMO_LISTING.price}</p>
                <div className="mt-3 flex gap-3 text-xs text-slate-500">
                  <span>{DEMO_LISTING.beds} beds</span>
                  <span>·</span>
                  <span>{DEMO_LISTING.baths} baths</span>
                  <span>·</span>
                  <span>{DEMO_LISTING.size}</span>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">Listed by</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">
                      {DEMO_LISTING.sellerInitials}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{DEMO_LISTING.sellerName}</p>
                  </div>
                  <p className="mt-2 text-xs text-green-700 font-semibold">Verified private seller</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Quick actions</p>
                <div className="space-y-2">
                  <Link href="/buy/due-diligence" className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Run due diligence checklist
                  </Link>
                  <Link href="/buy/offer-to-purchase" className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Prepare offer to purchase
                  </Link>
                  <Link href="/sell/property-pack" className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    View property pack
                  </Link>
                  <Link href="/professionals" className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Find conveyancer
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: communication thread */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Message thread */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="text-sm font-bold text-slate-900">Communication thread</p>
                  <p className="text-xs text-slate-400">{messages.length} messages · All times shown in SAST · Audit trail preserved</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-5 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.from === "buyer" ? "flex-row" : "flex-row-reverse"}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        msg.from === "buyer" ? "bg-[#1e40af]" : "bg-[#0f172a]"
                      }`}>
                        {msg.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className={`max-w-[75%] ${msg.from === "seller" ? "items-end" : ""}`}>
                        <div className={`flex items-center gap-2 mb-1 ${msg.from === "seller" ? "flex-row-reverse" : ""}`}>
                          <p className="text-xs font-semibold text-slate-700">{msg.name}</p>
                          <TypeBadge type={msg.type} />
                          <p className="text-xs text-slate-400">{msg.timestamp}</p>
                        </div>
                        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                          msg.from === "buyer" ? "bg-blue-50 text-blue-900" : "bg-slate-100 text-slate-800"
                        }`}>
                          {msg.content.split("\n").map((line, i) => (
                            <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compose */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-slate-900">Send a message</p>

                {/* Type selector */}
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ENQUIRY_TYPES.map((t) => (
                    <button key={t.id} onClick={() => setSelectedType(t.id)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        selectedType === t.id ? t.color + " border-current" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}>
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-current opacity-70">{t.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Document picker */}
                {selectedType === "documents" && (
                  <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-purple-700">Select documents to request</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {DOCUMENT_TEMPLATES.map((doc) => (
                        <button key={doc} onClick={() => toggleDoc(doc)}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                            selectedDocs.includes(doc) ? "bg-purple-200 text-purple-900 font-semibold" : "bg-white text-slate-600 hover:bg-purple-100"
                          }`}>
                          <div className={`h-3.5 w-3.5 shrink-0 rounded border ${selectedDocs.includes(doc) ? "border-purple-600 bg-purple-600" : "border-slate-300"}`}>
                            {selectedDocs.includes(doc) && (
                              <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {doc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Viewing time picker */}
                {selectedType === "viewing" && (
                  <div className="mb-4 rounded-xl border border-green-100 bg-green-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-green-700">Available viewing slots</p>
                    <div className="space-y-1.5">
                      {VIEWING_TIMES.map((slot) => (
                        <button key={slot} onClick={() => setSelectedViewing(slot)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${
                            selectedViewing === slot ? "bg-green-200 text-green-900 font-bold" : "bg-white text-slate-700 hover:bg-green-100"
                          }`}>
                          <div className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${selectedViewing === slot ? "border-green-600 bg-green-600" : "border-slate-300"}`} />
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interest note */}
                {selectedType === "interest" && (
                  <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">This message will indicate to the seller that you intend to make an offer. It is not legally binding. Use the <Link href="/buy/offer-to-purchase" className="font-bold hover:underline">OTP preparation tool</Link> to formalise your offer with a conveyancer.</p>
                  </div>
                )}

                {/* Text input */}
                <textarea rows={3} value={messageText} onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    selectedType === "question" ? "Type your question here…" :
                    selectedType === "documents" ? "Add any additional notes (optional)…" :
                    selectedType === "viewing" ? "Any additional preferences or notes for the viewing (optional)…" :
                    "Any additional context for your offer of interest (optional)…"
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="mt-3 flex items-center gap-3">
                  <button onClick={handleSend}
                    className="rounded-xl bg-[#1e40af] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                    Send message
                  </button>
                  {sent && (
                    <p className="text-sm font-semibold text-green-700">Message sent and logged.</p>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  All messages are timestamped and preserved as part of the transaction audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
