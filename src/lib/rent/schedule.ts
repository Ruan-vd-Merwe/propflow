import type { RentSchedule } from "@/lib/types";

export type GeneratedObligationInput = {
  schedule_id: string;
  tenant_id: string;
  property_id: string;
  landlord_id: string;
  period_start: string; // YYYY-MM-DD, always the 1st of the month
  due_date: string; // YYYY-MM-DD
  amount_due_cents: number;
};

export type RentObligationContext = {
  tenant_id: string;
  property_id: string;
  landlord_id: string;
};

function daysInMonth(year: number, month: number): number {
  // month is 0-indexed; day 0 of the following month = last day of this one
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function toDateOnly(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function parseDateOnly(s: string): { year: number; month: number; day: number } {
  const [year, month, day] = s.split("-").map(Number);
  return { year, month: month - 1, day };
}

/** Clamps due_day to the last day of the given month (handles Feb 30/31 etc). */
export function computeDueDate(
  year: number,
  month: number,
  dueDay: number,
): string {
  const day = Math.min(dueDay, daysInMonth(year, month));
  return toDateOnly(year, month, day);
}

/** Applies the schedule's escalation, if periodStart has reached escalation_date. */
export function amountForPeriod(
  schedule: Pick<RentSchedule, "amount_cents" | "escalation_date" | "escalation_pct">,
  periodStart: string,
): number {
  if (
    schedule.escalation_date &&
    schedule.escalation_pct != null &&
    periodStart >= schedule.escalation_date
  ) {
    return Math.round(schedule.amount_cents * (1 + schedule.escalation_pct / 100));
  }
  return schedule.amount_cents;
}

/**
 * Generates the next `monthsAhead` rent_obligations rows for an active
 * rent_schedule, starting at the later of the schedule's start_date and
 * anchorDate's month. Stops early if the schedule's end_date is reached.
 */
export function generateRentObligations(
  schedule: RentSchedule,
  context: RentObligationContext,
  monthsAhead: number,
  anchorDate: Date = new Date(),
): GeneratedObligationInput[] {
  const results: GeneratedObligationInput[] = [];

  const scheduleStart = parseDateOnly(schedule.start_date);
  const anchor = {
    year: anchorDate.getUTCFullYear(),
    month: anchorDate.getUTCMonth(),
  };

  let year = scheduleStart.year;
  let month = scheduleStart.month;
  if (anchor.year > year || (anchor.year === year && anchor.month > month)) {
    year = anchor.year;
    month = anchor.month;
  }

  const endBound = schedule.end_date
    ? toDateOnly(
        parseDateOnly(schedule.end_date).year,
        parseDateOnly(schedule.end_date).month,
        parseDateOnly(schedule.end_date).day,
      )
    : null;

  for (let i = 0; i < monthsAhead; i++) {
    const periodStart = toDateOnly(year, month, 1);
    if (endBound && periodStart > endBound) break;

    results.push({
      schedule_id: schedule.id,
      tenant_id: context.tenant_id,
      property_id: context.property_id,
      landlord_id: context.landlord_id,
      period_start: periodStart,
      due_date: computeDueDate(year, month, schedule.due_day),
      amount_due_cents: amountForPeriod(schedule, periodStart),
    });

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return results;
}
