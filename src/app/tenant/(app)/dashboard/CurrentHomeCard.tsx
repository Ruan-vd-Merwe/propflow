import Link from "next/link";

type CurrentHomeData = {
  hasActiveLease: boolean;
  leaseStart: string | null;
  leaseEnd: string | null;
  monthlyRentCents: number | null;
  depositAmountCents: number | null;
  noticePeriodDays: number | null;
  petAllowed: boolean | null;
  sublettingAllowed: boolean | null;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

type Row = { label: string; value: string; filled: boolean };

export function CurrentHomeCard(data: CurrentHomeData) {
  const rows: Row[] = [
    {
      label: "Lease or rental agreement",
      value: data.hasActiveLease ? "On file" : "Not added yet",
      filled: data.hasActiveLease,
    },
    {
      label: "Lease start and end date",
      value:
        data.hasActiveLease && data.leaseStart
          ? `${fmtDate(data.leaseStart)} to ${data.leaseEnd ? fmtDate(data.leaseEnd) : "month to month"}`
          : "Not added yet",
      filled: data.hasActiveLease && !!data.leaseStart,
    },
    {
      label: "Monthly rent",
      value:
        data.hasActiveLease && data.monthlyRentCents
          ? fmtRand(data.monthlyRentCents)
          : "Not added yet",
      filled: data.hasActiveLease && !!data.monthlyRentCents,
    },
    {
      label: "Deposit",
      value: data.depositAmountCents ? fmtRand(data.depositAmountCents) : "Not added yet",
      filled: !!data.depositAmountCents,
    },
    {
      label: "Notice period",
      value: data.noticePeriodDays ? `${data.noticePeriodDays} days` : "Not added yet",
      filled: !!data.noticePeriodDays,
    },
    {
      label: "Pets and subletting",
      value:
        data.petAllowed !== null && data.sublettingAllowed !== null
          ? `Pets ${data.petAllowed ? "allowed" : "not allowed"}, subletting ${data.sublettingAllowed ? "allowed" : "not allowed"}`
          : "Not added yet",
      filled: data.petAllowed !== null && data.sublettingAllowed !== null,
    },
    {
      label: "Landlord or agent details",
      value: "Not available yet",
      filled: false,
    },
    {
      label: "Inspection photos",
      value: "Not available yet",
      filled: false,
    },
    {
      label: "Parking and utilities",
      value: "Not available yet",
      filled: false,
    },
  ];

  return (
    <section className="mb-8">
      <div className="card p-5">
        <p className="font-semibold text-slate-900">Current home</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Keep your rental details in one place so your next application is easier.
        </p>

        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="text-slate-600">{row.label}</span>
              <span className={row.filled ? "font-medium text-slate-900" : "text-slate-400"}>
                {row.value}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/tenant/applications"
          className="mt-4 inline-block rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Add rental details
        </Link>
      </div>
    </section>
  );
}
