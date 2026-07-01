import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function PricingStory() {
  return (
    <section id="pricing-summary" className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <p className="reveal mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            How payment works
          </p>
          <h2 className="reveal mb-6 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            Free for tenants. Free to list.
          </h2>
          <p className="reveal mb-8 text-base leading-relaxed text-slate-500">
            Landlords pay only when PropTrust does something useful: tools
            once-off or monthly, with the full package working out cheaper
            than paying for each one separately.
          </p>
          <Link
            href="/pricing"
            className="reveal inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            See full pricing
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
