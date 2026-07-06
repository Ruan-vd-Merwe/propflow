import Link from "next/link";

/**
 * Landlord dashboard entry point for the Xpello partnership concept demo.
 * Deliberately always visible (not gated behind lease uploads or settings)
 * so it reads as a core PropTrust feature during a partner demo.
 */
export function LegalProtectionCard() {
  return (
    <Link
      href="/xpello/landlord"
      className="card mb-8 flex flex-col gap-4 p-5 transition hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <svg
            className="h-5 w-5 text-blue-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">Legal Protection</p>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Xpello concept
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Protect your rental process with Xpello-powered breach and
            eviction support.
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-800">
        View Xpello protection
      </span>
    </Link>
  );
}
