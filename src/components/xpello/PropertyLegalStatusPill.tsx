import Link from "next/link";

export type PropertyLegalStatus = "incomplete" | "ready" | "protected";

const STATUS_META: Record<
  PropertyLegalStatus,
  { label: string; cls: string; cta: string }
> = {
  incomplete: {
    label: "Legal file incomplete",
    cls: "bg-slate-100 text-slate-600",
    cta: "Prepare legal file",
  },
  ready: {
    label: "Xpello ready",
    cls: "bg-blue-100 text-blue-700",
    cta: "Activate Xpello protection",
  },
  protected: {
    label: "Protected",
    cls: "bg-emerald-100 text-emerald-700",
    cta: "View Xpello protection",
  },
};

/**
 * Property-level Xpello concept entry point. "protected" reflects the real
 * lease_agreements.xpello_enrolled flag when known; "incomplete"/"ready" are
 * demo states for properties not yet enrolled.
 */
export function PropertyLegalStatusPill({
  status,
  propertyId,
  propertyName,
  size = "md",
}: {
  status: PropertyLegalStatus;
  propertyId: string;
  propertyName?: string;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status];
  const href = `/xpello/landlord?property_id=${encodeURIComponent(propertyId)}${
    propertyName ? `&property_name=${encodeURIComponent(propertyName)}` : ""
  }`;

  return (
    <div
      className={`flex items-center gap-2 ${size === "sm" ? "text-xs" : "text-sm"}`}
    >
      <span
        className={`rounded-full px-2.5 py-1 font-medium ${meta.cls} ${
          size === "sm" ? "text-xs" : "text-xs"
        }`}
      >
        {meta.label}
      </span>
      <Link href={href} className="font-medium text-blue-700 hover:underline">
        {meta.cta}
      </Link>
    </div>
  );
}
