/**
 * Generic "return to X after auth" continuation for any signed-out entry
 * point, starting with the /listings/[id] apply flow. sessionStorage-based,
 * same mechanism as src/lib/flatmate/return-continuation.ts but storing a
 * full internal path rather than a single feature-specific token, since
 * middleware.ts's unauthenticated redirect to /login carries no query
 * string (see docs/overnight/diagnosis-auth-routing.md section 1) and we
 * are not modifying that redirect.
 */

const RETURN_PATH_KEY = "proptrust_auth_return_path";

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function setAuthReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  if (!isSafeInternalPath(path)) return;
  window.sessionStorage.setItem(RETURN_PATH_KEY, path);
}

/** Reads and clears the pending return path, if any. */
export function consumeAuthReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.sessionStorage.getItem(RETURN_PATH_KEY);
  if (path) window.sessionStorage.removeItem(RETURN_PATH_KEY);
  return path && isSafeInternalPath(path) ? path : null;
}
