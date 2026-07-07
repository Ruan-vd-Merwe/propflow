import Link from "next/link";

type MatchAction = {
  label: string;
  href: string | null;
};

export function MatchWithPeople({ hasActiveLease }: { hasActiveLease: boolean }) {
  const actions: MatchAction[] = [
    { label: "Find a flatmate", href: null },
    {
      label: "Replace a flatmate",
      href: hasActiveLease ? "#flatmate" : null,
    },
    { label: "Find someone to take over a lease", href: null },
    { label: "Match with renters with a similar budget, area, and lifestyle", href: null },
  ];

  return (
    <section className="mb-8">
      <div className="card p-5">
        <p className="font-semibold text-slate-900">Match with people</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Find the right people to share with, replace a flatmate, or plan your next move.
        </p>

        <ul className="mt-4 divide-y divide-slate-100">
          {actions.map((action) => (
            <li
              key={action.label}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="text-slate-600">{action.label}</span>
              {action.href ? (
                <Link
                  href={action.href}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-slate-50"
                >
                  Go
                </Link>
              ) : (
                <span className="rounded-full border border-dashed border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-400">
                  Coming soon
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
