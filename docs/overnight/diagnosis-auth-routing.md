# Diagnosis: Auth Sign-In/Sign-Up Redirect Flow

Scope: read-only investigation of how PropTrust currently threads (or doesn't thread) a "return to X after auth" destination through login/register/callback, in preparation for a public `/listings/[id]` to "Apply with your TrustScore" flow. `src/middleware.ts` and `src/app/auth/callback/route.ts` are treated as off-limits for edits beyond, at most, later adding a redirect-return param.

## 1. `src/middleware.ts` — public/protected routes, session refresh, redirect param handling

Session refresh: standard `@supabase/ssr` cookie-relay pattern (`src/middleware.ts:7-26`) — `supabase.auth.getUser()` (`:30`) refreshes/validates the session on every matched request.

Public routes (`isPublic`, `src/middleware.ts:36-65`): `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/confirm-email`, everything under `/auth/` (`:43`, covers `/auth/callback` and `/auth/confirm`), marketing pages, `/browse*`, `/solutions/*`, `/resources/*`, `/apply/*`, `/checkin/*`, `/api/*`, and `/tenant/*` except `/tenant/profile` (`:65`). **`/listings/*` is not yet in this list** — a new public listings route needs to be added here later (a minimal addition, not a change to redirect logic).

Protection: `if (!user && !isPublic) return NextResponse.redirect(new URL("/login", request.url))` (`src/middleware.ts:68-70`).

**No `redirect`/`next`/`returnTo` query param handling exists anywhere in this file.** The unauthenticated redirect at `:69` builds a bare `/login` URL with no query string at all, so the original pathname/search is discarded. This is the one place a future redirect-return param would most naturally be added, but per constraints that edit is out of scope for this pass.

Authenticated redirect-away-from-login logic (`:78-116`) is role-based only (`getPostAuthPath`-style ladder via `user_metadata`), again with no query-param awareness.

Matcher (`src/middleware.ts:122-126`):
```
matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
```
Runs on effectively everything except static assets, so a new public route (`/listings/[id]`) is covered by this matcher automatically and must be explicitly added to `isPublic` to avoid being redirected to `/login`.

## 2. `src/app/auth/callback/route.ts` — OAuth/magic-link callback

This route **already supports a generic `next` query param**, sanitized by `getSafeNext()`:
```ts
// src/app/auth/callback/route.ts:5-9
function getSafeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}
```
Read at `:14` (`requestUrl.searchParams.get("next")`), honored after profile/tenant_profile upsert:
```ts
// src/app/auth/callback/route.ts:94-98
if (safeNext) {
  return NextResponse.redirect(new URL(safeNext, request.url));
}
```
Falls back to `getPostAuthPath(isLandlord, isTenant, isConnector)` (`:100-102`, from `src/lib/auth/roles.ts:13-21`) when no `next` is present. Existing caller: `src/app/forgot-password/page.tsx:19` (`redirectTo: ".../auth/callback?next=/reset-password"`). So the pattern "append `?next=/some/path` and have it survive to the post-auth redirect" is already proven, but only on this OAuth/magic-link/password-reset code path, not on password sign-in (`/login`) or email confirmation (`/auth/confirm`, separate scoped `getSafeNext`, see §4).

## 3. `src/app/login/page.tsx` / `src/app/register/page.tsx` — do they read a redirect param today?

**No.**
- `src/app/login/page.tsx:11,14` — `useSearchParams()` only reads `error`, `reset`, `confirmed`, `from` for banner text (`:81-174`). `handleSubmit` (`:30-48`) always does `router.push(getPostAuthPath(isLandlord, isTenant))` (`:47`), purely role-based, no query param consulted.
- `src/app/register/page.tsx` — no `useSearchParams` usage anywhere; `handleSubmit` (`:161-217`) always ends in the "check your inbox" screen (`:214-216`), never a redirect.

Existing precedent for "return to X after auth" is a separate sessionStorage-token mechanism, not a query param, built for the Flatmate Finder apply flow (see `diagnosis-applications.md` §5, `setFlatmateReturnToken`):
- `src/lib/flatmate/return-continuation.ts:11-24` — sessionStorage-backed, keyed `proptrust_flatmate_return_token`, holding a single flatmate listing token. `setFlatmateReturnToken`/`consumeFlatmateReturnToken` (read-once, self-clearing).
- `src/app/flatmate/[token]/ApplyPanel.tsx:46-54` — `goToTrustScore()` sets the token then `router.push("/onboarding/verification")` (signed-in-but-unverified case); `goToAuth("/register"|"/login")` sets the token then pushes straight to `/register` or `/login` **with no query param appended** (`:51-54`).
- `src/app/onboarding/verification/VerificationForm.tsx:44-47` — `goNext(fallback)` consumes the token and does `router.push(returnToken ? \`/flatmate/${returnToken}\` : fallback)`; called from that page's exit points only.

Grep for `returnTo`/`redirectTo`/`return_to`/`ReturnToken`/`redirect_to` across `src/`: only the flatmate token file/usages above, plus unrelated `emailRedirectTo`/`redirectTo` options passed to Supabase auth calls (`register/page.tsx:183`, `login/page.tsx:59`, `forgot-password/page.tsx:19`). No other token/localStorage-based return mechanism exists.

**Gap in the flatmate mechanism**: `goToAuth()` never reads/consumes the token on `/login` or `/register` themselves — `login/page.tsx`'s `handleSubmit` always does the role-based push, and `register/page.tsx` always shows "check your inbox". The sessionStorage token is only consumed later if the user happens to land on `/onboarding/verification`. For a fully signed-out visitor, the mechanism reliably returns the user only for the already-signed-in-but-unverified branch, not the register branch (email confirmation may open in a different tab, losing sessionStorage).

## 4. `src/app/auth/confirm/route.ts` and `src/app/confirm-email/page.tsx`

Two separate flows:
- **`src/app/auth/confirm/route.ts`** — real Supabase email-confirmation link handler (token_hash/type OTP verify). Own `getSafeNext()` (`:7-12`, defaults to `/login?confirmed=true"` rather than returning null) reading a `next` param (`:29`). Deliberately does not create a browser session (`:50-58`). After `verifyOtp`, upserts profiles via service-role client, redirects to `next` (default `/login?confirmed=true`) — user still must log in afterward. Reached via hardcoded `emailRedirectTo` in `register/page.tsx:183` and `login/page.tsx:59` (both hardcode `next=%2Flogin%3Fconfirmed%3Dtrue` today).
- **`src/app/confirm-email/page.tsx`** — different UI: 6-digit OTP code entry, POSTs to `/api/auth/verify-confirmation`. On success `router.push("/login?reset=confirmed")` (`:45`), no return-path awareness.

Both are confirmation-only flows; after either completes the user is dumped back at `/login` and must authenticate again.

## 5. Which pattern to extend for `/listings/[id]` apply, without touching middleware.ts or callback's core logic

Two existing patterns, neither fully sufficient off the shelf:
1. **Query-param `next`** — proven on `auth/callback/route.ts` and `auth/confirm/route.ts`, not read by `/login`'s password form or `/register`'s signUp success path.
2. **sessionStorage return-token** (flatmate pattern) — works end-to-end only for the already-authenticated-but-unverified branch, not the fully signed-out register/login branch, and is single-purpose (one key, one shape: a flatmate token).

**Safest/most reversible option, given middleware.ts and auth/callback/route.ts are off-limits**: add a small, generically-named sessionStorage return mechanism analogous to `return-continuation.ts` (storing a full path like `/listings/[id]`, generic rather than flatmate-specific), consumed explicitly by `/login` and `/register` on successful sign-in (both files are editable without touching the two off-limits files). This requires zero changes to `middleware.ts` or `auth/callback/route.ts`, and `/listings/*` still needs to be added to `middleware.ts`'s `isPublic` list, which is an additive allowlist entry, not a change to redirect logic.
