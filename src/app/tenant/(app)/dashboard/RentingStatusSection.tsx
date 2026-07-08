import Link from "next/link";

type StatusCard = {
  title: string;
  body: string;
  cta: string;
  href: string | null;
  secondary?: boolean;
  badge?: string;
};

function buildCards(hasActiveLease: boolean): StatusCard[] {
  return [
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
    hasActiveLease
      ? {
          title: "Replacing a flatmate",
          body: "Create a flatmate opportunity for your current place. Share it with people you trust, then review applicants through PropTrust.",
          cta: "Set up flatmate opportunity",
          href: "#flatmate",
        }
      : {
          title: "Replacing a flatmate",
          body: "For tenants who already have a place and need someone to join or take over. Add your current lease first to set this up.",
          cta: "Add your lease",
          href: "/tenant/applications",
          secondary: true,
          badge: "Needs a lease",
        },
  ];
}

export function RentingStatusSection({
  hasActiveLease,
}: {
  hasActiveLease: boolean;
}) {
  const CARDS = buildCards(hasActiveLease);
  return (
    <section className="mb-8">
      <h2 className="mb-1 text-base font-semibold text-slate-900">
        Where are you in your rental journey?
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className={`card flex flex-col p-5 ${
              card.secondary ? "border-dashed bg-white/60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{card.title}</p>
              {card.badge && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {card.badge}
                </span>
              )}
            </div>
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
                Not available yet
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
