import Link from "next/link";

/**
 * Tenant dashboard entry point. Deliberately smaller and visually distinct
 * from the landlord LegalProtectionCard: this is a tenant-side lease review
 * helper, not the landlord's breach/eviction protection flow. Xpello never
 * represents both sides of the same dispute.
 */
export function LeaseReviewCard() {
  return (
    <Link
      href="/xpello/tenant"
      className="card flex items-start gap-4 p-5 transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">Lease Review</p>
        <p className="mt-0.5 text-sm text-slate-500">
          Understand your lease before you sign.
        </p>
        <span className="mt-2 inline-block text-xs font-semibold text-blue-700">
          Review my lease →
        </span>
      </div>
    </Link>
  );
}
