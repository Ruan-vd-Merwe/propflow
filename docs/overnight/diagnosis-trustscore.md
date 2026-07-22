# Diagnosis: TrustScore (Tenant Verification/Trust Signal)

Scope: read-only investigation of how "TrustScore" works today, in preparation for a TrustScore-gated public application flow reachable from `/listings/[id]`. Confirms and expands on `docs/overnight/diagnosis-applications.md` section 5: there is no numeric TrustScore field in this codebase. "TrustScore" is entirely a product-facing name for `tenant_profiles.verification_status`, a 4-value text enum.

---

## 1. `tenant_profiles` schema and migrations

Table created in `supabase/migration_marketplace.sql:48-65` (base columns: `id`, `user_id` FK to `profiles`, `sa_id_number`, `looking_in_area/province`, `current_area/province`, `budget_min/max`, `move_in_date`, `lease_length_months`, `employment_status`, `monthly_income`, `is_visible`, timestamps).

Extended by three later migrations:
- `supabase/migration_tenant_preferences.sql:5-15` — adds `desired_bedrooms`, `has_car`, `has_pets`, `lifestyle_interests[]`, `property_interests[]`, `area_interests[]`, `must_haves[]`, `dealbreakers[]`, `work_location`, `importance_weights` jsonb.
- `supabase/migration_tenant_onboarding.sql:37-44` — adds `income_band`, `affordability_min_cents`, `affordability_max_cents`, **`verification_status`**, `preferences_complete`, `affordability_complete`, `discoverable`, `furnished_preference`, `occupants`.
- `supabase/migration_services.sql:5` — WhatsApp opt-in column.

`verification_status` enum defined at `supabase/migration_tenant_onboarding.sql:25-30`:
```sql
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
```
Column: `verification_status public.verification_status not null default 'unverified'` (`migration_tenant_onboarding.sql:41`). A native Postgres enum, not a numeric range.

Same migration creates related tables deliberately separated from `tenant_profiles`: `tenant_sensitive` (sa_id_number, owner+service-role RLS only), `tenant_verification_documents` (doc_type/status enums, owner+service-role RLS only), `tenant_consents` (POPIA/NCA consent audit trail).

TypeScript mirror: `src/lib/types.ts:75-76` — `VerificationStatus = "unverified" | "pending" | "verified" | "rejected"`; `TenantProfile` type at `src/lib/types.ts:78-105`.

---

## 2. No tenant-level numeric score — three candidates checked, none qualify

- **`src/lib/credit-score.ts`** — per-*application* only (no user_id/tenant_id reference). Feeds `tenant_applications.credit_score`, used only in landlord application review. Not a tenant-level field.
- **`src/lib/scoring/*`** + **`src/app/how-scoring-works/page.tsx`** — a different concept: an 8-dimension weighted property-match score (how well a listing fits a tenant's stated preferences). Not a trust/verification signal, unrelated to `verification_status`.
- **`src/lib/rental-reliability.ts`** — a genuine numeric 0-100 "Rental Reliability Score" concept, but disconnected prototype code: zero Supabase imports, only callers are `src/app/tenant-verification/page.tsx` (renders hardcoded `mockRentalReliabilityProfiles`) and `src/app/rental-ecosystem/page.tsx`. No real tenant ever feeds into it, no column stores its output. **This is a trap**: it looks like "the" TrustScore number but is unwired demo content.

Conclusion: the only live, database-backed, per-tenant trust signal is `tenant_profiles.verification_status` (text enum).

---

## 3. How `verification_status` is computed/set

Self-declared by the tenant, then admin-reviewed. Never auto-computed from document content.

- `src/app/onboarding/verification/page.tsx:14-18` — fetches `preferences_complete, affordability_complete, verification_status`, redirects to earlier steps if incomplete.
- `src/app/onboarding/verification/VerificationForm.tsx` — tenant optionally enters SA ID (saved to `tenant_sensitive`) and/or uploads documents to the private `tenant-verification` storage bucket, inserting rows into `tenant_verification_documents` with `status: "uploaded"`. If documents were uploaded, the client directly sets `tenant_profiles.verification_status = "pending"` (lines 123-132) via a plain `.update()` call, not a trigger.
- No code path transitions `verification_status` to `"verified"` or `"rejected"` (confirmed via grep, zero write-side matches). That transition is presumably manual (Supabase dashboard/back-office) — no in-app reviewer UI exists today.
- `src/lib/tenant-dashboard/status.ts:119-140` (`getTrustScoreStatus`) is a display derivation only, reads the status, does not set it.

---

## 4. Every display surface for `verification_status`

Four independent badge-label maps exist (not a shared component):

| File:line | Map | unverified | pending | verified | rejected |
|---|---|---|---|---|---|
| `src/app/tenant/(app)/dashboard/page.tsx:25-30` | `VERIFICATION_BADGE` | "Unverified"/slate | "Verification pending"/amber | "TrustScore verified"/blue | "Verification rejected"/red |
| `src/app/tenant/(app)/profile/page.tsx:25-30` | `VERIFICATION_BADGE` | same, duplicated not imported | | | |
| `src/app/tenant/(app)/dashboard/FlatmateListingPanel.tsx:7-12` | `TRUST_LABEL` | "Unverified"/slate | "Pending review"/amber | "TrustScore verified"/blue | "Review rejected"/red |
| `src/lib/tenant-dashboard/status.ts:119-140` | `getTrustScoreStatus()` | "ID still needed"/attention | "ID pending review"/attention | "Verified"/active | "Verification rejected"/attention |

Design note preserved from `status.ts:114-118`: green is reserved for a messaging prop only, never real product surfaces; verified uses blue everywhere above. Consistent with the proptrust-design skill's "no green in PropTrust UI" rule.

The tenant's own dashboard/profile hide the badge entirely for `"unverified"` (absence of badge, not a rendered pill) — landlord-facing `FlatmateListingPanel` always renders a badge including "Unverified".

---

## 5. What PII rides along with `verification_status` in existing queries

No existing accessor returns only `verification_status` + display name for a third party. Concrete examples:

- `src/app/browse/[id]/page.tsx:146-150` — `select("*")` on own `tenant_profiles` row. Safe only because RLS restricts to the caller's own row.
- `src/app/tenant/(app)/dashboard/page.tsx:52-53` and `profile/page.tsx:51-52` — same `select("*")` pattern, plus a separate `profiles` query for name/email/phone.
- `src/app/flatmate/[token]/page.tsx:44-48` and `src/app/api/flatmate/[token]/apply/route.ts:62-66` — `select("verification_status")` only, but reading the caller's own row, not a third party's.
- `src/app/tenant/(app)/dashboard/FlatmateListingPanel.tsx:212-227` — landlord-facing display of trust signal alongside PII: renders full_name/email/phone + `trustBadge(a.trust_status_snapshot)` from `flatmate_applicants` (a narrow apply-time snapshot, not a live join). Reasonable narrow precedent but still exposes email/phone directly.
- **`supabase/migration_landlord_safe_view.sql:17-87`** — `public.get_tenant_public_profile(p_tenant_id, p_listing_rent_cents)`, a `security definer` RPC. Closest existing precedent for a minimal landlord-safe accessor: returns only `tenant_id, display_name, employment_status, affordability_min, affordability_max, verification_status, relative_fit`, gated by an access check (discoverable, OR applied to landlord's property, OR landlord sent intro request). Migration header states what must never be exposed: `income_band, monthly_income, sa_id_number, documents`. Still returns `employment_status` and affordability range though, which is more than "score-equivalent + display name" — the new minimal accessor should be a narrower cousin of this, not identical.

What must stay out of any new minimal accessor: `sa_id_number`, `monthly_income`, `income_band`, `budget_min/max`, `affordability_min/max_cents`, `looking_in_area/province`, `current_area/province`, `move_in_date`, `employment_status`, `work_location`, `has_car`, `has_pets`, `occupants`, `must_haves`/`dealbreakers`, plus `profiles.email`/`profiles.phone`.

---

## 6. `/flatmate/[token]` — the one existing TrustScore-gated apply flow

Server-side status read, identical pattern at two call sites:
- `src/app/flatmate/[token]/page.tsx:37-53` — reads the visitor's own status: `.select("verification_status").eq("user_id", user.id).maybeSingle()`, then `visitorVerificationStatus = tp?.verification_status ?? "unverified"`. If no user, stays `null`.
- `src/app/api/flatmate/[token]/apply/route.ts:51-79` — same shape at submit time: 401 with `{ needs_auth: true }` if no session; `.maybeSingle()` read; 403 with `{ error: "Build your TrustScore before applying", needs_verification: true }` if `"unverified"`. The API route is the real enforcement point, not just the UI.

**Honest-empty-state pattern to reuse**: `.maybeSingle()` (not `.single()`, which 406-errors on zero rows) plus `tp?.verification_status ?? "unverified"` nullish-coalesce. A tenant with zero `tenant_profiles` rows is treated identically to one with an explicit `"unverified"` row. Never distinguish "no profile yet" from "unverified" as a UI state, collapse both into one honest "no rental history yet" branch.

Client UI branching (`src/app/flatmate/[token]/ApplyPanel.tsx:134-172`) on `visitorVerificationStatus`:
- `null` (no session) to "Sign in to apply" with Create-account/Log-in buttons.
- `"unverified"` to "Build your TrustScore to apply" card, `goToTrustScore()` CTA.
- anything else (`pending`/`verified`/`rejected` all pass through identically, **not specially handled**) renders the apply form.

`goToTrustScore()` persists a return token via `setFlatmateReturnToken(token)` (`src/lib/flatmate/return-continuation.ts`), routes to `/onboarding/verification`; `VerificationForm.tsx`'s `goNext()` reads it back to return to the original listing after verification — a session-continuity pattern worth reusing for `/listings/[id]` too.

**Open product question flagged by both diagnosis passes**: the flatmate gate only blocks `"unverified"`, it does not differentiate `"pending"` or `"rejected"` from `"verified"`. Whether the new `/listings/[id]` gate should be stricter (e.g. block `"rejected"`) is a decision this build will make explicitly under the Decision Rules rather than silently copy.
