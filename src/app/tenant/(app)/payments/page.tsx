import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { RentObligation, PaymentAttempt } from "@/lib/types";
import { RentPaymentCard } from "../dashboard/RentPaymentCard";
import { DetailHeader } from "../DetailHeader";

export const dynamic = "force-dynamic";

export default async function TenantPaymentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  let rentToken: string | null = null;
  let nextObligationForCard:
    | (RentObligation & { latest_attempt: PaymentAttempt | null })
    | null = null;

  if (profile?.email) {
    const today = new Date().toISOString().split("T")[0];
    const service = createServiceClient();
    const { data: activeTenant } = await service
      .from("tenants")
      .select("id, portal_token, access_token")
      .eq("email", profile.email)
      .or(`lease_end.is.null,lease_end.gte.${today}`)
      .limit(1)
      .maybeSingle();

    if (activeTenant) {
      rentToken = activeTenant.portal_token ?? activeTenant.access_token;

      const { data: obligationsRaw } = await service
        .from("rent_obligations")
        .select("*")
        .eq("tenant_id", activeTenant.id)
        .order("due_date", { ascending: false });
      const obligations: RentObligation[] = (obligationsRaw ?? []) as RentObligation[];
      const obligationIds = obligations.map((o) => o.id);

      const { data: attemptsRaw } = obligationIds.length
        ? await service
            .from("payment_attempts")
            .select("*")
            .in("obligation_id", obligationIds)
            .order("created_at", { ascending: false })
        : { data: [] };
      const attempts: PaymentAttempt[] = (attemptsRaw ?? []) as PaymentAttempt[];
      const latestAttemptByObligation = new Map<string, PaymentAttempt>();
      for (const a of attempts) {
        if (!latestAttemptByObligation.has(a.obligation_id)) {
          latestAttemptByObligation.set(a.obligation_id, a);
        }
      }

      const payable = obligations.filter((o) => o.status !== "paid" && o.status !== "waived");
      const upcoming = payable
        .filter((o) => o.due_date >= today)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
      const overdue = payable
        .filter((o) => o.due_date < today)
        .sort((a, b) => b.due_date.localeCompare(a.due_date));
      const chosen = upcoming[0] ?? overdue[0] ?? null;

      nextObligationForCard = chosen
        ? { ...chosen, latest_attempt: latestAttemptByObligation.get(chosen.id) ?? null }
        : null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-lg px-4 pb-12 pt-6 sm:px-6 sm:py-8">
        <DetailHeader title="Payments" />
        <p className="mb-6 text-sm text-slate-500">Your rent payment status.</p>

        <RentPaymentCard
          token={rentToken ?? ""}
          initialObligation={nextObligationForCard}
          devMode={process.env.NODE_ENV !== "production"}
        />
      </main>
    </div>
  );
}
