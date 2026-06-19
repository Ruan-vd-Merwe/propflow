/**
 * Backfill confirmation codes for users who signed up but never confirmed.
 *
 * Usage:
 *   npx tsx scripts/backfill-confirmations.ts              # dry-run (default)
 *   npx tsx scripts/backfill-confirmations.ts --send       # actually send
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Load .env.local without requiring the dotenv package
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error(`Could not read ${envPath}. Run from the repo root.`);
  process.exit(1);
}
import { Resend } from "resend";
import { randomInt } from "node:crypto";
import { confirmationCodeEmail } from "../src/lib/email-templates";

const RATE_LIMIT_MS = 500; // 2 emails/sec — well under Resend's limits
const TEST_PATTERNS = [
  "test@",
  "test+",
  "@example.com",
  "@test.com",
  "seed",
  "propflow.co.za",
  "proptrust.co.za",
];

const dryRun = !process.argv.includes("--send");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Fetch all auth users who have NOT confirmed their email
  const { data: authData, error: authErr } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (authErr) {
    console.error("Failed to list users:", authErr);
    process.exit(1);
  }

  const unconfirmed = authData.users.filter(
    (u) => !u.email_confirmed_at && u.email,
  );

  console.log(`\nFound ${unconfirmed.length} unconfirmed users total.\n`);

  const targets: { id: string; email: string }[] = [];
  const skipped: { email: string; reason: string }[] = [];

  for (const u of unconfirmed) {
    const email = u.email!.toLowerCase();
    const isTest = TEST_PATTERNS.some((p) => email.includes(p));
    if (isTest) {
      skipped.push({ email, reason: "test/seed account" });
    } else {
      targets.push({ id: u.id, email });
    }
  }

  console.log("--- TARGETS (will receive confirmation code) ---");
  for (const t of targets) {
    console.log(`  ${t.email}  (${t.id})`);
  }
  console.log(`\nTotal: ${targets.length}\n`);

  if (skipped.length > 0) {
    console.log("--- SKIPPED ---");
    for (const s of skipped) {
      console.log(`  ${s.email}  — ${s.reason}`);
    }
    console.log(`\nTotal skipped: ${skipped.length}\n`);
  }

  if (dryRun) {
    console.log("DRY RUN — no emails sent. Pass --send to send for real.");
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("RESEND_API_KEY not set. Cannot send.");
    process.exit(1);
  }

  const resend = new Resend(resendKey);
  const fromAddress =
    process.env.RESEND_FROM_EMAIL ?? "PropTrust <noreply@proptrust.co.za>";

  let sent = 0;
  let failed = 0;

  for (const t of targets) {
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Clear old rows
    await supabase
      .from("email_confirmations")
      .delete()
      .eq("email", t.email)
      .eq("confirmed", false);

    // Insert new row
    const { data: row, error: insertErr } = await supabase
      .from("email_confirmations")
      .insert({
        email: t.email,
        user_id: t.id,
        token: code,
        confirmed: false,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error(`  FAIL insert for ${t.email}:`, insertErr.message);
      failed++;
      continue;
    }

    const { subject, html } = confirmationCodeEmail(code);

    try {
      const { error: sendErr } = await resend.emails.send({
        from: fromAddress,
        to: [t.email],
        subject,
        html,
      });

      if (sendErr) {
        console.error(`  FAIL send to ${t.email}:`, sendErr);
        await supabase.from("email_confirmations").delete().eq("id", row!.id);
        failed++;
      } else {
        console.log(`  OK  ${t.email}`);
        sent++;
      }
    } catch (err) {
      console.error(`  FAIL send to ${t.email}:`, err);
      await supabase.from("email_confirmations").delete().eq("id", row!.id);
      failed++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
