# Diagnosis: `properties` Table for Public Listing Page (`/listings/[id]`)

Scope: read-only investigation of the current `properties` schema, RLS, image storage, and "published" concept, in preparation for a public, anon-readable listing page that must exclude landlord PII and unpublished listings.

---

## 1. Consolidated `properties` schema (bootstrap + every later migration)

Base table: `supabase/schema.sql:36-42` — `id, owner_id, name, address, created_at` only (owner_id FK to `profiles`).

| Column | Type | Added in |
|---|---|---|
| `id`, `owner_id`, `name`, `address`, `created_at` | uuid/text/timestamptz | `schema.sql:36-42` |
| `property_type`, `bedrooms`, `asking_rent` (cents), `available_from`, `suburb`, `province`, `description`, `is_listed`, `photos text[]` | various | `migration_marketplace.sql` |
| `floor_size_m2`, `pets_allowed`, `parking_available`, `fibre_available`, `property_tags text[]`, `area_tags text[]`, `lifestyle_tags text[]` | | `migration_property_tags.sql:5-13` (this is where "features" live — there is no plain `features` column; nothing else ever added one) |
| `purchase_price_cents`, `current_value_cents`, `bond_bank`, `bond_original_amount_cents`, `bond_monthly_payment_cents`, `bond_interest_rate_pct`, `bond_start_date`, `bond_term_years`, `levy_monthly_cents`, `rates_monthly_cents`, `insurance_monthly_cents`, `management_fee_pct` | financial | `migration_portfolio_finance.sql` |
| `suburb`*, `city`, `province`*, `postal_code`, `latitude`, `longitude`, `area_news_enabled` (*already existed, no-op) | location | `migration_secure_documents.sql` |
| `purchase_date`, `bond_remaining_months`, `bond_account_number`, `monthly_rent_cents`, `rental_due_day`, `deposit_amount_cents`, `lease_start_date`, `lease_end_date`, `notes` | financial/lease | `migration_finance.sql` |
| `status text` + CHECK `('draft','available','available_from','occupied','archived')` | | `migration_property_status.sql:6-18` |
| `street_number`, `street_name`, `building_name`, `block_number`, `unit_number`, `floor_number` | address detail | `migration_address_granularity.sql` |

No `bathrooms` column exists anywhere in the schema. **Price ambiguity**: `asking_rent` (int, migration_marketplace) vs `monthly_rent_cents` (bigint, migration_finance) coexist; `migration_match_function.sql` treats `coalesce(monthly_rent_cents, asking_rent*100)` as the working assumption for effective rent in cents — the listing page needs to pick this deliberately.

---

## 2. All RLS policies currently active on `properties`

- **`properties_own`** — `schema.sql:88-90` — `for all using (auth.uid() = owner_id)`. Never dropped, still active (owner full CRUD).
- **`properties_public_read`** — created `migration_applications.sql:106-107` (`for select using (true)`) — **explicitly DROPPED** in `migration_rls_storage_hardening_pre_launch.sql`. No longer active. (This corrects an earlier assumption in this run's own notes that it still coexisted — it does not; the hardening pass already removed it.)
- **`"public can view listed properties"` (v1)** — created `migration_public_browse.sql` (`using (is_listed = true)`) — DROPPED and RECREATED in `migration_property_status.sql`.
- **`"public can view listed properties"` (v2, current)** — `migration_property_status.sql:32-34` — `for select using (status in ('available', 'available_from'))`. This is the live public-select row policy today.
- **Column-level GRANT hardening** (layered on top of the row policy) — `migration_rls_storage_hardening_pre_launch.sql`: `revoke select on public.properties from anon;` then `grant select (id, name, address, suburb, province, street_name, street_number, building_name, block_number, unit_number, floor_number, bedrooms, floor_size_m2, property_type, description, monthly_rent_cents, deposit_amount_cents, rental_due_day, asking_rent, available_from, is_listed, status, lease_start_date, lease_end_date, photos, area_tags, lifestyle_tags, property_tags, parking_available, pets_allowed, fibre_available, created_at, owner_id) on public.properties to anon;` — deliberately excludes all finance columns (bond_*, purchase_price_cents, current_value_cents, levy/rates/insurance, notes). Includes `owner_id` (justified in-migration as "a plain FK, not a financial column", needed by `/browse/[id]` for "member since" + listing count).

**Gap the hardening migration itself doesn't close**: the revoke/grant only targets `anon`. `authenticated` still has Supabase's default table-wide select grant, so a logged-in non-owner is only protected by the row-level `status` policy, not the column allowlist — a logged-in user could `select *` via a raw REST call and see bond/valuation columns for any listed property.

---

## 3. Existing anon/public SELECT on `properties`, and any safe view

Yes, a direct table-level policy plus column grant (not a view) — quoted above. **No `public_listings`-style view exists.** `migration_landlord_safe_view.sql` is a false lead for this specific question: it defines `get_tenant_public_profile()`, a security-definer function returning a safe subset of `tenant_profiles` (for landlord-side tenant discovery), unrelated to `properties`.

The "safe anon-readable subset" the app relies on today is enforced by (a) the anon column GRANT allowlist and (b) app-layer discipline via `PUBLIC_PROPERTY_COLUMNS` (`src/lib/types.ts:67-71`), used in `src/app/browse/page.tsx` and `src/app/browse/[id]/page.tsx`. This directly contradicts the new feature's unconditional Decision Rule 1 (never grant anon read on `properties` directly, always use a dedicated view) — that rule is correctly cautious given `owner_id` is already in the anon-readable set today, and a view lets the new `/listings/[id]` surface be strictly narrower (no `owner_id`) without touching or depending on the existing grant.

---

## 4. Image storage

- **Column**: `photos text[] not null default '{}'` — array of public storage URLs, not jsonb.
- **Bucket**: `property-photos`, created **public: true** (`migration_photos.sql`), re-ensured idempotently elsewhere.
- **Bucket policies**: "Anyone can view property photos" (public select); upload scoped only to `auth.role()='authenticated'`, no ownership check. `migration_rls_storage_hardening_pre_launch.sql` later fixed only the **delete** policy to check real ownership against `properties.owner_id`. Upload was not similarly fixed — any authenticated user can still upload into any property's photo folder.
- **Upload API**: `src/app/api/upload/property-photo/route.ts` — requires a session, stores at `${propertyId}/${timestamp}-{rand}.{ext}`, returns `getPublicUrl()` (unsigned, permanently public). Does not itself verify the caller owns `propertyId`.
- **Conclusion for `/listings/[id]`**: the bucket is already public, `photos` URLs are directly embeddable with no signing needed. This means Decision Rule 4 ("images in an authenticated bucket, default to signed URLs") does not apply as written — its premise (authenticated bucket) is false for `property-photos`. Plain public URLs are used, matching existing `/browse/[id]` behavior.

---

## 5. What identifies "published"/"listed" today

Two overlapping columns: `is_listed boolean` (default false) and `status text` (default `'available'`, added explicitly "replacing the boolean is_listed flag" per its own migration header) — but `is_listed` was never dropped and is not kept in sync by any trigger after its one-time backfill. All actual filtering uses `status`, not `is_listed`:
- `src/app/browse/page.tsx` — `.in("status", ["available", "available_from"])`.
- `src/app/browse/[id]/page.tsx` — same filter plus `.eq("id", params.id).single()`, `notFound()` if missing — an unlisted/draft/occupied property 404s for anonymous visitors even by direct id.

At creation time, `src/app/properties/new/page.tsx` computes `status` via `resolveStatus()` and derives `isListed` from it, writing both columns together — consistency is an app-layer convention only, not DB-enforced. This existing `status`/`is_listed` pair governs marketplace matching visibility; it is a separate concept from the new `is_published` flag this feature adds, which governs whether the single shareable `/listings/[id]` URL resolves at all (landlord opt-in per property, independent of marketplace status).

---

## 6. Landlord-facing single-property management surfaces (for the publish toggle)

- **`src/app/properties/new/page.tsx`** — marketplace listing creation wizard; sets `status`/`is_listed` at insert only.
- **`src/app/properties/[id]/page.tsx`** — main landlord property page (`redirect("/login")` if no session, `.eq("owner_id", user.id)` + `notFound()` if not owner). Shows tenants, match scores, `PropertyPhotoUpload`, `SharePortalButton`, `IntroduceButton`. No status/is_listed control rendered here.
- **`src/app/properties/[id]/edit/page.tsx`** + **`EditPropertyForm.tsx`** — the actual edit form; fields present: name, address, property_type, bedrooms, asking_rent, available_from, suburb, province, postal_code, description, floor_size_m2, pets_allowed, parking_available, fibre_available. `is_listed`/`status` are not editable anywhere in this form — no publish/unpublish UI exists today. **This is the natural, lowest-friction place to add a publish/unpublish toggle**, since it already edits the same listing-facing fields that pair with a published flag.
- **`src/app/portfolio/page.tsx`** + **`src/app/portfolio/[id]/page.tsx`** — a second, parallel owner-gated single-property surface, finance-oriented, `select("*")`. No status/is_listed editing here either.
- **`src/app/portfolio/add/AddPropertyFlow.tsx`** — separate "onboard an existing occupied property" flow for portfolio/finance tracking, not new marketplace listings.

Net: `/properties/[id]/edit` is the correct incremental integration point for the publish/unpublish toggle.
