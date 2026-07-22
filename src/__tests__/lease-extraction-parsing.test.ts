import { describe, it, expect } from "vitest";
import {
  stripCodeFences,
  normaliseLeaseFields,
  parseLeaseExtractionResponse,
} from "@/lib/lease/extraction";

describe("stripCodeFences", () => {
  it("returns plain JSON text unchanged", () => {
    expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
  });

  it("strips a ```json fenced block", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips a plain ``` fenced block", () => {
    expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("trims surrounding whitespace", () => {
    expect(stripCodeFences('   {"a":1}   ')).toBe('{"a":1}');
  });
});

describe("normaliseLeaseFields", () => {
  it("fills every field, missing keys become null", () => {
    const result = normaliseLeaseFields({ tenant_name: "Jane Doe" });
    expect(result).toEqual({
      tenant_name: "Jane Doe",
      landlord_name: null,
      property_address: null,
      monthly_rent_cents: null,
      deposit_amount_cents: null,
      lease_start: null,
      lease_end: null,
      payment_due_day: null,
      escalation_pct: null,
      escalation_date: null,
    });
  });

  it("coerces numeric-looking strings on number fields", () => {
    const result = normaliseLeaseFields({ monthly_rent_cents: "1250000" });
    expect(result.monthly_rent_cents).toBe(1250000);
  });

  it("nulls a number field that cannot be coerced rather than throwing", () => {
    const result = normaliseLeaseFields({ payment_due_day: "not a number" });
    expect(result.payment_due_day).toBeNull();
  });

  it("drops unknown keys", () => {
    const result = normaliseLeaseFields({ made_up_field: "x", tenant_name: "Jane" });
    expect(result).not.toHaveProperty("made_up_field");
    expect(result.tenant_name).toBe("Jane");
  });
});

describe("parseLeaseExtractionResponse", () => {
  it("parses a valid response", () => {
    const raw = JSON.stringify({
      tenant_name: "Jane Doe",
      landlord_name: "John Smith",
      property_address: "12 Kloof Street",
      monthly_rent_cents: 1250000,
      deposit_amount_cents: 2500000,
      lease_start: "2026-01-01",
      lease_end: "2026-12-31",
      payment_due_day: 1,
      escalation_pct: 8,
      escalation_date: "2027-01-01",
    });
    const result = parseLeaseExtractionResponse(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.fields.tenant_name).toBe("Jane Doe");
    expect(result.fields.monthly_rent_cents).toBe(1250000);
  });

  it("parses a response wrapped in code fences", () => {
    const raw = '```json\n{"tenant_name": "Jane Doe"}\n```';
    const result = parseLeaseExtractionResponse(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.fields.tenant_name).toBe("Jane Doe");
  });

  it("marks failed rather than throwing on malformed JSON", () => {
    expect(() => parseLeaseExtractionResponse("{not valid json")).not.toThrow();
    const result = parseLeaseExtractionResponse("{not valid json");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure result");
    expect(result.error).toBeTruthy();
  });

  it("marks failed rather than throwing when the response is a JSON array", () => {
    const result = parseLeaseExtractionResponse("[1,2,3]");
    expect(result.ok).toBe(false);
  });

  it("marks failed rather than throwing when the response is a bare string", () => {
    const result = parseLeaseExtractionResponse('"just a string"');
    expect(result.ok).toBe(false);
  });

  it("marks failed for completely empty input", () => {
    const result = parseLeaseExtractionResponse("");
    expect(result.ok).toBe(false);
  });
});
