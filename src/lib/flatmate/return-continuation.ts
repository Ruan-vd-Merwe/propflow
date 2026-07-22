/**
 * Session-based "return to listing" continuation for the Flatmate Finder
 * apply flow. A visitor without a TrustScore is routed into the existing
 * TrustScore verification flow (which may itself route through preferences
 * and affordability first). sessionStorage survives all of those hops
 * within the same tab without requiring every intermediate onboarding step
 * to know about a query param, so this is used instead of query-param
 * threading.
 */

const FLATMATE_RETURN_KEY = "proptrust_flatmate_return_token";

export function setFlatmateReturnToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FLATMATE_RETURN_KEY, token);
}

/** Reads and clears the pending return token, if any. */
export function consumeFlatmateReturnToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(FLATMATE_RETURN_KEY);
  if (token) window.sessionStorage.removeItem(FLATMATE_RETURN_KEY);
  return token;
}
