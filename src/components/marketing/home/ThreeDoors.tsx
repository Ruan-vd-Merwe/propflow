import Link from "next/link";

const DOORS = [
  {
    kicker: "Start here",
    title: "Find your area",
    desc: "Suburbs matched to your budget, commute, and life. Before you browse a single listing.",
    href: "/area-match",
  },
  {
    kicker: "2 minutes",
    title: "Build your profile once",
    desc: "Documents in one place. Your TrustScore travels with every application. Never explain yourself twice.",
    href: "/register",
  },
  {
    kicker: "No agents",
    title: "Apply directly",
    desc: "Straight to the landlord. See where you stand: applied, screened, viewing, lease.",
    href: "/browse",
  },
];

export function ThreeDoors() {
  return (
    <section id="start" className="bg-[#F7F7F5] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111B29] md:text-4xl">
            Renting, without the silence.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
            One profile. Direct contact. Every application answered inside
            the deal, not lost in someone&rsquo;s chat.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {DOORS.map((door) => (
            <Link
              key={door.title}
              href={door.href}
              className="group flex flex-col rounded-2xl border border-[#E7E6E2] bg-white p-7 transition hover:-translate-y-1 hover:border-[#2563EB] hover:shadow-md"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#2563EB]">
                {door.kicker}
              </p>
              <p className="text-lg font-bold text-[#111B29]">{door.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {door.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
