import type { ObligationStatus } from "@/lib/types";

export function ObligationStatusBadge({ status }: { status: ObligationStatus }) {
  const map: Record<ObligationStatus, { label: string; className: string }> = {
    paid: {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    partial: {
      label: "Partial",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    late: {
      label: "Late",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    waived: {
      label: "Waived",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
    pending: {
      label: "Pending",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
    processing: {
      label: "Processing",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
  };

  const { label, className } = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
