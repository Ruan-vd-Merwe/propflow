import Link from "next/link";
import type { DoorStatus } from "@/lib/tenant-dashboard/status";

const DOT_CLASS: Record<DoorStatus["status"], string> = {
  active: "bg-blue-500",
  attention: "bg-amber-500",
  neutral: "bg-slate-300",
};

export function DoorCard({
  href,
  title,
  status,
}: {
  href: string;
  title: string;
  status: DoorStatus;
}) {
  return (
    <Link
      href={href}
      className="card flex min-h-[44px] items-center justify-between gap-4 p-4 transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[status.status]}`}
            aria-hidden="true"
          />
          {status.label}
        </p>
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-slate-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
