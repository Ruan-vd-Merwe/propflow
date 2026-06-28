type Status = "paid" | "late" | "missed";

export function PaymentStatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string }> = {
    paid: {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    late: {
      label: "Late",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    missed: {
      label: "Missed",
      className: "bg-red-50 text-red-700 border-red-200",
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
