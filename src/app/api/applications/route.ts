import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAnonClient } from "@/lib/supabase/anon";
import { validateSAId } from "@/lib/id-validator";
import {
  calcCreditScore,
  calcRatioFlag,
  detectFraudFlags,
} from "@/lib/credit-score";
import type { BankStatementAnalysis, ReferenceCheck } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      property_id,
      full_name,
      email,
      phone,
      id_number,
      monthly_income_cents,
      requested_rent_cents,
      bank_statement_filename,
      bank_statement_url,
      bank_statement_analysis,
    } = body as {
      property_id: string;
      full_name: string;
      email: string;
      phone?: string;
      id_number?: string;
      monthly_income_cents?: number;
      requested_rent_cents?: number;
      bank_statement_filename?: string;
      bank_statement_url?: string;
      bank_statement_analysis?: BankStatementAnalysis;
    };

    // ── Basic validation ────────────────────────────────────────────────────
    if (!property_id || !full_name || !email) {
      return NextResponse.json(
        { error: "property_id, full_name and email are required" },
        { status: 400 },
      );
    }

    const supabase = createAnonClient();

    // ── Check for duplicate ID number in this property's applications ────────
    let duplicateIdFound = false;
    if (id_number) {
      const { data: dupes } = await supabase
        .from("tenant_applications")
        .select("id")
        .eq("id_number", id_number)
        .eq("property_id", property_id)
        .limit(1);
      duplicateIdFound = (dupes?.length ?? 0) > 0;
    }

    // ── ID verification ──────────────────────────────────────────────────────
    const idVerification = id_number
      ? validateSAId(id_number)
      : {
          valid: false,
          checksumValid: false,
          dob: null,
          gender: null,
          citizenType: null,
          ageInYears: null,
          errors: ["No ID number provided"],
        };

    // ── Salary-to-rent ratio ─────────────────────────────────────────────────
    const emptyAnalysis: BankStatementAnalysis = {
      bank: null,
      accountNumber: null,
      avgMonthlyIncome: 0,
      avgMonthlyExpenses: 0,
      avgMonthlyBalance: 0,
      salaryMonths: 0,
      totalMonthsAnalyzed: 0,
      bouncedDos: [],
      gamblingTransactions: [],
      rentalPayments: [],
      largeCashDeposits: [],
      monthlyBreakdowns: [],
      parseWarnings: [],
      rawTextLength: 0,
    };
    const analysis = bank_statement_analysis ?? emptyAnalysis;

    const rent = requested_rent_cents ?? 0;
    const income = monthly_income_cents ?? analysis.avgMonthlyIncome;
    const { flag: ratio_flag, percent: ratio_percent } =
      rent > 0 && income > 0
        ? calcRatioFlag(rent, income)
        : { flag: null, percent: null };

    // ── Fraud flags ──────────────────────────────────────────────────────────
    const fraud_flags = detectFraudFlags({
      idVerification,
      statedAgeInYears: null,
      bankAnalysis: analysis,
      duplicateIdFound,
      bankFilename: bank_statement_filename ?? null,
    });

    // ── Credit score ─────────────────────────────────────────────────────────
    const { score: credit_score, breakdown: credit_score_breakdown } =
      calcCreditScore({
        bankAnalysis: analysis,
        rentCents: rent,
        incomeCents: income,
        idVerification,
        fraudFlags: fraud_flags,
        referenceChecks: [],
      });

    // ── Insert ───────────────────────────────────────────────────────────────
    // Pre-generate id: anon has no SELECT policy so .select().single() would
    // return 0 rows even after a successful insert.
    const applicationId = randomUUID();
    const { error } = await supabase
      .from("tenant_applications")
      .insert({
        id: applicationId,
        property_id,
        full_name,
        email,
        phone: phone ?? null,
        id_number: id_number ?? null,
        monthly_income_cents: monthly_income_cents ?? null,
        requested_rent_cents: requested_rent_cents ?? null,
        id_verification: idVerification,
        bank_statement_filename: bank_statement_filename ?? null,
        bank_statement_url: bank_statement_url ?? null,
        bank_statement_analysis: analysis,
        ratio_flag: ratio_flag ?? null,
        ratio_percent: ratio_percent ?? null,
        fraud_flags,
        reference_checks: [] as ReferenceCheck[],
        credit_score,
        credit_score_breakdown,
        status: "pending",
      });

    if (error) {
      console.error("[applications POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, id: applicationId },
      { status: 201 },
    );
  } catch (err) {
    console.error("[applications POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
