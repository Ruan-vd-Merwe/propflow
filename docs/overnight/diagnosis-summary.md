# Diagnosis Summary — Public Listings + TrustScore-Gated Apply

Consolidates `diagnosis-properties.md`, `diagnosis-applications.md`, `diagnosis-trustscore.md`, `diagnosis-auth-routing.md`. Full detail lives in those files; this is the build-facing digest.

## Properties
- Real columns to use: `id, name (title), description, suburb, province, bedrooms, asking_rent, monthly_rent_cents, available_from, photos (text[]), property_tags/area_tags/lifestyle_tags (features), status, is_listed`. No `bathrooms` column exists anywhere — will not fabricate one.
- Price: `coalesce(monthly_rent_cents, asking_rent * 100)` gives cents, matching the existing `migration_match_function.sql` convention.
- Current anon access is a direct table-level policy plus column GRANT allowlist on `properties` (not a view), and it already includes `owner_id`. This directly motivates Decision Rule 1: the new `public_listings` view must be strictly narrower and must not depend on or extend that grant.
- `is_listed`/`status` govern the existing `/browse` marketplace-matching surface. The new `is_published` column is a separate, independent landlord opt-in specifically for the single shareable `/listings/[id]` URL.
- `property-photos` storage bucket is already public with unsigned URLs. Decision Rule 4's premise (authenticated bucket) does not hold here, so plain public URLs are used, no signing needed.
- Publish toggle belongs on `/properties/[id]/edit` (`EditPropertyForm.tsx`) — the only landlord surface that currently edits listing-facing fields, and currently has no status control at all.

## Applications
- Reuse `tenant_applications` (not a new table): already property-scoped, has a working anon-insert RLS policy (`tenant_applications_insert_anon`, requires `status='pending'`, `property_id` set, `landlord_notes` null), a working `user_id` authorship column, and a complete, nav-linked landlord review UI at `/applications` and `/applications/[id]`.
- No `message` column exists yet — add it in the migration for the apply flow's optional note.
- No duplicate-application constraint exists yet — add one (property_id + user_id) so a signed-in tenant cannot double-apply.
- `POST /api/applications` always writes through the anon client regardless of caller session; the new apply-flow endpoint should require a session explicitly (matching the flatmate apply route's pattern) since duplicate-detection and TrustScore attachment both need a real `user_id`, not best-effort attribution.

## TrustScore
- TrustScore is `tenant_profiles.verification_status`, a 4-value enum (`unverified/pending/verified/rejected`). There is no numeric score field anywhere live. `src/lib/rental-reliability.ts` is unwired demo/mock code and must not be mistaken for a real signal.
- Honest-empty-state pattern to reuse: `.maybeSingle()` + `?? "unverified"`, collapsing "no profile row" and "explicit unverified" into one state, matching the flatmate apply flow (`src/app/api/flatmate/[token]/apply/route.ts`).
- Minimal landlord-safe accessor should return only `{ tenant_id, display_name, verification_status }`, narrower than the existing `get_tenant_public_profile()` RPC (which also returns employment_status and affordability range, too much for this surface).
- Gate decision (open question both diagnoses flagged): the flatmate flow only blocks `"unverified"`, treating pending/verified/rejected identically. This build's decision: block `"unverified"` only, same as the existing precedent — consistent behavior across the app, and "rejected" tenants still deserve the ability to apply and let the landlord decide with the status visible.

## Auth/routing
- `middleware.ts` and `auth/callback/route.ts` are unmodified except for two additive, non-logic-changing edits: adding `/listings` to the `isPublic` allowlist in `middleware.ts`, and nothing else in either file.
- `auth/callback/route.ts` already supports a safe `next` param end to end, but `/login` and `/register` don't read any redirect param today.
- The reusable pattern: a small generic sessionStorage return-path helper (same shape as `src/lib/flatmate/return-continuation.ts` but storing a full path, not a listing-specific token), consumed by `/login` and `/register` on success. Zero changes to the two off-limits files' core logic.

## Net build plan
1. Migration file (never executed): `is_published` on `properties`, `public_listings` view (no `owner_id`, no financial columns, no bathrooms), anon SELECT policy on the view only, `message` + duplicate-unique-constraint on `tenant_applications`.
2. Publish toggle in `EditPropertyForm.tsx` / `properties/[id]/edit`.
3. `/listings/[id]` server component, feature-gated on the view existing, design tokens paper/marine/rust/sage, OG meta, 404 for unpublished/missing, no landlord contact info.
4. Apply flow: generic return-path helper, consent copy, minimal apply step, duplicate blocked, honest no-score state.
5. Landlord review: extend existing `/applications` and `/applications/[id]` to show the message field and confirm TrustScore/name-only accessor usage, not a new screen.
