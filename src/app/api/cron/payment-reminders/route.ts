import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPaymentNotification } from "@/lib/resend";
import {
  sendPaymentReminder,
  sendPaymentDueToday,
  sendPaymentOverdue,
} from "@/lib/whatsapp";
import type { CommunicationType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

/**
 * POST /api/cron/payment-reminders
 *
 * Called daily at 08:00 UTC by Vercel Cron (see vercel.json).
 * For each unpaid payment in the ±14-day window, sends the appropriate
 * escalation email — but only once per (payment × notification type).
 *
 * Trigger schedule:
 *   days_from_due === -3  →  friendly reminder
 *   days_from_due ===  0  →  due today
 *   days_from_due ===  3  →  first warning
 *   days_from_due ===  7  →  formal warning (legal language)
 *   days_from_due === 14  →  final notice (eviction mention)
 */
export async function POST(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch unpaid payments in the window [-3, +14] days from today
  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - 14);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(today.getDate() + 3);

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      `
      id, due_date, amount, status,
      tenants!inner (
        id, full_name, email, phone, access_token, monthly_rent,
        properties!inner ( name, address,
          profiles!inner ( full_name, email, id, phone )
        )
      )
    `,
    )
    .gte("due_date", rangeStart.toISOString().split("T")[0])
    .lte("due_date", rangeEnd.toISOString().split("T")[0])
    .neq("status", "paid");

  if (paymentsError) {
    console.error("[payment-reminders]", paymentsError);
    return NextResponse.json({ error: paymentsError.message }, { status: 500 });
  }

  const results: {
    paymentId: string;
    type: string;
    sent: boolean;
    error?: string;
  }[] = [];

  for (const payment of payments ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenant = payment.tenants as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = tenant.properties as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const landlord = property.profiles as any;

    const dueDate = new Date(payment.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysFromDue = Math.round(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const TYPE_MAP: Record<number, CommunicationType> = {
      [-3]: "payment_before_3d",
      [0]: "payment_due_today",
      [3]: "payment_late_3d",
      [7]: "payment_late_7d",
      [14]: "payment_late_14d",
    };
    const notifType = TYPE_MAP[daysFromDue];
    if (!notifType) continue;

    // Check whether we've already sent this notification for this payment
    const { data: existing } = await supabase
      .from("communications_log")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("type", notifType)
      .contains("metadata", { payment_id: payment.id })
      .limit(1);

    if (existing?.length) continue; // already sent

    // Send email
    const result = await sendPaymentNotification({
      type: notifType,
      toEmail: tenant.email,
      tenantName: tenant.full_name,
      propertyName: property.name,
      propertyAddress: property.address,
      dueDateIso: payment.due_date,
      amountCents: payment.amount,
      daysLate: daysFromDue > 0 ? daysFromDue : undefined,
      landlordName: landlord.full_name,
      landlordEmail: landlord.email,
    });

    // Send WhatsApp (fire-and-forget — failure doesn't block logging)
    if (tenant.phone) {
      const waOpts = {
        phone: tenant.phone,
        // tenants table has no whatsapp_opted_in column (only profiles/
        // tenant_profiles do) — landlord-entered records are treated as
        // opted-in by default; see the WhatsApp founder runbook.
        optedIn: true,
        name: tenant.full_name,
        amount: payment.amount,
        property: property.name,
        dueDate: payment.due_date,
        daysLate: daysFromDue,
      };
      if (notifType === "payment_before_3d") {
        sendPaymentReminder(waOpts).catch(console.error);
      } else if (notifType === "payment_due_today") {
        sendPaymentDueToday(waOpts).catch(console.error);
      } else if (daysFromDue > 0) {
        sendPaymentOverdue(waOpts).catch(console.error);
      }
    }

    // Log to DB
    await supabase.from("communications_log").insert({
      tenant_id: tenant.id,
      type: notifType,
      subject: null,
      to_email: tenant.email,
      resend_id: result.resend_id,
      status: result.success ? "sent" : "failed",
      metadata: {
        payment_id: payment.id,
        due_date: payment.due_date,
        days_from_due: daysFromDue,
      },
    });

    results.push({
      paymentId: payment.id,
      type: notifType,
      sent: result.success,
      error: result.error,
    });
  }

  return NextResponse.json({
    processed: results.length,
    results,
    runAt: new Date().toISOString(),
  });
}
