import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePayoutSettings } from "@/lib/rent/payout-actions";

function makeFakeSupabase(updateResult: { error: { message: string } | null }) {
  const eq = vi.fn().mockResolvedValue(updateResult);
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { client: { from } as unknown as SupabaseClient, from, update, eq };
}

describe("updatePayoutSettings", () => {
  it("writes payout_provider and payout_provider_ref for the landlord's own row", async () => {
    const { client, from, update, eq } = makeFakeSupabase({ error: null });

    const result = await updatePayoutSettings(client, "landlord-1", {
      payoutProvider: "payfast",
      payoutProviderRef: "vendor-123",
    });

    expect(result.error).toBeNull();
    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith({
      payout_provider: "payfast",
      payout_provider_ref: "vendor-123",
    });
    expect(eq).toHaveBeenCalledWith("id", "landlord-1");
  });

  it("surfaces the real database error message, not a generic one", async () => {
    const { client } = makeFakeSupabase({
      error: { message: "duplicate key value violates unique constraint" },
    });

    const result = await updatePayoutSettings(client, "landlord-1", {
      payoutProvider: "payfast",
      payoutProviderRef: "vendor-123",
    });

    expect(result.error).toBe("duplicate key value violates unique constraint");
  });

  it("rejects an empty or whitespace-only reference without touching the database", async () => {
    const { client, from } = makeFakeSupabase({ error: null });

    const result = await updatePayoutSettings(client, "landlord-1", {
      payoutProvider: "payfast",
      payoutProviderRef: "   ",
    });

    expect(result.error).toBe("Payout reference cannot be empty");
    expect(from).not.toHaveBeenCalled();
  });

  it("trims the reference before writing", async () => {
    const { client, update } = makeFakeSupabase({ error: null });

    await updatePayoutSettings(client, "landlord-1", {
      payoutProvider: "payfast",
      payoutProviderRef: "  vendor-123  ",
    });

    expect(update).toHaveBeenCalledWith({
      payout_provider: "payfast",
      payout_provider_ref: "vendor-123",
    });
  });
});
