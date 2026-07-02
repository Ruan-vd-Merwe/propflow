import Link from "next/link";

export function LandlordStrip() {
  return (
    <section id="landlord" className="border-y border-[#E7E6E2] bg-white px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#111B29] md:text-3xl">
            Own a place?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 md:text-base">
            The tools you usually pay an agent for: screening, lease, and
            rent tracking. No commission. Applications arrive complete, with
            documents attached.
          </p>
        </div>
        <Link
          href="/register?role=owner"
          className="shrink-0 rounded-full bg-[#111B29] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#1c2b3f] active:scale-95"
        >
          List my property
        </Link>
      </div>
    </section>
  );
}
