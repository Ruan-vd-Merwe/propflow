import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StepIndicator({ current }: { current: number }) {
  const steps = ["Preferences", "Affordability", "Verification"];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <div
              className={`mx-1.5 h-0.5 w-8 sm:w-12 ${
                i <= current ? "bg-blue-700" : "bg-slate-200"
              }`}
            />
          )}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < current
                  ? "bg-green-600 text-white"
                  : i === current
                    ? "bg-blue-700 text-white"
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {i < current ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`hidden text-[11px] sm:block ${
                i < current
                  ? "text-green-600"
                  : i === current
                    ? "font-semibold text-blue-700"
                    : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const m = user.user_metadata ?? {};
  const isTenant = !!(m.is_tenant ?? m.user_type === "tenant");

  // Non-tenant users (landlords) use the root /onboarding page —
  // render children without the tenant onboarding chrome.
  if (!isTenant) {
    return <>{children}</>;
  }

  const { data: tp } = await supabase
    .from("tenant_profiles")
    .select("preferences_complete, affordability_complete")
    .eq("user_id", user.id)
    .single();

  const prefDone = tp?.preferences_complete ?? false;
  const affDone = tp?.affordability_complete ?? false;

  // Step indicator tracks "which step is the user currently on"
  // based on what they've completed so far
  const currentStep = !prefDone ? 0 : !affDone ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-5">
          <Link href="/tenant/profile" className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md">
            <span className="text-lg font-bold text-slate-900">PropTrust</span>
          </Link>
          <StepIndicator current={currentStep} />
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </div>
  );
}
