import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { ApplicationStatusBadge } from "@/components/ApplicationStatusBadge";
import { CreditScoreMeter } from "@/components/CreditScoreMeter";
import { ReferenceCheckPanel } from "./ReferenceCheckPanel";
import { getVerificationStatusForUser } from "@/lib/listings/trustscore-server";
import { trustScoreLabel } from "@/lib/listings/trustscore";
import type {
  TenantApplication,
  BankStatementAnalysis,
  IdVerification,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function formatRand(cents: number | null) {
  if (!cents) return "—";
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Fraud flag descriptions ──────────────────────────────────────────────────
const FRAUD_LABEL: Record<
  string,
  { label: string; severity: "high" | "medium" }
> = {
  DOB_MISMATCH: {
    label: "Date of birth in ID does not match stated age",
    severity: "high",
  },
  DUPLICATE_ID_IN_SYSTEM: {
    label: "This ID number already exists on another application",
    severity: "high",
  },
  FILENAME_BANK_MISMATCH: {
    label: "Bank statement filename suggests a different bank",
    severity: "medium",
  },
  IRREGULAR_INCOME: {
    label: "Income deposits present in fewer than 10 of 12 months",
    severity: "medium",
  },
  LARGE_CASH_DEPOSIT: {
    label: "Large unexplained cash deposit(s) over R20 000 detected",
    severity: "medium",
  },
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from("tenant_applications")
    .select("*, properties!inner(name, address, owner_id)")
    .eq("id", params.id)
    .single();

  if (!app) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = app.properties as any;
  if (property.owner_id !== user.id) notFound();

  const application = app as TenantApplication & {
    properties: { name: string; address: string };
  };

  const idVerif = application.id_verification as IdVerification;
  const bankData = application.bank_statement_analysis as BankStatementAnalysis;
  const fraudFlags = application.fraud_flags ?? [];

  // Minimal accessor: only the verification status, never a full
  // tenant_profiles row. null user_id (anonymous/legacy application) means
  // no linked tenant account, so the honest "no rental history yet" state
  // renders the same as an explicit unverified status.
  const verificationStatus = await getVerificationStatusForUser(
    supabase,
    application.user_id ?? null,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/applications" className="hover:text-slate-900">
            Applications
          </Link>
          <span>/</span>
          <span className="text-slate-900">{application.full_name}</span>
        </nav>

        {/* Header card */}
        <div className="card mb-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                {application.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {application.full_name}
                </h1>
                <p className="text-sm text-slate-500">{application.email}</p>
                {application.phone && (
                  <p className="text-sm text-slate-500">{application.phone}</p>
                )}
                <p className="mt-0.5 text-xs text-slate-400">
                  Applied {formatDate(application.created_at)} · {property.name}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <ApplicationStatusBadge status={application.status} />
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {trustScoreLabel(verificationStatus)}
              </span>
              {application.credit_score != null && (
                <div className="text-right">
                  <p className="text-xs text-slate-400">Credit score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {application.credit_score}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-col layout */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left col (wider) */}
          <div className="space-y-5 lg:col-span-2">
            {/* ── Credit Score ──────────────────────────────────────────────── */}
            {application.credit_score != null && (
              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-slate-900">
                  Combined Credit Score
                </h2>
                <CreditScoreMeter
                  score={application.credit_score}
                  breakdown={application.credit_score_breakdown}
                />
              </div>
            )}

            {/* ── Message from applicant ───────────────────────────────────── */}
            {application.message && (
              <div className="card p-6">
                <h2 className="mb-3 font-semibold text-slate-900">
                  Message from applicant
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {application.message}
                </p>
              </div>
            )}

            {/* ── Fraud Flags ──────────────────────────────────────────────── */}
            {fraudFlags.length > 0 && (
              <div className="card p-6">
                <h2 className="mb-3 font-semibold text-slate-900">
                  ⚠ Fraud Detection Flags
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    {fraudFlags.length} flag{fraudFlags.length > 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="space-y-2">
                  {fraudFlags.map((flag: string) => {
                    const info = FRAUD_LABEL[flag] ?? {
                      label: flag,
                      severity: "medium",
                    };
                    return (
                      <div
                        key={flag}
                        className={`flex items-start gap-3 rounded-lg p-3 ${
                          info.severity === "high" ? "bg-red-50" : "bg-amber-50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 text-sm ${info.severity === "high" ? "text-red-500" : "text-amber-500"}`}
                        >
                          {info.severity === "high" ? "🚨" : "⚠️"}
                        </span>
                        <div>
                          <p
                            className={`text-sm font-medium ${info.severity === "high" ? "text-red-800" : "text-amber-800"}`}
                          >
                            {info.label}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {flag}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Bank Statement Analysis ───────────────────────────────────── */}
            {bankData && (
              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-slate-900">
                  Bank Statement Analysis
                  {bankData.bank && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      {bankData.bank}
                    </span>
                  )}
                </h2>

                {/* Summary grid */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <BankStat
                    label="Avg income/mo"
                    value={formatRand(bankData.avgMonthlyIncome)}
                  />
                  <BankStat
                    label="Avg expenses/mo"
                    value={formatRand(bankData.avgMonthlyExpenses)}
                  />
                  <BankStat
                    label="Avg balance"
                    value={formatRand(bankData.avgMonthlyBalance)}
                  />
                  <BankStat
                    label="Salary months"
                    value={`${bankData.salaryMonths} / ${bankData.totalMonthsAnalyzed}`}
                    alert={
                      bankData.salaryMonths <
                      bankData.totalMonthsAnalyzed * 0.83
                    }
                  />
                </div>

                {/* Bounced DOs */}
                {bankData.bouncedDos?.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-sm font-medium text-red-700">
                      Bounced Debit Orders ({bankData.bouncedDos.length})
                    </p>
                    <div className="space-y-1">
                      {bankData.bouncedDos.map((tx, i) => (
                        <div
                          key={i}
                          className="flex justify-between rounded bg-red-50 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700">
                            {tx.date} · {tx.description}
                          </span>
                          <span className="font-medium text-red-700">
                            {formatRand(Math.abs(tx.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gambling */}
                {bankData.gamblingTransactions?.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-sm font-medium text-amber-700">
                      Gambling Transactions (
                      {bankData.gamblingTransactions.length})
                    </p>
                    <div className="space-y-1">
                      {bankData.gamblingTransactions.map((tx, i) => (
                        <div
                          key={i}
                          className="flex justify-between rounded bg-amber-50 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700">
                            {tx.date} · {tx.description}
                          </span>
                          <span className="font-medium text-amber-700">
                            {formatRand(Math.abs(tx.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previous rental payments */}
                {bankData.rentalPayments?.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Rental Payments to Previous Landlords (
                      {bankData.rentalPayments.length})
                    </p>
                    <div className="space-y-1">
                      {bankData.rentalPayments.map((tx, i) => (
                        <div
                          key={i}
                          className="flex justify-between rounded bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700">
                            {tx.date} · {tx.description}
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatRand(Math.abs(tx.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly breakdown table */}
                {bankData.monthlyBreakdowns?.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Monthly Breakdown
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                            <th className="pb-2 text-left">Month</th>
                            <th className="pb-2 text-right">Income</th>
                            <th className="pb-2 text-right">Expenses</th>
                            <th className="pb-2 text-right">Balance</th>
                            <th className="pb-2 text-center">Salary</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {bankData.monthlyBreakdowns.map((m, i) => (
                            <tr key={i}>
                              <td className="py-1.5 text-slate-700">
                                {m.month}
                              </td>
                              <td className="py-1.5 text-right font-medium text-emerald-700">
                                {formatRand(m.income)}
                              </td>
                              <td className="py-1.5 text-right text-red-600">
                                {formatRand(m.expenses)}
                              </td>
                              <td className="py-1.5 text-right text-slate-700">
                                {formatRand(m.closingBalance)}
                              </td>
                              <td className="py-1.5 text-center">
                                {m.hasSalary ? (
                                  <span className="text-emerald-600">✓</span>
                                ) : (
                                  <span className="text-red-500">✗</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {bankData.parseWarnings?.length > 0 && (
                  <p className="mt-3 text-xs text-amber-600">
                    ⚠ {bankData.parseWarnings[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right col (sidebar) */}
          <div className="space-y-5">
            {/* ── ID Verification ──────────────────────────────────────────── */}
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-900">
                SA ID Verification
              </h2>

              {application.id_number ? (
                <div>
                  <p className="mb-3 font-mono text-sm text-slate-600">
                    {application.id_number}
                  </p>

                  <div
                    className={`mb-3 rounded-lg p-3 text-sm ${
                      idVerif.valid
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {idVerif.valid
                      ? "✓ ID number is valid"
                      : `✗ ${idVerif.errors[0] ?? "Invalid ID"}`}
                  </div>

                  <dl className="space-y-2 text-sm">
                    <IdRow
                      label="Checksum"
                      value={idVerif.checksumValid ? "✓ Pass" : "✗ Fail"}
                      alert={!idVerif.checksumValid}
                    />
                    {idVerif.dob && (
                      <IdRow label="Date of birth" value={idVerif.dob} />
                    )}
                    {idVerif.ageInYears != null && (
                      <IdRow
                        label="Age"
                        value={`${idVerif.ageInYears} years`}
                      />
                    )}
                    {idVerif.gender && (
                      <IdRow label="Gender" value={idVerif.gender} />
                    )}
                    {idVerif.citizenType && (
                      <IdRow
                        label="Citizenship"
                        value={
                          idVerif.citizenType === "citizen"
                            ? "SA Citizen"
                            : "Permanent Resident"
                        }
                      />
                    )}
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No ID number provided</p>
              )}
            </div>

            {/* ── Salary to Rent Ratio ─────────────────────────────────────── */}
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-900">
                Salary-to-Rent Ratio
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly income</span>
                  <span className="font-semibold">
                    {formatRand(application.monthly_income_cents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested rent</span>
                  <span className="font-semibold">
                    {formatRand(application.requested_rent_cents)}
                  </span>
                </div>
                {application.ratio_percent != null && (
                  <>
                    <div className="my-2 border-t border-slate-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Ratio</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {Number(application.ratio_percent).toFixed(1)}%
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            application.ratio_flag === "green"
                              ? "bg-emerald-100 text-emerald-700"
                              : application.ratio_flag === "amber"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {application.ratio_flag?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          application.ratio_flag === "green"
                            ? "bg-emerald-500"
                            : application.ratio_flag === "amber"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Number(application.ratio_percent))}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Guideline: {"<"}25% green · 25–33% amber · {">"}33% red
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ── Actions ──────────────────────────────────────────────────── */}
            <ActionPanel
              applicationId={application.id}
              currentStatus={application.status}
            />
          </div>
        </div>

        {/* ── Reference Check Tracker ──────────────────────────────────────── */}
        <div className="mt-5">
          <ReferenceCheckPanel
            applicationId={application.id}
            initialChecks={application.reference_checks ?? []}
          />
        </div>
      </main>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function BankStat({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${alert ? "bg-amber-50" : "bg-slate-50"}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`font-semibold ${alert ? "text-amber-700" : "text-slate-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

function IdRow({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={`font-medium ${alert ? "text-red-600" : "text-slate-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionPanel({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 font-semibold text-slate-900">Decision</h2>
      <p className="mb-3 text-xs text-slate-400">
        Current:{" "}
        <ApplicationStatusBadge
          status={currentStatus as "pending" | "approved" | "rejected"}
          size="sm"
        />
      </p>
      <StatusForm applicationId={applicationId} currentStatus={currentStatus} />
    </div>
  );
}

// Client-side status form (tiny inline component)
import { StatusForm } from "./ReferenceCheckPanel";
