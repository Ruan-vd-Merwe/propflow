import type { LeaseExtractedFields } from "@/lib/types";

const FIELD_KEYS: (keyof LeaseExtractedFields)[] = [
  "tenant_name",
  "landlord_name",
  "property_address",
  "monthly_rent_cents",
  "deposit_amount_cents",
  "lease_start",
  "lease_end",
  "payment_due_day",
  "escalation_pct",
  "escalation_date",
];

const NUMBER_FIELDS = new Set<keyof LeaseExtractedFields>([
  "monthly_rent_cents",
  "deposit_amount_cents",
  "payment_due_day",
  "escalation_pct",
]);

/** Strips ```json / ``` code fences a model response sometimes wraps around JSON. */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Normalises a loosely-typed parsed object into the fixed LeaseExtractedFields
 * shape: unknown keys are dropped, missing keys become null, number fields
 * that parsed as something else become null rather than throwing.
 */
export function normaliseLeaseFields(
  parsed: Record<string, unknown>,
): LeaseExtractedFields {
  const result = {} as LeaseExtractedFields;
  for (const key of FIELD_KEYS) {
    const value = parsed[key];
    if (value === undefined || value === null) {
      (result[key] as unknown) = null;
    } else if (NUMBER_FIELDS.has(key)) {
      const num = typeof value === "number" ? value : Number(value);
      (result[key] as unknown) = Number.isFinite(num) ? num : null;
    } else {
      (result[key] as unknown) = typeof value === "string" ? value : String(value);
    }
  }
  return result;
}

export type LeaseExtractionParseResult =
  | { ok: true; fields: LeaseExtractedFields }
  | { ok: false; error: string };

/**
 * Defensively parses the model's raw text response into LeaseExtractedFields.
 * Never throws: a malformed response returns { ok: false }, the caller
 * decides how to log/surface it (the extraction route marks the row failed
 * and logs the raw response, it does not swallow it).
 */
export function parseLeaseExtractionResponse(
  raw: string,
): LeaseExtractionParseResult {
  const stripped = stripCodeFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid JSON in extraction response",
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "Extraction response was not a JSON object" };
  }

  return { ok: true, fields: normaliseLeaseFields(parsed as Record<string, unknown>) };
}
