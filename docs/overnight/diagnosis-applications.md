# Diagnosis: Existing Tenant Application System

Scope: read-only investigation of the current PropTrust application (apply-to-rent) system, in preparation for a later phase that adds a TrustScore-gated public apply flow reachable from a public listing page.

---

## 1. App router surfaces under `/tenant/**/applications` and `/applications/**`

Three distinct route families exist, serving three different audiences:

### a) `src/app/apply/[propertyId]/` — public apply form (tenant-facing, anonymous-capable)
- `src/app/apply/[propertyId]/page.tsx` — server component. Uses `createAnonClient()` to fetch `properties(id, name, address)` by `params.propertyId` (no auth check, no `is_listed`/`status` filter — any property id works, `notFound()` if missing). Renders a minimal branded header + `<ApplicationForm propertyId={property.id} />`.
- `src/app/apply/[propertyId]/ApplicationForm.tsx` — client component, 3-step wizard (Personal details → Financials → Review & submit):
  - Step 1: full_name, email, phone, SA ID number (live-validated client-side via `validateSAId`).
  - Step 2: monthly income, requested rent (live rent/income ratio via `calcRatioFlag`), bank statement PDF upload (`POST /api/upload-bank-statement` and `POST /api/parse-bank-statement` in parallel).
  - Step 3: review, then `POST /api/applications` with the full payload; shows a static "Application Submitted!" confirmation, no redirect.
  - Nothing here checks TrustScore/verification_status or requires login — it is a fully anonymous flow today.

### b) `src/app/applications/` and `src/app/applications/[id]/` — landlord review surface (this IS the existing "landlord sees incoming applications" page — see §4)

### c) `src/app/tenant/(app)/applications/page.tsx` — tenant's own "my applications" list
- Requires an authenticated session (`redirect("/login")` if none).
- Queries `tenant_applications` filtered by `user_id = user.id` (only applications submitted while logged in link to the tenant's account — anonymous submissions never get a `user_id`, see §2/§3).
- Also queries `introduction_requests` (a separate landlord→tenant intro concept) and `lease_extractions`.
- Shows a simple status table (`pending`→"Under review", `approved`→"Approved", `rejected`→"Not approved") per property, plus a `LeaseUploadSection`.
- Links to `/tenant/browse` when there are no applications yet (note: `/tenant/(app)/browse` is a different, authenticated-only browse page from the public `/browse` — see §5/§3).

No `src/app/tenant/**/applications/[id]` detail page exists — tenants cannot drill into a single application's detail from their own portal.

---

## 2. `tenant_applications` table schema, constraints, RLS

Defined in `supabase/migration_applications.sql` (107 lines), amended by `supabase/migration_fix_applications_rls.sql`, `supabase/migration_applications_authorship.sql`, and `supabase/migration_photos.sql`. **Not present in `supabase/schema.sql`** (that file only bootstraps `profiles`, `properties`, `tenants`, `payments` — see §5). Table name is `tenant_applications`, not `applications`.

### Columns (`supabase/migration_applications.sql:5-54`)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `property_id` | uuid | FK → `properties`, `on delete cascade`, nullable |
| `full_name` | text not null | |
| `email` | text not null | |
| `phone` | text | |
| `id_number` | text | SA 13-digit ID |
| `monthly_income_cents` | integer | |
| `requested_rent_cents` | integer | |
| `id_verification` | jsonb not null default `{}` | `{valid, checksumValid, dob, gender, citizenType, ageInYears, errors[]}` |
| `bank_statement_filename` | text | |
| `bank_statement_analysis` | jsonb not null default `{}` | full parsed bank statement (income/expenses/balance, bounced DOs, gambling txns, rental payments, large cash deposits, monthly breakdowns, parse warnings) |
| `ratio_flag` | text check in (`green`,`amber`,`red`) | |
| `ratio_percent` | numeric(5,2) | |
| `fraud_flags` | jsonb not null default `[]` | e.g. `DOB_MISMATCH`, `DUPLICATE_ID_IN_SYSTEM`, `FILENAME_BANK_MISMATCH`, `IRREGULAR_INCOME`, `LARGE_CASH_DEPOSIT` |
| `reference_checks` | jsonb not null default `[]` | array of `{id, landlordName, contact, contacted, response, notes, createdAt}` |
| `credit_score` | integer check 0–100 | |
| `credit_score_breakdown` | jsonb not null default `{}` | `{bankHealth, ratio, idVerification, referenceCheck}` sub-scores |
| `status` | text not null default `'pending'`, **check in (`pending`,`approved`,`rejected`)** | this is the status enum/CHECK the later phase will need to respect |
| `landlord_notes` | text | |
| `created_at` / `updated_at` | timestamptz | `updated_at` auto-touched via `touch_updated_at()` trigger |
| `bank_statement_url` | text | added later in `supabase/migration_photos.sql:47-48` |
| `user_id` | uuid, FK → `profiles(id)` on delete set null, nullable | added in `supabase/migration_applications_authorship.sql:7-8`; **NULL for anonymous/legacy submissions** |

Indexes: `tenant_applications_property_id_idx`, `tenant_applications_status_idx`, `tenant_applications_user_id_idx`.

### RLS (final effective state, reading all 3 migrations in order)
RLS is enabled (`migration_applications.sql:78`). Effective policies:
- **Insert (anon)** — `tenant_applications_insert_anon` (`migration_fix_applications_rls.sql:8-15`), replaces an earlier over-permissive `applications_insert_public with check (true)`. Scoped `to anon`, requires `status = 'pending' AND property_id IS NOT NULL AND landlord_notes IS NULL`. No insert policy exists for the `authenticated` role — see the important caveat in §3 about how the API route sidesteps this.
- **Select (landlord)** — `applications_select_own` (`migration_applications.sql:85-91`): landlord may `select` rows where `exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid())`.
- **Update (landlord)** — `applications_update_own` (`migration_applications.sql:94-100`): same ownership predicate, for `update`.
- **Select (own tenant)** — `tenant_applications_select_own` (`migration_applications_authorship.sql:13-15`): `to authenticated`, `user_id = auth.uid()`. NULL `user_id` rows are invisible to everyone under this policy (by design, per the migration's own comment — avoids mis-attribution).
- A companion policy `properties_public_read` (`migration_applications.sql:106-107`, `for select using (true)`) was added on the **`properties`** table so anonymous applicants could see property name/address on the apply form — this predates and is superseded in spirit by the later, more targeted `migration_public_browse.sql` policy (`is_listed = true` gate, see §5) but was not itself dropped; both policies currently coexist on `properties`.

No DELETE policy exists (nobody can delete applications via RLS).

---

## 3. How applications are created today — API routes, auth, validation

### `POST /api/applications` (`src/app/api/applications/route.ts`)
- **Auth: optional.** Detects a session via `createServerClient().auth.getUser()` but does not require one (`authenticatedUid` can be null). Always inserts through `createAnonClient()` (`src/lib/supabase/anon.ts` — a bare `@supabase/supabase-js` client built from the anon key, **does not forward the caller's session/JWT**). Practically this means **every insert hits Postgres as the `anon` role**, even when a logged-in tenant submits — so it is always governed by the `tenant_applications_insert_anon` RLS policy regardless of caller identity; `user_id` is populated at the application layer only (from the detected session) and passed through as a normal column value, not derived from `auth.uid()`.
- **Validation**: only `property_id`, `full_name`, `email` are required (400 if missing). No format validation of email/ID server-side beyond what runs client-side.
- **Server-side enrichment before insert**:
  - Duplicate ID check: same `id_number` + `property_id` combo → `DUPLICATE_ID_IN_SYSTEM` fraud flag.
  - `validateSAId(id_number)` → `id_verification`.
  - `calcRatioFlag(rent, income)` → `ratio_flag`/`ratio_percent` (only if both rent and income > 0).
  - `detectFraudFlags(...)` → `fraud_flags`.
  - `calcCreditScore(...)` → `credit_score` + `credit_score_breakdown` (all from `src/lib/credit-score.ts`).
  - Pre-generates the row `id` client-side (`randomUUID()`) before insert because the anon role has no SELECT policy, so `.select().single()` after insert would return 0 rows.
- Always sets `status: "pending"` — matches the RLS insert-check requirement.
- Returns `{ success, id }` on 201.

### `PATCH /api/applications/[id]` (`src/app/api/applications/[id]/route.ts`)
- **Auth: required** — 401 if no session (`Unauthorized`). Effectively landlord-only in practice via the `applications_update_own`/`applications_select_own` RLS ownership policies (the route itself doesn't explicitly check `owner_id`, it relies on RLS: `existing` fetch and `update` both run through the session-bound `createClient()`, so a non-owner's PATCH would 404 on the initial fetch).
- Accepts partial updates: `status` (validated against `["pending","approved","rejected"]`), `landlord_notes`, `reference_checks` (full-array replace, triggers credit score recalculation via `calcCreditScore`).
- **Side effect on approval**: if `status` transitions to `"approved"`, `createDraftLeaseForApproval()` runs (best-effort, never blocks the response): looks up the property, upserts a `tenants` row (by property_id+email), and if no `lease_agreements` row exists yet for that tenant, inserts a `draft` lease with rent = `requested_rent_cents ?? property.asking_rent` and start = `property.available_from ?? today`. This couples `tenant_applications` to the `tenants`/`lease_agreements` tables specifically on approval.

### Is there already a link from an existing page to apply to a specific property?
**Yes, in two places:**
1. `src/app/applications/page.tsx` (landlord's own applications list) has a `SharePanel` that renders each of the landlord's properties as `${BASE_URL}/apply/${property.id}` with a copy-link button (`src/app/applications/page.tsx:13-70`) — this is a landlord-facing "share this link with prospects" feature, not a public listing page.
2. **`src/app/browse/[id]/page.tsx:479-497`** — the public property detail page already links `Apply for this property` → `href={`/apply/${property.id}`}` when the viewer `isTenant && hasTenantProfile` (see §5 for full detail). This is the closest existing precedent for "public listing page → apply flow" and is highly relevant groundwork for the later phase.

---

## 4. Landlord review surface — confirmed to exist

`src/app/applications/page.tsx` (list) and `src/app/applications/[id]/page.tsx` (detail) together form a **complete, already-built** landlord review UI. Reachable via `NavBar.tsx:221` (`{ href: "/applications", label: "Applications" }`), so it's a first-class nav item, not a hidden/orphan route.

### List page (`src/app/applications/page.tsx`)
- `redirect("/login")` if no session.
- Loads the landlord's own `properties` (by `owner_id`), then all `tenant_applications` `in (property_ids)`, newest first.
- Shows pending/approved/rejected counters, a per-property "share apply link" panel, and a table with: applicant name+initials avatar+applied date, property name, `CreditScoreMeter` (credit score 0-100), rent/income (formatted Rand), `ApplicationStatusBadge`, and a red "High risk" chip on mobile when the credit score colour resolves to red.

### Detail page (`src/app/applications/[id]/page.tsx`)
- `redirect("/login")` if no session; fetches `tenant_applications.*` joined with `properties!inner(name, address, owner_id)`; **`notFound()` if `property.owner_id !== user.id`** (ownership check done in-app, redundant with RLS `applications_select_own`).
- Shows, per application: full contact info (name/email/phone), applied date, status badge, full `CreditScoreMeter` with breakdown, a fraud-flags panel (human-readable labels + severity styling for `DOB_MISMATCH`, `DUPLICATE_ID_IN_SYSTEM`, `FILENAME_BANK_MISMATCH`, `IRREGULAR_INCOME`, `LARGE_CASH_DEPOSIT`), full bank statement analysis (avg income/expenses/balance, salary months, bounced debit orders, gambling transactions, prior rental payments, monthly breakdown table, parse warnings), SA ID verification card (checksum, DOB, age, gender, citizenship), salary-to-rent ratio bar, a `Decision` action panel (`ActionPanel`/`StatusForm` — approve/reject/pending via `PATCH /api/applications/[id]`), and a `ReferenceCheckPanel` for tracking landlord reference checks.
- **No documents beyond the bank statement** are shown — no lease application PDF, no ID document image/scan upload (only the typed ID number + computed checksum verification).

Nothing under `src/app/dashboard` or `src/app/tenants` reviews/approves/rejects applications — those are separate surfaces (tenant list management and landlord home dashboard respectively); confirmed no overlapping/competing review UI exists elsewhere.

---

## 5. Is `tenant_applications` reusable, or should a fresh `applications` table be created?

**`tenant_applications` is already property-scoped and general enough to reuse — a fresh table is very likely unnecessary and would fragment the existing landlord review UI.**

Reasoning:
- It has `property_id` (FK → `properties`), not a lease/tenancy id — it is a **pre-tenancy** application table (rows exist before any `tenants`/`lease_agreements` row does), not a repurposed lease table. The lease-agreements linkage only happens as a *side effect* of approval (`createDraftLeaseForApproval`), not a structural dependency.
- It already has everything the target schema shape in the task brief maps to: `listing_id` ≈ `property_id`, `tenant_id` ≈ the new nullable `user_id` (added specifically for authorship), `message` has no direct equivalent today (no free-text note-from-applicant field — only the assembled application data, so if a "reachable from a public listing page" flow wants a message field, add a column here), `status`/timestamps already exist.
- The existing anon-insert RLS policy (`tenant_applications_insert_anon`) is deliberately public-safe: `status='pending'`, requires `property_id`, forbids `landlord_notes`. This is exactly the constraint shape a TrustScore-gated public apply flow needs, so it can very likely be reused as-is or lightly extended (e.g. adding a `WITH CHECK` clause tying to a minimum verification level, or moving the gate into the API route the way `/api/flatmate/[token]/apply` does — see below).
- A complete, working, nav-linked landlord review UI (`/applications`, `/applications/[id]`) already reads and writes this exact table. **Introducing a second `applications` table would either orphan that UI or require duplicating it** — reuse is the low-risk path.

### Important existing precedent for "TrustScore-gated public apply" (worth reusing the pattern, not the table)
Two different flows already gate/personalize an apply CTA based on tenant identity, and are strong reference implementations for the later phase:

1. **`src/app/browse/[id]/page.tsx`** (`PUBLIC_PROPERTY_COLUMNS`, public, `MarketingNav`, no login redirect) — already computes `isLandlord`/`isTenant`/`hasTenantProfile`/`scoreResult` server-side and conditionally renders the apply CTA (lines ~424-548): personalized match-score + "Apply for this property" (→ `/apply/[id]`) when `isTenant && hasTenantProfile`; "Complete your profile to apply" when `isTenant && !hasTenantProfile`; landlord-viewing message; "Sign in to apply" for anonymous visitors. **This gate is on tenant-profile existence, not on `tenant_profiles.verification_status` (TrustScore) — it is not yet TrustScore-gated**, which is presumably the gap the later phase should close.
2. **`src/app/flatmate/[token]/ApplyPanel.tsx`** + **`src/app/api/flatmate/[token]/apply/route.ts`** — a fully-realized TrustScore-gated apply flow, but for a *different* feature (flatmate room listings, table `flatmate_listings`/`flatmate_applicants`, not `properties`/`tenant_applications`). Pattern worth copying: the API route requires a session (401 + `needs_auth: true` if none), reads `tenant_profiles.verification_status` server-side, and rejects with 403 + `needs_verification: true` if `unverified`; the client component redirects to `/onboarding/verification` (via `setFlatmateReturnToken`) or `/register`/`/login` accordingly. `src/lib/types.ts:766-768` explicitly notes: *"this codebase has no numeric TrustScore anywhere"* — TrustScore is really `tenant_profiles.verification_status` (a `VerificationStatus` enum: presumably `unverified`/`pending`/`verified`/`rejected`, confirmed via `src/lib/tenant-dashboard/status.ts` and `src/__tests__/tenant-dashboard-status.test.ts`), not a numeric score.

### Properties table listing concept
`properties` (bootstrap in `supabase/schema.sql:36-42`: just `id, owner_id, name, address, created_at`) has been extended by many later migrations (not itself re-diagnosed column-by-column here, out of scope) to include `is_listed`, `status`, `suburb`, `province`, `asking_rent`, `available_from`, `photos`, `property_tags`, etc. — used via `PUBLIC_PROPERTY_COLUMNS` (`src/lib/types.ts:67-70+`). Two separate public-read RLS policies exist on `properties`: `properties_public_read` (`using (true)`, from the applications migration, apply-form-driven) and `public can view listed properties` (`using (is_listed = true)`, from `migration_public_browse.sql`) — both currently active/coexisting, worth reconciling but not blocking reuse.

---

## What does NOT exist (explicit gaps)
- No `applications` table — only `tenant_applications`.
- No numeric TrustScore field anywhere in the schema; "TrustScore" == `tenant_profiles.verification_status` (text enum) everywhere else in the codebase.
- No TrustScore/verification-status gate on the existing `/apply/[propertyId]` form or its API route — anyone (including fully anonymous visitors with no account) can submit today; the only auth-based behavior is that `user_id` gets attached if a session happens to exist.
- No tenant-facing single-application detail page (`/tenant/**/applications/[id]`) — only the landlord-facing detail page exists.
- No document upload beyond the bank statement (no ID scan/photo upload, no proof-of-employment upload) surfaced in the landlord review UI.
- No DELETE RLS policy on `tenant_applications`.
- No dedicated public "browse → apply" flow that is explicitly TrustScore-gated (the closest thing, `/browse/[id]`, gates on tenant-profile existence only, not verification status).
