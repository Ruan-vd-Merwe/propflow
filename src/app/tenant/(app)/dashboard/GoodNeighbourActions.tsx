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
  return (
    <section className="mb-8">
      <div className="card p-5">
        <p className="font-semibold text-slate-900">Good neighbour actions</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Add actions that show you care about the property and community.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Some actions may need proof or landlord confirmation before they count
          toward your renter profile.
        </p>

        <ul className="mt-4 divide-y divide-slate-100">
          {ACTIONS.map((action) => (
            <li
              key={action}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="text-slate-600">{action}</span>
              <span className="rounded-full border border-dashed border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-400">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
