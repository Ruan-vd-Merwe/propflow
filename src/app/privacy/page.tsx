import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Privacy Policy — PropTrust" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            Legal
          </p>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[#0f172a]">
            Privacy Policy
          </h1>
          <p className="mb-8 text-base leading-relaxed text-slate-500">
            PropTrust is designed with privacy as a core principle. Our full
            privacy policy is being finalised and will be published here before
            public launch.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-7 text-sm leading-relaxed text-slate-600">
            <p className="mb-4 font-semibold text-slate-800">
              In the meantime, here is how we handle your data:
            </p>
            <ul className="space-y-3">
              <li>
                Tenant documents are stored privately and shared only with
                landlords you apply to.
              </li>
              <li>
                We collect only the information needed to facilitate the rental
                process.
              </li>
              <li>
                You can request deletion of your account and data at any time by
                contacting us.
              </li>
              <li>
                PropTrust follows a POPIA-aligned approach to personal
                information.
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
