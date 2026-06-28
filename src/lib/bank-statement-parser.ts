import type {
  BankStatementAnalysis,
  BankTransaction,
  MonthlyBreakdown,
} from "./types";

// ─── Bank detection ───────────────────────────────────────────────────────────

const BANK_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  {
    name: "FNB",
    patterns: [/first national bank/i, /\bfnb\b/i, /rmb private/i],
  },
  { name: "Standard Bank", patterns: [/standard bank/i] },
  { name: "Nedbank", patterns: [/nedbank/i] },
  { name: "ABSA", patterns: [/\babsa\b/i, /absa bank/i] },
  { name: "Capitec", patterns: [/capitec bank/i, /\bcapitec\b/i] },
];

// ─── Transaction classifiers ──────────────────────────────────────────────────

const SALARY_KW: RegExp[] = [
  /\bsalary\b/i,
  /\bsal\s/i,
  /\bpayroll\b/i,
  /\bwages\b/i,
  /\bremuneration\b/i,
  /net pay/i,
  /monthly pay/i,
  /\bpay\s+run\b/i,
  /employer.*pay/i,
  /payslip/i,
  /\bincome deposit\b/i,
];

const BOUNCED_KW: RegExp[] = [
  /return.*debit/i,
  /debit.*return/i,
  /\brd\b.*fee/i,
  /dishonour/i,
  /unpaid.*do\b/i,
  /do.*unpaid/i,
  /failed.*debit/i,
  /unsuccessful.*debit/i,
  /\bdo return\b/i,
  /\bcharge.?back\b/i,
  /returned.*debit.*order/i,
  /debit.*order.*return/i,
  /\bunpaid debit order\b/i,
];

const GAMBLING_KW: RegExp[] = [
  /hollywoodbets/i,
  /\bhollywd\b/i,
  /sportingbet/i,
  /sports.?betting/i,
  /sun international/i,
  /\bsunbet\b/i,
  /\bbetway\b/i,
  /\bbet365\b/i,
  /world sports betting/i,
  /\bwsb bet\b/i,
  /lottostar/i,
  /\bnational lottery\b/i,
  /lucky.?numbers/i,
  /\bsportpesa\b/i,
  /\bdraftking/i,
];

const RENTAL_KW: RegExp[] = [
  /\brent\b/i,
  /\brental\b/i,
  /\blandlord\b/i,
  /\blease\s+pay/i,
  /\btenant\b/i,
  /accommodation.*pay/i,
];

// R20 000 threshold for large cash deposits (in rand — converted to cents later)
const LARGE_CASH_THRESHOLD_RAND = 20_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a formatted rand string like "15,000.00" to cents (integer) */
function randToCents(s: string): number {
  return Math.round(parseFloat(s.replace(/,/g, "")) * 100);
}

/** Classify a transaction description + sign into a type */
function classify(desc: string, cents: number): BankTransaction["type"] {
  if (BOUNCED_KW.some((p) => p.test(desc))) return "bounced_do";
  if (GAMBLING_KW.some((p) => p.test(desc))) return "gambling";
  if (RENTAL_KW.some((p) => p.test(desc))) return "rental";
  if (cents > 0 && SALARY_KW.some((p) => p.test(desc))) return "income";
  return cents > 0 ? "other" : "expense";
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse the raw text extracted from a SA bank statement PDF.
 *
 * Handles five banks: FNB, Standard Bank, Nedbank, ABSA, Capitec.
 * Returns structured analysis — partial data is returned with parseWarnings
 * when extraction is incomplete (e.g. scanned / image-based PDFs).
 */
export function parseBankStatementText(rawText: string): BankStatementAnalysis {
  const warnings: string[] = [];

  // ── Detect bank ──────────────────────────────────────────────────────────────
  let bank: string | null = null;
  for (const { name, patterns } of BANK_PATTERNS) {
    if (patterns.some((p) => p.test(rawText))) {
      bank = name;
      break;
    }
  }
  if (!bank)
    warnings.push("Could not identify the bank from the document text.");

  // ── Account number ───────────────────────────────────────────────────────────
  const accountMatch = rawText.match(
    /account\s*(?:number|no\.?|#)?\s*:?\s*(\d{6,12})/i,
  );
  const accountNumber = accountMatch ? accountMatch[1] : null;

  // ── Extract transactions ─────────────────────────────────────────────────────
  const transactions = extractTransactions(rawText, warnings);

  // ── Group by month ───────────────────────────────────────────────────────────
  const monthlyBreakdowns = groupByMonth(transactions);

  // ── Categorised subsets ──────────────────────────────────────────────────────
  const bouncedDos = transactions.filter((t) => t.type === "bounced_do");
  const gamblingTransactions = transactions.filter(
    (t) => t.type === "gambling",
  );
  // Rental payments going OUT (debit)
  const rentalPayments = transactions.filter(
    (t) => t.type === "rental" && t.amount < 0,
  );
  const largeCashDeposits = transactions.filter(
    (t) =>
      t.amount >= LARGE_CASH_THRESHOLD_RAND * 100 &&
      /cash|atm|deposit/i.test(t.description),
  );

  // ── Aggregates ───────────────────────────────────────────────────────────────
  const n = monthlyBreakdowns.length;

  const avgMonthlyIncome =
    n > 0
      ? Math.round(monthlyBreakdowns.reduce((s, m) => s + m.income, 0) / n)
      : 0;
  const avgMonthlyExpenses =
    n > 0
      ? Math.round(monthlyBreakdowns.reduce((s, m) => s + m.expenses, 0) / n)
      : 0;
  const avgMonthlyBalance =
    n > 0
      ? Math.round(
          monthlyBreakdowns.reduce((s, m) => s + m.closingBalance, 0) / n,
        )
      : 0;

  const salaryMonths = monthlyBreakdowns.filter((m) => m.hasSalary).length;

  return {
    bank,
    accountNumber,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    avgMonthlyBalance,
    salaryMonths,
    totalMonthsAnalyzed: n,
    bouncedDos,
    gamblingTransactions,
    rentalPayments,
    largeCashDeposits,
    monthlyBreakdowns,
    parseWarnings: warnings,
    rawTextLength: rawText.length,
  };
}

// ─── Transaction extraction ───────────────────────────────────────────────────

/**
 * Try multiple regex patterns to pull transaction lines from raw PDF text.
 *
 * Three formats handled:
 *  1. "01 Jan 2024  DESCRIPTION  15,000.00  25,000.00"  (text date, single amount col)
 *  2. "01/01/2024   DESCRIPTION  15,000.00  25,000.00"  (numeric date)
 *  3. Debit/Credit split: two amount columns separated by whitespace
 */
function extractTransactions(
  text: string,
  warnings: string[],
): BankTransaction[] {
  const txns: BankTransaction[] = [];
  const seen = new Set<string>();

  function add(
    date: string,
    desc: string,
    amountStr: string,
    balanceStr: string,
  ) {
    const trimDesc = desc.replace(/\s{2,}/g, " ").trim();
    if (trimDesc.length < 3) return;
    if (
      /^(date|description|balance|amount|debit|credit|details|reference)$/i.test(
        trimDesc,
      )
    )
      return;

    const key = `${date}|${trimDesc}|${amountStr}`;
    if (seen.has(key)) return;
    seen.add(key);

    const cents = randToCents(amountStr);
    const balance = randToCents(balanceStr);
    const type = classify(trimDesc, cents);

    const flags: string[] = [];
    if (type === "bounced_do") flags.push("BOUNCED_DEBIT_ORDER");
    if (type === "gambling") flags.push("GAMBLING");
    if (
      cents >= LARGE_CASH_THRESHOLD_RAND * 100 &&
      /cash|atm|deposit/i.test(trimDesc)
    )
      flags.push("LARGE_CASH_DEPOSIT");

    txns.push({
      date,
      description: trimDesc,
      amount: cents,
      balance,
      type,
      flags,
    });
  }

  // Pattern A: DD Mon YYYY  DESCRIPTION  AMOUNT  BALANCE
  {
    const patA =
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\s{2,}(.+?)\s{2,}([-+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s{1,}([\d,]+(?:\.\d{2})?)/gi;
    let m: RegExpExecArray | null;
    while ((m = patA.exec(text)) !== null) add(m[1], m[2], m[3], m[4]);
  }

  // Pattern B: DD/MM/YYYY  DESCRIPTION  AMOUNT  BALANCE
  {
    const patB =
      /(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\s+(.+?)\s{2,}([-+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s{1,}([\d,]+(?:\.\d{2})?)/gi;
    let m: RegExpExecArray | null;
    while ((m = patB.exec(text)) !== null) add(m[1], m[2], m[3], m[4]);
  }

  // Pattern C: YYYY-MM-DD  DESCRIPTION  AMOUNT  BALANCE  (Capitec / ISO style)
  {
    const patC =
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s{2,}([-+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s{1,}([\d,]+(?:\.\d{2})?)/gi;
    let m: RegExpExecArray | null;
    while ((m = patC.exec(text)) !== null) add(m[1], m[2], m[3], m[4]);
  }

  // Pattern D: debit/credit split columns (FNB / ABSA style)
  {
    const patD =
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+\d{4})?)\s{2,}(.+?)\s{2,}([\d,]+(?:\.\d{2})?)\s{5,}([\d,]+(?:\.\d{2})?)/gi;
    let m: RegExpExecArray | null;
    while ((m = patD.exec(text)) !== null) {
      const key = `${m[1]}|${m[2].trim()}|${m[3]}`;
      if (!seen.has(key)) add(m[1], m[2], m[3], m[4]);
    }
  }

  if (txns.length === 0) {
    warnings.push(
      "No transactions could be extracted. The PDF may be image-based (scanned) " +
        "or use an unsupported layout. Please upload a digital (not printed/scanned) statement.",
    );
  }

  return txns;
}

// ─── Monthly grouping ─────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function dateToMonthKey(dateStr: string): string {
  // ISO  YYYY-MM-DD
  const iso = dateStr.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}`;

  // DD Mon YYYY
  const text = dateStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (text) return `${text[3]}-${MONTH_NAMES[text[2].toLowerCase()] ?? "00"}`;

  // DD Mon (no year) — can't determine year reliably
  const noYear = dateStr.match(/^(\d{1,2})\s+([A-Za-z]{3})$/);
  if (noYear) return `0000-${MONTH_NAMES[noYear[2].toLowerCase()] ?? "00"}`;

  return "unknown";
}

function groupByMonth(txns: BankTransaction[]): MonthlyBreakdown[] {
  const map = new Map<string, BankTransaction[]>();
  for (const tx of txns) {
    const key = dateToMonthKey(tx.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }

  const result: MonthlyBreakdown[] = [];
  map.forEach((list: BankTransaction[], month: string) => {
    if (month === "unknown") return;

    const income = list
      .filter((t: BankTransaction) => t.amount > 0)
      .reduce((s: number, t: BankTransaction) => s + t.amount, 0);
    const expenses = Math.abs(
      list
        .filter((t: BankTransaction) => t.amount < 0)
        .reduce((s: number, t: BankTransaction) => s + t.amount, 0),
    );

    // Use the balance of the last transaction in the month as closing balance
    const closingBalance = list[list.length - 1]?.balance ?? 0;

    result.push({
      month,
      income,
      expenses,
      closingBalance,
      hasSalary: list.some((t: BankTransaction) => t.type === "income"),
      bouncedDoCount: list.filter(
        (t: BankTransaction) => t.type === "bounced_do",
      ).length,
      gamblingCount: list.filter((t: BankTransaction) => t.type === "gambling")
        .length,
    });
  });

  return result.sort((a, b) => a.month.localeCompare(b.month));
}
