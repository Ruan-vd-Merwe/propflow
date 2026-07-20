import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { setAuthReturnPath, consumeAuthReturnPath } from "@/lib/listings/return-path";

// vitest runs in the "node" environment (vitest.config.ts) and this repo has
// no jsdom/happy-dom dependency installed, so `window` does not exist by
// default. Stub the minimal sessionStorage surface these two functions use
// rather than add a new browser-environment dependency for one test file.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const originalWindow = (globalThis as { window?: unknown }).window;

beforeEach(() => {
  (globalThis as { window?: unknown }).window = {
    sessionStorage: new MemoryStorage(),
  };
});

afterAll(() => {
  (globalThis as { window?: unknown }).window = originalWindow;
});

describe("auth return path (sessionStorage)", () => {
  it("round-trips a stored path", () => {
    setAuthReturnPath("/listings/abc-123/apply");
    expect(consumeAuthReturnPath()).toBe("/listings/abc-123/apply");
  });

  it("clears the path after reading it once", () => {
    setAuthReturnPath("/listings/abc-123/apply");
    consumeAuthReturnPath();
    expect(consumeAuthReturnPath()).toBeNull();
  });

  it("returns null when nothing was ever set", () => {
    expect(consumeAuthReturnPath()).toBeNull();
  });

  it("refuses to store a protocol-relative path (open redirect guard)", () => {
    setAuthReturnPath("//evil.example.com/phish");
    expect(consumeAuthReturnPath()).toBeNull();
  });

  it("refuses to store an absolute external URL", () => {
    setAuthReturnPath("https://evil.example.com/phish");
    expect(consumeAuthReturnPath()).toBeNull();
  });

  it("refuses a path that does not start with a slash", () => {
    setAuthReturnPath("listings/abc-123/apply");
    expect(consumeAuthReturnPath()).toBeNull();
  });
});
