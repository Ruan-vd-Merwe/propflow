/**
 * Site URL helpers — use these everywhere auth redirect URLs are needed.
 * Works in both server and client contexts.
 */

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL; // backward-compat fallback

  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, "");
  }

  // Server-side only: Vercel auto-populates VERCEL_URL on preview deployments
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  // Client-side fallback — always correct for the current environment
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

/** Full URL for the auth callback, with an optional next path. */
export function getAuthCallbackUrl(next = "/dashboard"): string {
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Full URL for the password-reset landing page. */
export function getResetPasswordUrl(): string {
  return `${getSiteUrl()}/reset-password`;
}
