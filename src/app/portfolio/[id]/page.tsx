import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { PropertyPortfolioDetail } from "./PropertyPortfolioDetail";
import type {
  PropertyWithFinance,
  Tenant,
  Payment,
  PropertyExpense,
  BankTransactionRecord,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortfolioPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!property) notFound();

  const p = property as PropertyWithFinance;

  // Load tenants
  const { data: tenantsRaw } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", p.id)
    .order("full_name");

  const tenants: Tenant[] = (tenantsRaw ?? []) as Tenant[];
  const tenantIds = tenants.map((t) => t.id);

  // Payments for last 24 months
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const { data: paymentsRaw } = tenantIds.length
    ? await supabase
        .from("payments")
        .select("*")
        .in("tenant_id", tenantIds)
        .gte("due_date", cutoffStr)
        .order("due_date", { ascending: false })
    : { data: [] };

  const payments: Payment[] = (paymentsRaw ?? []) as Payment[];

  // Property expenses
  const { data: expensesRaw } = await supabase
    .from("property_expenses")
    .select("*")
    .eq("property_id", p.id)
    .order("created_at", { ascending: false });

  const expenses: PropertyExpense[] = (expensesRaw ?? []) as PropertyExpense[];

  // Bank transactions for this property
  const { data: txRaw } = await supabase
    .from("bank_transactions")
    .select("*")
    .eq("property_id", p.id)
    .order("transaction_date", { ascending: false })
    .limit(200);

  const transactions: BankTransactionRecord[] =
    (txRaw ?? []) as BankTransactionRecord[];

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/portfolio" className="hover:text-slate-900">
            Portfolio
          </Link>
          <span>/</span>
          <span className="text-slate-900">{p.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{p.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{p.address}</p>
          </div>
          <Link
            href={`/portfolio/${p.id}/setup`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Edit financials
          </Link>
        </div>

        <PropertyPortfolioDetail
          property={p}
          tenants={tenants}
          payments={payments}
          expenses={expenses}
          transactions={transactions}
        />
      </main>
    </div>
  );
}
