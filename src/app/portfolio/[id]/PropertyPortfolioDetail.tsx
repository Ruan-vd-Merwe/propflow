"use client";

import { useState } from "react";
import type {
  PropertyWithFinance,
  Tenant,
  Payment,
  PropertyExpense,
  BankTransactionRecord,
} from "@/lib/types";

type Tab = "overview" | "income" | "expenses" | "transactions";

function fmtRand(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function pctYield(annualCents: number, valueCents: number | null): string {
  if (!valueCents || valueCents <= 0) return "—";
  return ((annualCents / valueCents) * 100).toFixed(1) + "%";
}

function monthsRemaining(startDate: string, termYears: number): number {
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + termYears);
  const now = new Date();
  return Math.max(
    0,
    (end.getFullYear() - now.getFullYear()) * 12 +
      (end.getMonth() - now.getMonth()),
  );
}

function bondEndDateStr(startDate: string, termYears: number): string {
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + termYears);
  return end.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<Payment["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700",
  late: "bg-amber-100 text-amber-700",
  missed: "bg-red-100 text-red-700",
};

const EXPENSE_TYPES = [
  "bond",
  "levy",
  "rates",
  "insurance",
  "maintenance",
  "management_fee",
  "water",
  "electricity",
  "other",
] as const;

const TX_CATEGORIES = [
  "rental_income",
  "bond_payment",
  "levy_payment",
  "rates_payment",
  "maintenance",
  "insurance",
  "management_fee",
  "other_income",
  "other_expense",
  "uncategorised",
] as const;

type Props = {
  property: PropertyWithFinance;
  tenants: Tenant[];
  payments: Payment[];
  expenses: PropertyExpense[];
  transactions: BankTransactionRecord[];
};

export function PropertyPortfolioDetail({
  property: p,
  tenants,
  payments,
  expenses: initialExpenses,
  transactions: initialTx,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ── Income tab state ──────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const [incomeYear, setIncomeYear] = useState(currentYear);
  const availableYears = Array.from(
    new Set(payments.map((p) => new Date(p.due_date).getFullYear())),
  ).sort((a, b) => b - a);
  if (!availableYears.includes(currentYear))
    availableYears.unshift(currentYear);

  // ── Expenses tab state ────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseType, setExpenseType] =
    useState<(typeof EXPENSE_TYPES)[number]>("maintenance");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMonth, setExpenseMonth] = useState(
    String(new Date().getMonth() + 1),
  );
  const [expenseYear, setExpenseYear] = useState(String(new Date().getFullYear()));
  const [expenseRef, setExpenseRef] = useState("");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // ── Transactions tab state ─────────────────────────────────────────────────
  const [transactions, setTransactions] = useState(initialTx);
  const [showTxForm, setShowTxForm] = useState(false);
  const [txDate, setTxDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"credit" | "debit">("credit");
  const [txCategory, setTxCategory] =
    useState<(typeof TX_CATEGORIES)[number]>("rental_income");
  const [txRef, setTxRef] = useState("");
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalRentCents = tenants.reduce((s, t) => s + t.monthly_rent, 0);
  const bondCents = p.bond_monthly_payment_cents ?? 0;
  const levyCents = p.levy_monthly_cents ?? 0;
  const ratesCents = p.rates_monthly_cents ?? 0;
  const insuranceCents = p.insurance_monthly_cents ?? 0;
  const mgmtFeeCents = Math.round(
    (totalRentCents * (p.management_fee_pct ? Number(p.management_fee_pct) : 0)) /
      100,
  );
  const totalExpenses =
    bondCents + levyCents + ratesCents + insuranceCents + mgmtFeeCents;
  const netCashFlow = totalRentCents - totalExpenses;
  const annualRent = totalRentCents * 12;
  const annualNet = netCashFlow * 12;
  const capitalGain =
    p.current_value_cents != null && p.purchase_price_cents != null
      ? p.current_value_cents - p.purchase_price_cents
      : null;

  // Filtered payments for income tab
  const filteredPayments = payments.filter(
    (pmt) => new Date(pmt.due_date).getFullYear() === incomeYear,
  );
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));
  const incomeTotal = filteredPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  // Last 3 months payments (for overview)
  const recentCutoff = new Date();
  recentCutoff.setMonth(recentCutoff.getMonth() - 3);
  const recentPayments = payments
    .filter((p) => new Date(p.due_date) >= recentCutoff)
    .slice(0, 10);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseSaving(true);
    setExpenseError(null);

    try {
      const amountCents = Math.round(parseFloat(expenseAmount) * 100);
      if (isNaN(amountCents) || amountCents <= 0) throw new Error("Invalid amount");

      const res = await fetch("/api/portfolio/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: p.id,
          expense_type: expenseType,
          description: expenseDesc || null,
          amount_cents: amountCents,
          is_recurring: false,
          frequency: "once",
          period_month: parseInt(expenseMonth),
          period_year: parseInt(expenseYear),
          reference: expenseRef || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      const data = (await res.json()) as { expense: PropertyExpense };
      setExpenses((prev) => [data.expense, ...prev]);
      setShowExpenseForm(false);
      setExpenseDesc("");
      setExpenseAmount("");
      setExpenseRef("");
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setExpenseSaving(false);
    }
  }

  async function handleMarkPaid(expenseId: string) {
    try {
      const res = await fetch("/api/portfolio/mark-expense-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_id: expenseId,
          paid_at: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) return;
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                status: "paid" as const,
                paid_at: new Date().toISOString().split("T")[0],
              }
            : e,
        ),
      );
    } catch {
      // silent
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setTxSaving(true);
    setTxError(null);

    try {
      const amountCents = Math.round(parseFloat(txAmount) * 100);
      if (isNaN(amountCents) || amountCents <= 0) throw new Error("Invalid amount");

      const res = await fetch("/api/portfolio/add-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: p.id,
          transaction_date: txDate,
          description: txDesc,
          amount_cents: txType === "debit" ? -amountCents : amountCents,
          transaction_type: txType,
          category: txCategory,
          bank_reference: txRef || null,
          source: "manual",
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      const data = (await res.json()) as { transaction: BankTransactionRecord };
      setTransactions((prev) => [data.transaction, ...prev]);
      setShowTxForm(false);
      setTxDesc("");
      setTxAmount("");
      setTxRef("");
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setTxSaving(false);
    }
  }

  async function handleStatementUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("property_id", p.id);

      const res = await fetch("/api/finance/parse-statement", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as {
        error?: string;
        inserted?: number;
        transactions?: BankTransactionRecord[];
      };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      if (data.transactions) {
        setTransactions((prev) => [...(data.transactions ?? []), ...prev]);
      }

      setUploadSummary(
        `Imported ${data.inserted ?? 0} transaction${(data.inserted ?? 0) !== 1 ? "s" : ""} from statement.`,
      );
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // ── Tab button helper ─────────────────────────────────────────────────────
  function TabBtn({ id, label }: { id: Tab; label: string }) {
    return (
      <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          activeTab === id
            ? "bg-white shadow-sm text-slate-900"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
        <TabBtn id="overview" label="Overview" />
        <TabBtn id="income" label="Income" />
        <TabBtn id="expenses" label="Expenses" />
        <TabBtn id="transactions" label="Transactions" />
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Financial snapshot */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Monthly Cash Flow
            </h2>
            <div className="space-y-2 text-sm">
              <CashFlowLine label="Rent" value={fmtRand(totalRentCents)} />
              {bondCents > 0 && (
                <CashFlowLine label="Bond" value={`– ${fmtRand(bondCents)}`} />
              )}
              {levyCents > 0 && (
                <CashFlowLine label="Levy" value={`– ${fmtRand(levyCents)}`} />
              )}
              {ratesCents > 0 && (
                <CashFlowLine
                  label="Rates"
                  value={`– ${fmtRand(ratesCents)}`}
                />
              )}
              {insuranceCents > 0 && (
                <CashFlowLine
                  label="Insurance"
                  value={`– ${fmtRand(insuranceCents)}`}
                />
              )}
              {mgmtFeeCents > 0 && (
                <CashFlowLine
                  label="Management fee"
                  value={`– ${fmtRand(mgmtFeeCents)}`}
                />
              )}
              <div className="border-t border-slate-200 pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-700">Net</span>
                  <span
                    className={
                      netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    {fmtRand(netCashFlow)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Property metrics */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Property Metrics
            </h2>
            <div className="space-y-2 text-sm">
              <MetricLine
                label="Purchase price"
                value={fmtRand(p.purchase_price_cents)}
              />
              <MetricLine
                label="Current value"
                value={fmtRand(p.current_value_cents)}
              />
              <MetricLine
                label="Capital gain"
                value={capitalGain != null ? fmtRand(capitalGain) : "—"}
              />
              <MetricLine
                label="Gross yield"
                value={pctYield(annualRent, p.current_value_cents)}
              />
              <MetricLine
                label="Net yield"
                value={pctYield(annualNet, p.current_value_cents)}
              />
            </div>
          </div>

          {/* Bond details */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Bond
            </h2>
            {!p.bond_bank && !p.bond_monthly_payment_cents ? (
              <p className="text-sm text-slate-400">No bond on this property.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <MetricLine label="Bank" value={p.bond_bank ?? "—"} />
                <MetricLine
                  label="Monthly payment"
                  value={fmtRand(p.bond_monthly_payment_cents)}
                />
                <MetricLine
                  label="Interest rate"
                  value={
                    p.bond_interest_rate_pct != null
                      ? `${Number(p.bond_interest_rate_pct).toFixed(2)}%`
                      : "—"
                  }
                />
                <MetricLine
                  label="Start date"
                  value={
                    p.bond_start_date
                      ? new Date(p.bond_start_date).toLocaleDateString(
                          "en-ZA",
                          { month: "short", year: "numeric" },
                        )
                      : "—"
                  }
                />
                <MetricLine
                  label="Term"
                  value={
                    p.bond_term_years ? `${p.bond_term_years} years` : "—"
                  }
                />
                {p.bond_start_date && p.bond_term_years && (
                  <>
                    <MetricLine
                      label="End date"
                      value={bondEndDateStr(p.bond_start_date, p.bond_term_years)}
                    />
                    <MetricLine
                      label="Months remaining"
                      value={String(
                        monthsRemaining(p.bond_start_date, p.bond_term_years),
                      )}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Recent Payments
              </h2>
            </div>
            {recentPayments.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">
                No payments in the last 3 months.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.map((pmt) => {
                  const tenant = tenantMap.get(pmt.tenant_id);
                  return (
                    <div
                      key={pmt.id}
                      className="flex items-center justify-between px-5 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {tenant?.full_name ?? "Unknown tenant"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Due {fmtDate(pmt.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-900">
                          {fmtRand(pmt.amount)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[pmt.status]}`}
                        >
                          {pmt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Income ───────────────────────────────────────────────────────── */}
      {activeTab === "income" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Rental Income
            </h2>
            <select
              value={incomeYear}
              onChange={(e) => setIncomeYear(parseInt(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="card overflow-hidden">
            {filteredPayments.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                No payments recorded for {incomeYear}.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 text-left">Month</th>
                    <th className="px-4 py-3 text-left">Tenant</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((pmt) => {
                    const tenant = tenantMap.get(pmt.tenant_id);
                    return (
                      <tr key={pmt.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-600">
                          {new Date(pmt.due_date).toLocaleDateString("en-ZA", {
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {tenant?.full_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          {fmtRand(pmt.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[pmt.status]}`}
                          >
                            {pmt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {pmt.paid_date ? fmtDate(pmt.paid_date) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <td className="px-5 py-3 text-slate-900" colSpan={2}>
                      Total paid
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {fmtRand(incomeTotal)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Expenses ─────────────────────────────────────────────────────── */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          {/* Recurring expenses from property columns */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Recurring Monthly Expenses
            </h2>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Monthly</th>
                    <th className="px-4 py-3 text-right">Annual</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: "Bond payment", amount: p.bond_monthly_payment_cents },
                    { label: "Body corp levy", amount: p.levy_monthly_cents },
                    { label: "Municipal rates", amount: p.rates_monthly_cents },
                    { label: "Building insurance", amount: p.insurance_monthly_cents },
                    ...(mgmtFeeCents > 0
                      ? [{ label: "Management fee", amount: mgmtFeeCents }]
                      : []),
                  ].map(({ label, amount }) => (
                    <tr key={label} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {label}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {fmtRand(amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {amount != null ? fmtRand(amount * 12) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/portfolio/${p.id}/setup`}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <td className="px-5 py-3 text-slate-900">Total</td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {fmtRand(totalExpenses)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {fmtRand(totalExpenses * 12)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Logged expenses */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Logged Expenses
              </h2>
              <button
                type="button"
                onClick={() => setShowExpenseForm((v) => !v)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {showExpenseForm ? "Cancel" : "Add expense"}
              </button>
            </div>

            {/* Inline add expense form */}
            {showExpenseForm && (
              <form
                onSubmit={handleAddExpense}
                className="card mb-4 p-5"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Type
                    </label>
                    <select
                      value={expenseType}
                      onChange={(e) =>
                        setExpenseType(
                          e.target.value as (typeof EXPENSE_TYPES)[number],
                        )
                      }
                      className="input-field"
                    >
                      {EXPENSE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Description
                    </label>
                    <input
                      type="text"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="Optional description"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Amount (R)
                    </label>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Month
                    </label>
                    <select
                      value={expenseMonth}
                      onChange={(e) => setExpenseMonth(e.target.value)}
                      className="input-field"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={String(m)}>
                          {new Date(2000, m - 1).toLocaleString("en-ZA", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Year
                    </label>
                    <input
                      type="number"
                      value={expenseYear}
                      onChange={(e) => setExpenseYear(e.target.value)}
                      min="2000"
                      max="2099"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={expenseRef}
                      onChange={(e) => setExpenseRef(e.target.value)}
                      placeholder="Invoice / ref number"
                      className="input-field"
                    />
                  </div>
                </div>
                {expenseError && (
                  <p className="mt-3 text-sm text-red-600">{expenseError}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={expenseSaving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {expenseSaving ? "Saving..." : "Save expense"}
                  </button>
                </div>
              </form>
            )}

            {expenses.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-slate-400">
                  No expenses logged yet. Add maintenance, repairs, or once-off
                  costs.
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Period</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium capitalize text-slate-900">
                          {exp.expense_type.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {exp.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          {fmtRand(exp.amount_cents)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {exp.period_month && exp.period_year
                            ? `${new Date(exp.period_year, exp.period_month - 1).toLocaleString("en-ZA", { month: "short" })} ${exp.period_year}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              exp.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : exp.status === "overdue"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {exp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {exp.status !== "paid" && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(exp.id)}
                              className="text-xs font-medium text-emerald-600 hover:underline"
                            >
                              Mark paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Transactions ─────────────────────────────────────────────────── */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Bank Transactions
            </h2>
            <div className="flex items-center gap-2">
              <label
                className={`cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${uploading ? "opacity-50" : ""}`}
              >
                {uploading ? "Uploading..." : "Upload statement"}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleStatementUpload}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowTxForm((v) => !v)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {showTxForm ? "Cancel" : "Add transaction"}
              </button>
            </div>
          </div>

          {uploadError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {uploadError}
            </p>
          )}
          {uploadSummary && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {uploadSummary}
            </p>
          )}

          {/* Inline add transaction form */}
          {showTxForm && (
            <form onSubmit={handleAddTransaction} className="card p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Date
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Description
                  </label>
                  <input
                    type="text"
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="Description"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Amount (R)
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Type
                  </label>
                  <select
                    value={txType}
                    onChange={(e) =>
                      setTxType(e.target.value as "credit" | "debit")
                    }
                    className="input-field"
                  >
                    <option value="credit">Credit (income)</option>
                    <option value="debit">Debit (expense)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Category
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) =>
                      setTxCategory(
                        e.target.value as (typeof TX_CATEGORIES)[number],
                      )
                    }
                    className="input-field"
                  >
                    {TX_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="Bank reference"
                    className="input-field"
                  />
                </div>
              </div>
              {txError && (
                <p className="mt-3 text-sm text-red-600">{txError}</p>
              )}
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={txSaving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {txSaving ? "Saving..." : "Save transaction"}
                </button>
              </div>
            </form>
          )}

          {transactions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-slate-400">
                No transactions yet. Upload a bank statement or add manually.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Reconciled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-600">
                        {fmtDate(tx.transaction_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        <span className="block max-w-[220px] truncate">
                          {tx.description}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium tabular-nums ${
                          tx.transaction_type === "credit"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.transaction_type === "credit" ? "+" : "–"}{" "}
                        {fmtRand(Math.abs(tx.amount_cents))}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {tx.category.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        {tx.is_reconciled ? (
                          <span className="text-xs text-emerald-600">Yes</span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function CashFlowLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
