import { describe, it, expect } from "vitest";
import { TEMPLATES } from "@/lib/whatsapp/templates";

describe("WhatsApp template registry", () => {
  it("every template's bodyText contains exactly paramCount distinct {{n}} placeholders", () => {
    for (const [key, def] of Object.entries(TEMPLATES)) {
      const matches = Array.from(def.bodyText.matchAll(/\{\{(\d+)\}\}/g)).map((m) => Number(m[1]));
      const distinct = Array.from(new Set(matches)).sort((a, b) => a - b);
      expect(distinct.length, `${key} placeholder count`).toBe(def.paramCount);
      // Placeholders must be 1..paramCount with no gaps
      const expected = Array.from({ length: def.paramCount }, (_, i) => i + 1);
      expect(distinct, `${key} placeholder sequence`).toEqual(expected);
    }
  });

  it("every metaTemplateName is a unique, lowercase snake_case name", () => {
    const names = Object.values(TEMPLATES).map((d) => d.metaTemplateName);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("has an entry for each documented notification key", () => {
    expect(Object.keys(TEMPLATES).sort()).toEqual(
      [
        "CUSTOM_MESSAGE",
        "INTRODUCTION",
        "LEASE_UPDATE",
        "MAINTENANCE_UPDATE",
        "RENT_DUE_TODAY",
        "RENT_OVERDUE",
        "RENT_REMINDER",
        "SERVICE_BOOKING",
        "TENANT_PAID_NOTIFICATION",
      ].sort(),
    );
  });
});
