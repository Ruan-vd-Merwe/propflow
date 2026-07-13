import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendRentReminder } from "@/lib/whatsapp/rent-reminder";
import { mockWhatsAppLog } from "@/lib/whatsapp/mock-provider";

// Minimal fake for the single select().eq().single() query sendRentReminder
// issues — not a real Supabase client, just enough surface to exercise it
// without a live database (mirrors the fake in rent-payment-service.test.ts).
function makeFakeSupabase(row: Record<string, unknown> | null, errorMessage?: string) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  if (!row) return { data: null, error: { message: errorMessage ?? "not found" } };
                  return { data: row, error: null };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

const baseObligation = {
  id: "ob-1",
  amount_due_cents: 1500000,
  due_date: "2026-07-20",
  tenants: {
    full_name: "Sarah Dlamini",
    phone: "0821234567",
    properties: { name: "12 Main Road" },
  },
};

describe("sendRentReminder", () => {
  it("sends the RENT_REMINDER template when the tenant has a phone number", async () => {
    const supabase = makeFakeSupabase(baseObligation);
    const before = mockWhatsAppLog.length;

    const result = await sendRentReminder(supabase, "ob-1");

    expect(result).toMatchObject({ status: "sent" });
    expect(mockWhatsAppLog.length).toBe(before + 1);
    const record = mockWhatsAppLog[mockWhatsAppLog.length - 1];
    expect(record.templateName).toBe("rent_reminder");
    expect(record.to).toBe("27821234567");
    const expectedAmount = `R${(1500000 / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
    expect(record.params).toEqual(["Sarah", expectedAmount, "12 Main Road", "20 Jul 2026"]);
  });

  it("skips with a reason when the tenant has no phone number", async () => {
    const supabase = makeFakeSupabase({
      ...baseObligation,
      tenants: { ...baseObligation.tenants, phone: null },
    });

    const result = await sendRentReminder(supabase, "ob-1");

    expect(result).toEqual({ status: "skipped", reason: "no phone number on record" });
  });

  it("returns an error when the obligation cannot be found", async () => {
    const supabase = makeFakeSupabase(null, "Obligation not found");

    const result = await sendRentReminder(supabase, "missing-id");

    expect(result).toEqual({ status: "error", error: "Obligation not found" });
  });
});
