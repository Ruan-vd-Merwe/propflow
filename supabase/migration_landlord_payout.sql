-- Landlord payout destination (rent payments groundwork)
-- Run after migration_rent_payments_phase2.sql. Additive only, safe to re-run.
-- NOT a go-live migration: no real payment gateway is wired up by this file.
-- This only prepares the schema so a real provider (e.g. Payfast Split
-- Payments) can be added later without a further schema change, once
-- Payfast vendor registration details are confirmed directly with them.
--
-- Product decision: one payout destination per landlord, portfolio-wide —
-- not per-property. Attaches to profiles because profiles IS the landlord
-- identity record (see the existing "profiles_own" RLS policy below).

alter table public.profiles
  add column if not exists payout_provider     text,
  add column if not exists payout_provider_ref text;

comment on column public.profiles.payout_provider is
  'Payout gateway identifier, e.g. payfast. Provider-agnostic column name (not "payfast_ref") so adding a second provider later does not require a schema change. No CHECK constraint on the value set, for the same reason.';

comment on column public.profiles.payout_provider_ref is
  'Opaque reference/vendor ID issued by the payout provider for this landlord. NOT raw bank account details. The exact shape depends on the provider''s vendor/split-recipient model. For Payfast this is pending vendor registration confirmation — see the TODO on SplitConfig in src/lib/rent/payment-providers/types.ts.';


-- ─── Row Level Security ───────────────────────────────────────────────────────
-- No new policy is added here. public.profiles already has:
--
--   create policy "profiles_own" on public.profiles
--     for all using (auth.uid() = id);
--
-- "for all" covers select/insert/update/delete on the whole row, so this
-- already restricts read/write of payout_provider and payout_provider_ref
-- to the owning landlord for any request made through the anon/authenticated
-- client — consistent with the auth.uid() = landlord_id pattern used on
-- rent_schedules/rent_obligations/payment_attempts.
--
-- Gap this migration does NOT close (flagging explicitly, not leaving it
-- silent): every /api route in this codebase reads and writes profiles
-- through createServiceClient(), which uses the service-role key and
-- bypasses RLS entirely — same as every other column on profiles today.
-- There is no column-level restriction anywhere in this schema, so any
-- server route holding the service-role client can already read or write
-- any landlord's payout_provider_ref, same as it can read/write full_name
-- or email. This is not a new gap introduced by this migration; it is the
-- pre-existing service-role gap noted in the prior diagnosis, now applying
-- to a more sensitive field. Closing it needs a decision this migration
-- does not make: e.g. a route-level authorization check at every call site
-- that writes payout_provider_ref (RLS alone cannot gate service-role
-- access), scoped once a real provider and its write path exist.
--
-- Follow-up decision recorded here so this does not get re-litigated from
-- scratch. Options evaluated: column-level GRANT/REVOKE (precedent:
-- properties/anon in migration_rls_storage_hardening_pre_launch.sql), a
-- dedicated table with its own RLS (precedent: tenant_sensitive in
-- migration_tenant_onboarding.sql), and a security-definer view.
-- GRANT/REVOKE only restricts anon/authenticated, not service_role, so it
-- does not address the actual gap. A security-definer view does not stop
-- service_role from reading the base table directly, so it also does not
-- address the gap. A dedicated table would work but means restructuring
-- profiles, which is a bigger call than one build pass should make on its
-- own, especially for a reference/ID value (not raw banking data) whose
-- sensitivity is real but moderate. Decision: documented, accepted risk for
-- now. Revisit if payout_provider_ref ever needs to hold something less
-- opaque, or when a real payout provider's write path is built, at which
-- point a route-level authorization check can be added at that one call
-- site instead of restructuring the table.

notify pgrst, 'reload schema';
