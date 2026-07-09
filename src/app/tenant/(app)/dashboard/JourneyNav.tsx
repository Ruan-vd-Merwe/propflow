import Link from "next/link";

const PILL_CLASS =
  "flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900";

export function JourneyNav({ hasActiveLease }: { hasActiveLease: boolean }) {
  return (
    <div className="mb-6 inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
      <Link href="/tenant/lease" className={PILL_CLASS}>
        Current rental
      </Link>
      <Link href="/tenant/matches" className={PILL_CLASS}>
        Finding a place
      </Link>
      {hasActiveLease ? (
        <Link href="/tenant/flatmate" className={PILL_CLASS}>
          Replacing a flatmate
        </Link>
      ) : (
        <span className="flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-400">
          Replacing a flatmate
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
            Needs a lease
          </span>
        </span>
      )}
    </div>
  );
}
