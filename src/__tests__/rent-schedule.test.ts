import { describe, it, expect } from "vitest";
import {
  computeDueDate,
  amountForPeriod,
  generateRentObligations,
} from "@/lib/rent/schedule";
import type { RentSchedule } from "@/lib/types";

const ctx = {
  tenant_id: "tenant-1",
  property_id: "prop-1",
  landlord_id: "landlord-1",
};

function makeSchedule(overrides: Partial<RentSchedule> = {}): RentSchedule {
  return {
    id: "sched-1",
    lease_id: "lease-1",
    amount_cents: 1000000,
    due_day: 1,
    start_date: "2024-01-01",
    end_date: null,
    escalation_date: null,
    escalation_pct: null,
    status: "active",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeDueDate", () => {
  it("uses the due day directly for a long month", () => {
    expect(computeDueDate(2024, 0, 31)).toBe("2024-01-31"); // January
  });

  it("clamps due_day 31 to Feb 29 in a leap year", () => {
    expect(computeDueDate(2024, 1, 31)).toBe("2024-02-29"); // Feb, 0-indexed
  });

  it("clamps due_day 31 to Feb 28 in a non-leap year", () => {
    expect(computeDueDate(2023, 1, 31)).toBe("2023-02-28");
  });

  it("clamps due_day 31 to 30 in April", () => {
    expect(computeDueDate(2024, 3, 31)).toBe("2024-04-30");
  });
});

describe("amountForPeriod", () => {
  it("returns the base amount before escalation_date", () => {
    const schedule = makeSchedule({
      escalation_date: "2024-06-01",
      escalation_pct: 10,
    });
    expect(amountForPeriod(schedule, "2024-05-01")).toBe(1000000);
  });

  it("applies the escalation pct on and after escalation_date", () => {
    const schedule = makeSchedule({
      escalation_date: "2024-06-01",
      escalation_pct: 10,
    });
    expect(amountForPeriod(schedule, "2024-06-01")).toBe(1100000);
  });

  it("returns the base amount when no escalation is configured", () => {
    const schedule = makeSchedule();
    expect(amountForPeriod(schedule, "2030-01-01")).toBe(1000000);
  });

  it("rounds fractional cents from the escalation percentage", () => {
    const schedule = makeSchedule({
      amount_cents: 100001,
      escalation_date: "2024-06-01",
      escalation_pct: 5,
    });
    // 100001 * 1.05 = 105001.05 -> rounds to 105001
    expect(amountForPeriod(schedule, "2024-06-01")).toBe(105001);
  });
});

describe("generateRentObligations", () => {
  it("generates the requested number of consecutive months", () => {
    const schedule = makeSchedule({ start_date: "2024-01-01", due_day: 1 });
    const obligations = generateRentObligations(
      schedule,
      ctx,
      3,
      new Date("2024-01-15T00:00:00.000Z"),
    );
    expect(obligations).toHaveLength(3);
    expect(obligations.map((o) => o.period_start)).toEqual([
      "2024-01-01",
      "2024-02-01",
      "2024-03-01",
    ]);
    expect(obligations.map((o) => o.due_date)).toEqual([
      "2024-01-01",
      "2024-02-01",
      "2024-03-01",
    ]);
  });

  it("rolls due_day 31 over short months across the generated range", () => {
    const schedule = makeSchedule({ start_date: "2024-01-01", due_day: 31 });
    const obligations = generateRentObligations(
      schedule,
      ctx,
      4,
      new Date("2024-01-01T00:00:00.000Z"),
    );
    expect(obligations.map((o) => o.due_date)).toEqual([
      "2024-01-31",
      "2024-02-29", // 2024 is a leap year
      "2024-03-31",
      "2024-04-30",
    ]);
  });

  it("applies escalation_date partway through the generated range", () => {
    const schedule = makeSchedule({
      start_date: "2024-01-01",
      due_day: 1,
      amount_cents: 1000000,
      escalation_date: "2024-03-01",
      escalation_pct: 10,
    });
    const obligations = generateRentObligations(
      schedule,
      ctx,
      4,
      new Date("2024-01-01T00:00:00.000Z"),
    );
    expect(obligations.map((o) => o.amount_due_cents)).toEqual([
      1000000, // Jan - before escalation
      1000000, // Feb - before escalation
      1100000, // Mar - escalation applies
      1100000, // Apr
    ]);
  });

  it("starts generation at the schedule start_date when it is in the future", () => {
    const schedule = makeSchedule({ start_date: "2024-06-01", due_day: 1 });
    const obligations = generateRentObligations(
      schedule,
      ctx,
      2,
      new Date("2024-01-01T00:00:00.000Z"),
    );
    expect(obligations.map((o) => o.period_start)).toEqual([
      "2024-06-01",
      "2024-07-01",
    ]);
  });

  it("starts generation at anchorDate's month when the schedule already started", () => {
    const schedule = makeSchedule({ start_date: "2023-01-01", due_day: 1 });
    const obligations = generateRentObligations(
      schedule,
      ctx,
      2,
      new Date("2024-05-15T00:00:00.000Z"),
    );
    expect(obligations.map((o) => o.period_start)).toEqual([
      "2024-05-01",
      "2024-06-01",
    ]);
  });

  it("stops early when end_date is reached before monthsAhead is exhausted", () => {
    const schedule = makeSchedule({
      start_date: "2024-01-01",
      end_date: "2024-02-15",
      due_day: 1,
    });
    const obligations = generateRentObligations(
      schedule,
      ctx,
      6,
      new Date("2024-01-01T00:00:00.000Z"),
    );
    expect(obligations.map((o) => o.period_start)).toEqual([
      "2024-01-01",
      "2024-02-01",
    ]);
  });

  it("carries context ids and schedule_id onto every obligation", () => {
    const schedule = makeSchedule();
    const obligations = generateRentObligations(
      schedule,
      ctx,
      1,
      new Date("2024-01-01T00:00:00.000Z"),
    );
    expect(obligations[0]).toMatchObject({
      schedule_id: "sched-1",
      tenant_id: "tenant-1",
      property_id: "prop-1",
      landlord_id: "landlord-1",
    });
  });
});
