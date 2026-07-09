import Link from "next/link";

const ESCALATION_STEPS: { label: string; note?: string }[] = [
  { label: "Late payment" },
  { label: "Friendly reminder" },
  { label: "Formal legal notice" },
  { label: "Legal guidance" },
  { label: "Court process", note: "if required" },
];

/**
 * Landlord dashboard entry point for the Xpello partnership concept demo.
 * Deliberately always visible (not gated behind lease uploads or settings)
 * so it reads as a core PropTrust feature during a partner demo. Shows the
 * escalation path inline so legal support reads as part of the everyday
 * rental journey, not a separate bolted-on product.
 */
export function LegalProtectionCard() {
  return (
    <div className="card mb-8 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              Professional legal support throughout your tenancy.
            </p>
          </div>
        </div>
        <Link
          href="/xpello/landlord"
          className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          View legal protection
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {ESCALATION_STEPS.map((step, i) => (
          <div
            key={step.label}
            className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-center"
          >
            <div className="mx-auto mb-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">
              {i + 1}
            </div>
            <p className="text-xs font-medium leading-tight text-slate-700">{step.label}</p>
            {step.note && <p className="text-[10px] text-slate-400">{step.note}</p>}
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        A step goes ahead only if the one before it does not resolve things. Most matters
        are resolved before court.{" "}
        <Link href="/xpello/how-it-works" className="font-medium text-blue-700 hover:underline">
          See how Xpello works
        </Link>
        .
      </p>
    </div>
  );
}
