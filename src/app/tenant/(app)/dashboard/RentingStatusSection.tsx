import Link from "next/link";

type StatusCard = {
  title: string;
  body: string;
  cta: string;
  href: string | null;
};

const CARDS: StatusCard[] = [
  {
    title: "Currently renting",
    body: "Add your current lease, rent details, and property information.",
    cta: "Manage current home",
    href: "/tenant/applications",
  },
  {
    title: "Looking for a place",
    body: "Set your budget, areas, and move in date so you can apply faster.",
    cta: "Browse properties",
    href: "/tenant/browse",
  },
  {
    title: "Replacing a flatmate",
    body: "Find someone suitable to join or take over your rental.",
    cta: "Set up flatmate listing",
    href: "#flatmate",
  },
];

export function RentingStatusSection() {
  return (
    <section className="mb-8">
      <h2 className="mb-1 text-base font-semibold text-slate-900">
        Where are you in your rental journey?
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <div key={card.title} className="card flex flex-col p-5">
            <p className="font-semibold text-slate-900">{card.title}</p>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">
              {card.body}
            </p>
            {card.href ? (
              <Link
                href={card.href}
                className="mt-4 inline-block rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
              >
                {card.cta}
              </Link>
            ) : (
              <span className="mt-4 inline-block rounded-lg border border-dashed border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-400">
                Coming soon
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
