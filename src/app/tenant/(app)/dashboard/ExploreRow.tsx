import Link from "next/link";

type ExploreRowProps = {
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
};

export function ExploreRow({ title, description, href, comingSoon }: ExploreRowProps) {
  const content = (
    <div className="flex min-h-[44px] items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      {comingSoon ? (
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
          Coming soon
        </span>
      ) : (
        <svg
          className="h-5 w-5 shrink-0 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (comingSoon || !href) {
    return content;
  }

  return (
    <Link href={href} className="block transition hover:bg-slate-50">
      {content}
    </Link>
  );
}
