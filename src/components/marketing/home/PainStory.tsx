import { ScrollReveal } from "./ScrollReveal";

// ── Data ────────────────────────────────────────────────────────────────────

const TENANT_PAIN = [
  {
    text: "Uploading the same payslips and bank statements to every landlord, every time.",
    scatter: "rotate(-3deg) translate(-6px, 6px)",
  },
  {
    text: "Three WhatsApp threads with three different numbers, no idea who's actually in charge.",
    scatter: "rotate(2deg) translate(8px, -4px)",
  },
  {
    text: "Applying, then hearing nothing back. Ever.",
    scatter: "rotate(-2deg) translate(-4px, -8px)",
  },
  {
    text: "No real sense of what you can afford until you're already committed.",
    scatter: "rotate(3deg) translate(6px, 6px)",
  },
  {
    text: "Agents who don't answer, don't follow up, and disappear after the deposit.",
    scatter: "rotate(-1deg) translate(4px, -6px)",
  },
];

const LANDLORD_PAIN = [
  {
    text: "8 to 10 percent commission on every lease, every renewal.",
    scatter: "rotate(3deg) translate(6px, -6px)",
  },
  {
    text: "Enquiries from people who were never going to qualify.",
    scatter: "rotate(-2deg) translate(-8px, 4px)",
  },
  {
    text: "Checking payslips, ID copies, and bank statements by hand.",
    scatter: "rotate(2deg) translate(4px, 8px)",
  },
  {
    text: "Juggling viewing times across five different chats.",
    scatter: "rotate(-3deg) translate(-6px, -6px)",
  },
  {
    text: "Chasing rent, drafting leases, and filing paperwork solo.",
    scatter: "rotate(1deg) translate(-4px, 6px)",
  },
];

// ── Mess card ───────────────────────────────────────────────────────────────

function MessCard({ text, scatter }: { text: string; scatter: string }) {
  return (
    <div
      className="reveal-mess rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      style={{ "--scatter": scatter } as React.CSSProperties}
    >
      <p className="text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export function PainStory() {
  return (
    <section id="the-old-way" className="bg-[#f8fafc] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            The Old Way
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            Renting privately in South Africa
            <br className="hidden sm:block" />
            usually looks like this.
          </h2>
        </div>

        <ScrollReveal className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              For tenants
            </p>
            <div className="space-y-3">
              {TENANT_PAIN.map((item) => (
                <MessCard key={item.text} text={item.text} scatter={item.scatter} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              For landlords
            </p>
            <div className="space-y-3">
              {LANDLORD_PAIN.map((item) => (
                <MessCard key={item.text} text={item.text} scatter={item.scatter} />
              ))}
            </div>
          </div>
        </ScrollReveal>

        <p className="mx-auto mt-14 max-w-lg text-center text-lg font-bold text-[#0f172a]">
          PropTrust is the trusted layer between both sides.
        </p>
      </div>
    </section>
  );
}
