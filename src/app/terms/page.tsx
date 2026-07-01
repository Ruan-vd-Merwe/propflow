import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Terms of Service — PropTrust" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            Legal
          </p>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[#0f172a]">
            Terms of Service
          </h1>
          <p className="mb-8 text-base leading-relaxed text-slate-500">
            Our full terms of service are being finalised and will be published
            here before public launch.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-7 text-sm leading-relaxed text-slate-600">
            <p className="mb-4 font-semibold text-slate-800">
              Core principles that govern your use of PropTrust:
            </p>
            <ul className="space-y-3">
              <li>
                PropTrust is a platform that connects tenants and landlords
                directly. We are not a letting agent and do not act on behalf of
                either party.
              </li>
              <li>
                You are responsible for the accuracy of the information you
                provide, including documents, income declarations, and property
                details.
              </li>
              <li>
                Rental agreements are between tenants and landlords. PropTrust
                facilitates the process but is not a party to any lease.
              </li>
              <li>
                Misuse of the platform — including submitting false documents or
                fraudulent applications — may result in account suspension.
              </li>
            </ul>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Questions?{" "}
            <Link
              href="/contact"
              className="font-semibold text-[#1e40af] underline-offset-2 hover:underline"
            >
              Contact us
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:hello@proptrust.co.za"
              className="font-semibold text-[#1e40af] underline-offset-2 hover:underline"
            >
              hello@proptrust.co.za
            </a>
            .
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
