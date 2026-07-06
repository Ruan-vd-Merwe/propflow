import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { calculateRiskScore } from "@/lib/risk";
import { TenantPageClient } from "./TenantPageClient";
import type { Payment, RentObligation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TenantPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, properties!inner(owner_id, name, id)")
    .eq("id", params.id)
    .single();

  if (!tenant) notFound();

  if ((tenant.properties as { owner_id: string }).owner_id !== user.id)
    notFound();

  const property = tenant.properties as { id: string; name: string; owner_id: string };

  const [paymentsRes, documentsRes, commsRes, obligationsRes] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("due_date", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("communications_log")
      .select("id, type, subject, status, sent_at")
      .eq("tenant_id", tenant.id)
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("rent_obligations")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("due_date", { ascending: false }),
  ]);

  const paymentList: Payment[] = paymentsRes.data ?? [];
  const documents = documentsRes.data ?? [];
  const commsLog = commsRes.data ?? [];
  const obligations: RentObligation[] = obligationsRes.data ?? [];

  // Succeeded payment attempts, to flag which "paid" obligations came through
  // a provider (mock/real) rather than the landlord's manual "Mark paid".
  const obligationIds = obligations.map((o) => o.id);
  const { data: succeededAttemptsRaw } = obligationIds.length
    ? await supabase
        .from("payment_attempts")
        .select("obligation_id, provider, confirmed_at")
        .in("obligation_id", obligationIds)
        .eq("status", "succeeded")
        .order("confirmed_at", { ascending: false })
    : { data: [] };

  const providerByObligation = new Map<string, string>();
  for (const a of succeededAttemptsRaw ?? []) {
    if (!providerByObligation.has(a.obligation_id)) {
      providerByObligation.set(a.obligation_id, a.provider);
    }
  }

  const obligationsWithProvider = obligations.map((o) => ({
    ...o,
    paid_via_provider: providerByObligation.get(o.id) ?? null,
  }));

  const risk = calculateRiskScore(paymentList);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/properties/${property.id}`} className="hover:text-slate-900">
            {property.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">{tenant.full_name}</span>
        </nav>

        <TenantPageClient
          tenant={{
            id: tenant.id,
            full_name: tenant.full_name,
            email: tenant.email,
            phone: tenant.phone ?? null,
            monthly_rent: tenant.monthly_rent,
            lease_start: tenant.lease_start,
            lease_end: tenant.lease_end ?? null,
          }}
          property={{ id: property.id, name: property.name }}
          payments={paymentList}
          risk={risk}
          initialDocuments={documents}
          initialCommsLog={commsLog}
          initialObligations={obligationsWithProvider}
        />
      </main>
    </div>
  );
}
