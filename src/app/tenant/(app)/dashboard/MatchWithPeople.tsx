type MatchAction = {
  label: string;
};

export function MatchWithPeople() {
  const actions: MatchAction[] = [
    { label: "Find a flatmate" },
    { label: "Replace a flatmate" },
    { label: "Find someone to take over a lease" },
    { label: "Match by budget, area, and lifestyle" },
  ];

  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">Match with people</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Future tools for sharing, replacing a flatmate, or planning your next move.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <span
              key={action.label}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500"
            >
              {action.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
