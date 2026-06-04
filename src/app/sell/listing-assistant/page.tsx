"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "pricing" | "photos" | "description" | "viewings" | "enquiries" | "checklist";

// ── Data ──────────────────────────────────────────────────────────────────────

const PHOTO_CHECKLIST = [
  { id: "exterior_front", label: "Exterior front — well-lit, no cars in frame", done: true },
  { id: "exterior_rear", label: "Exterior rear and garden", done: true },
  { id: "lounge", label: "Living room / lounge — wide angle", done: true },
  { id: "kitchen", label: "Kitchen — clear counters, good light", done: false },
  { id: "master_bed", label: "Master bedroom", done: false },
  { id: "other_beds", label: "Other bedrooms", done: false },
  { id: "bathrooms", label: "Main bathroom and en-suite", done: false },
  { id: "garage", label: "Garage / parking area", done: false },
  { id: "pool", label: "Pool or entertainment area (if applicable)", done: false },
  { id: "street", label: "Street view / entrance", done: false },
  { id: "floor_plan", label: "Floor plan scan or sketch", done: false },
];

const LISTING_CHECKLIST = [
  { id: "title", label: "Headline includes beds, area and a key selling point", done: true },
  { id: "price", label: "Asking price researched against recent comparables", done: true },
  { id: "description", label: "Description covers layout, features and area highlights", done: false },
  { id: "photos", label: "At least 10 photos uploaded — well lit and in order", done: false },
  { id: "property_pack", label: "Verified Property Pack is 70%+ complete", done: false },
  { id: "viewing_slots", label: "Viewing availability is set for the next 2 weeks", done: false },
  { id: "contact", label: "Contact details confirmed and viewable to buyers", done: false },
  { id: "defects", label: "Known defects disclosed in property pack", done: true },
];

const SAMPLE_ENQUIRIES = [
  {
    id: "1",
    name: "Sarah van den Berg",
    date: "2 hours ago",
    type: "Request viewing",
    message: "Hi, I am very interested in this property. Would it be possible to view this Saturday morning?",
    initials: "SV",
    bg: "bg-blue-600",
  },
  {
    id: "2",
    name: "Thabo Nkosi",
    date: "Yesterday",
    type: "Question",
    message: "Is the asking price negotiable? We are pre-approved buyers and can move quickly.",
    initials: "TN",
    bg: "bg-green-700",
  },
  {
    id: "3",
    name: "Anisha Reddy",
    date: "3 days ago",
    type: "Request documents",
    message: "Could you please share the body corporate financials and levy schedule?",
    initials: "AR",
    bg: "bg-purple-700",
  },
];

const VIEWING_SLOTS = [
  { date: "Sat 7 Jun", time: "09:00 – 11:00", booked: true, buyer: "Sarah van den Berg" },
  { date: "Sat 7 Jun", time: "11:30 – 13:00", booked: false, buyer: null },
  { date: "Sun 8 Jun", time: "10:00 – 12:00", booked: false, buyer: null },
  { date: "Sat 14 Jun", time: "09:00 – 11:00", booked: false, buyer: null },
];

// ── Tab components ─────────────────────────────────────────────────────────────

function PricingTab() {
  const [price, setPrice] = useState("2850000");

  const numPrice = parseInt(price.replace(/\D/g, ""), 10) || 0;
  const agentCommission = numPrice * 0.055;
  const privateSaving = agentCommission - 4500;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Pricing Guidance</h3>
        <p className="text-sm text-slate-500">Set a competitive price based on comparable sales in your area.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Your Asking Price (ZAR)</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. 2850000"
        />
        <p className="mt-1 text-xs text-slate-400">Enter the full amount without spaces or currency symbols.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transfer Duty Threshold</p>
          <p className="mt-1 text-sm font-bold text-slate-900">R1,100,000</p>
          <p className="mt-0.5 text-xs text-slate-400">No transfer duty below this amount for natural persons.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comparable Sales</p>
          <p className="mt-1 text-sm font-bold text-slate-900">R2.6M – R3.1M</p>
          <p className="mt-0.5 text-xs text-slate-400">Recent sales in your suburb range (demo data).</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Days on Market</p>
          <p className="mt-1 text-sm font-bold text-slate-900">47 days</p>
          <p className="mt-0.5 text-xs text-slate-400">Properties priced correctly sell in under 60 days.</p>
        </div>
      </div>

      {numPrice > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Your estimated saving</p>
          <p className="text-sm text-blue-800">
            At R{numPrice.toLocaleString("en-ZA")}, a traditional 5.5% agent commission would be{" "}
            <strong>R{agentCommission.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}</strong>. Selling privately on PropTrust saves you approximately{" "}
            <strong>R{privateSaving.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}</strong>.
          </p>
          <Link href="/sell/savings-calculator" className="mt-2 inline-block text-xs font-bold text-blue-700 hover:underline">
            Open full savings calculator
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Pricing strategy guidance</p>
        <ul className="space-y-2">
          {[
            "Price within 5% of comparables to attract pre-approved buyers.",
            "Overpriced listings take longer to sell and attract low-ball offers after 60+ days.",
            "If you receive no viewings in the first 2 weeks, consider a 3-5% reduction.",
            "Avoid round numbers — R2,849,000 performs better than R2,900,000.",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e40af]" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PhotosTab() {
  const [items, setItems] = useState(PHOTO_CHECKLIST);
  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Photo Checklist</h3>
          <p className="text-sm text-slate-500">Great photos are the single biggest factor in driving viewings.</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
          {done} / {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i))}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
              item.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
              item.done ? "border-green-500 bg-green-500" : "border-slate-300"
            }`}>
              {item.done && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.done ? "text-green-800 line-through" : "text-slate-700"}`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Photography tips</p>
        <ul className="space-y-1.5">
          {[
            "Shoot in the morning or late afternoon when natural light is best.",
            "Use landscape orientation. Portrait photos look poor on desktop listings.",
            "Declutter every room before photographing. Less is more.",
            "A professional photographer charges R800–R1,500 and is worth every rand.",
          ].map((tip) => (
            <li key={tip} className="text-xs text-amber-800 flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-600" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DescriptionTab() {
  const [title, setTitle] = useState("Immaculate 3-bedroom family home in Rondebosch with solar, pool and garaging");
  const [body, setBody] = useState(
    "This well-maintained three-bedroom, two-bathroom family home sits on a 480m² erf in the sought-after suburb of Rondebosch. The open-plan living and dining area opens onto a covered patio and pool, ideal for year-round entertaining.\n\nThe modern kitchen features Caesarstone counters and a gas hob. The master bedroom includes a full en-suite bathroom and built-in cupboards. Two additional bedrooms are served by the main bathroom.\n\nFeatures include a double automated garage, solar PV with battery backup, borehole, and established low-maintenance garden. Walking distance to Rondebosch Boys and close to UCT, sports clubs and top primary schools."
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Listing Description</h3>
        <p className="text-sm text-slate-500">Write a clear, honest description that helps buyers self-qualify before requesting a viewing.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Headline</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="e.g. Sunny 3-bed family home in Rondebosch with pool and solar"
        />
        <p className="mt-1 text-xs text-slate-400">{title.length}/120 characters · Include: bedroom count, suburb, key feature</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description</label>
        <textarea
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Describe the property layout, key features, condition and the surrounding area…"
        />
        <p className="mt-1 text-xs text-slate-400">{body.length} characters · Aim for 200–500 words</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">What to include</p>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {[
            "Number of bedrooms and bathrooms",
            "Stand / erf size and floor area",
            "Parking: garage, carport or street",
            "Kitchen features and appliances",
            "Outdoor spaces: garden, patio, pool",
            "Security features",
            "Energy features: solar, gas, borehole",
            "Proximity to schools and amenities",
            "Levy and rates amounts",
            "Occupancy date",
          ].map((item) => (
            <p key={item} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#1e40af]" />
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-bold text-slate-900">Viewing Scheduler</h3>
        <p className="text-sm text-slate-500">Manage your viewing slots and confirm bookings with buyers.</p>
      </div>

      <div className="space-y-3">
        {VIEWING_SLOTS.map((slot, i) => (
          <div key={i} className={`rounded-xl border p-4 ${slot.booked ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{slot.date}</p>
                <p className="text-xs text-slate-500">{slot.time}</p>
                {slot.booked && (
                  <p className="mt-1 text-xs font-semibold text-blue-700">Booked — {slot.buyer}</p>
                )}
              </div>
              {slot.booked ? (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">Confirmed</span>
              ) : (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">Available</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-500 transition hover:border-blue-300 hover:text-blue-600">
        + Add viewing slot
      </button>

      <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Viewing tips</p>
        <ul className="space-y-1.5">
          {[
            "Always verify a buyer's contact details before confirming a viewing.",
            "Offer 2 or 3 fixed slots per week — too many options leads to no-shows.",
            "Send a confirmation message 24 hours before each viewing.",
            "Consider hosting a group viewing on Saturday mornings to create urgency.",
          ].map((tip) => (
            <li key={tip} className="text-xs text-slate-600 flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EnquiriesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Buyer Enquiry Inbox</h3>
          <p className="text-sm text-slate-500">Manage all buyer messages in one place.</p>
        </div>
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">2 unread</span>
      </div>

      <div className="space-y-3">
        {SAMPLE_ENQUIRIES.map((enq) => (
          <div key={enq.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${enq.bg}`}>
                {enq.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-bold text-slate-900">{enq.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{enq.type}</span>
                    <span className="text-xs text-slate-400">{enq.date}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{enq.message}</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg bg-[#1e40af] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800">
                    Reply
                  </button>
                  <Link
                    href="/sell/property-pack"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Share property pack
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-[#f8fafc] p-4">
        <p className="text-xs text-slate-500">
          All buyer communications are logged with timestamps and preserved as part of your sale audit trail.{" "}
          <Link href="/enquiry" className="text-blue-600 hover:underline">View full communication centre</Link>
        </p>
      </div>
    </div>
  );
}

function ListingChecklistTab() {
  const [items, setItems] = useState(LISTING_CHECKLIST);
  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Listing Quality Checklist</h3>
          <p className="text-sm text-slate-500">Complete all items before publishing your listing.</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">{done} / {items.length}</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i))}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
              item.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
              item.done ? "border-green-500 bg-green-500" : "border-slate-300"
            }`}>
              {item.done && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.done ? "text-green-800" : "text-slate-700"}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {done === items.length && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="font-bold text-green-800">Your listing is ready to publish.</p>
          <p className="mt-1 text-sm text-green-700">All quality checks are complete. Buyers will find a complete, professional listing.</p>
          <Link href="/register" className="mt-3 inline-block rounded-lg bg-green-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-800">
            Publish listing
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "pricing", label: "Pricing" },
  { id: "photos", label: "Photos" },
  { id: "description", label: "Description" },
  { id: "viewings", label: "Viewings" },
  { id: "enquiries", label: "Enquiries" },
  { id: "checklist", label: "Checklist" },
];

export default function ListingAssistantPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pricing");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Private Sale</p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Seller Listing Assistant
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            A guided workflow to price, photograph, describe and manage your private property sale from listing to accepted offer.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-10">
        <div className="mx-auto max-w-4xl">

          {/* Tab bar */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#1e40af] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeTab === "pricing" && <PricingTab />}
            {activeTab === "photos" && <PhotosTab />}
            {activeTab === "description" && <DescriptionTab />}
            {activeTab === "viewings" && <ViewingsTab />}
            {activeTab === "enquiries" && <EnquiriesTab />}
            {activeTab === "checklist" && <ListingChecklistTab />}
          </div>

          {/* Bottom nav */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sell/property-pack"
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Property Pack
            </Link>
            <Link
              href="/buy/offer-to-purchase"
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Offer-to-Purchase Guide
            </Link>
            <Link
              href="/professionals"
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Find Professionals
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
