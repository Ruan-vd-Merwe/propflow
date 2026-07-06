import { describe, it, expect } from "vitest";

// Mirrors NavBar.tsx's isInSection() — the guard that prevents a landlord
// route like "/tenants/browse" from being treated as part of the "/tenant"
// surface just because it shares a string prefix. Regression coverage for
// the "Find Tenants switches me into My Rentals" navigation bug.
function isInSection(pathname: string, section: string): boolean {
  return pathname === section || pathname.startsWith(`${section}/`);
}

describe("isInSection", () => {
  it("matches the section root exactly", () => {
    expect(isInSection("/tenant", "/tenant")).toBe(true);
  });

  it("matches nested routes under the section", () => {
    expect(isInSection("/tenant/dashboard", "/tenant")).toBe(true);
    expect(isInSection("/tenant/browse", "/tenant")).toBe(true);
  });

  it("does not match a sibling route that merely shares a string prefix", () => {
    expect(isInSection("/tenants/browse", "/tenant")).toBe(false);
    expect(isInSection("/tenants/abc-123", "/tenant")).toBe(false);
  });

  it("does not match an unrelated route", () => {
    expect(isInSection("/dashboard", "/tenant")).toBe(false);
  });

  it("applies the same fix to the connector section", () => {
    expect(isInSection("/connector/tasks", "/connector")).toBe(true);
    expect(isInSection("/connectors-directory", "/connector")).toBe(false);
  });
});
