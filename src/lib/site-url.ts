/**
 * Returns the canonical site URL for use in auth redirect links.
 * Works in both server and client contexts.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL env var (set this in production + local)
 *   2. VERCEL_URL (auto-set by Vercel for preview deployments, server-only)
 *   3. window.location.origin (client-side fallback)
 *   4. http://localhost:3000 (final fallback for SSR without env vars)
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, "");
  }

  // Server-side only: Vercel auto-populates this on preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Client-side fallback — always correct for the current environment
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}
