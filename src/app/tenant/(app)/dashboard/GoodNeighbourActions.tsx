const ACTIONS = [
  "Reported maintenance early",
  "Helped keep shared areas clean",
  "Added inspection photos",
  "Helped with security or neighbourhood alerts",
  "Helped find a replacement tenant",
  "Looked after garden or shared spaces",
  "Communicated an issue clearly with the landlord",
];

/**
 * UI shell only: there is no backing table for logging these actions yet.
 * Buttons are intentionally disabled rather than wired to a fake save.
 */
export function GoodNeighbourActions() {
  const visibleActions = ACTIONS.slice(0, 3);

  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">Good neighbour actions</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Actions that show care for the property and community will sit here
          once they can be confirmed.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleActions.map((action) => (
            <span
              key={action}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500"
            >
              {action}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs font-medium text-slate-400">
            {ACTIONS.length - visibleActions.length} more planned
          </span>
        </div>
      </div>
    </section>
  );
}
