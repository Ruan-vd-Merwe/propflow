import Link from "next/link";

const DOORS = [
  {
    kicker: "Free to list",
    title: "List your place",
    desc: "Keep your Property24 listing live. PropTrust is where the applications get managed.",
    href: "/register?role=owner",
  },
  {
    kicker: "No more 47 chats",
    title: "Screen in one view",
    desc: "Every applicant arrives with readiness and documents. Compare side by side. Reply once.",
    href: "/register?role=owner",
  },
  {
    kicker: "No commission",
    title: "Lease and manage",
    desc: "Lease, rent tracking, and maintenance queries in the same deal.",
    href: "/register?role=owner",
  },
];

export function LandlordDoors() {
  return (
    <section id="landlord-start" className="bg-[#F7F7F5] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111B29] md:text-4xl">
            Letting, without the chaos.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
            One inbox. Verified applicants. Every step tracked, not lost in a
            chat thread.
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
