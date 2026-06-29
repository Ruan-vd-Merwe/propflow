-- ── Services self-serve ownership ─────────────────────────────────────────────
-- Additive only: new columns + new/replaced RLS policies on service_providers.
-- Applied: 2026-06-29

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_self_listed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS service_providers_owner_idx
  ON public.service_providers (owner_user_id)
  WHERE owner_user_id IS NOT NULL;

-- Replace permissive anon SELECT with authenticated-only to protect phone/whatsapp.
-- Existing curated rows remain visible to all authenticated users.
DROP POLICY IF EXISTS "svc_prov_read" ON public.service_providers;
CREATE POLICY "svc_prov_read" ON public.service_providers
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Self-serve INSERT: owner must set their own owner_user_id and is_self_listed=true
DROP POLICY IF EXISTS "svc_prov_insert" ON public.service_providers;
CREATE POLICY "svc_prov_insert" ON public.service_providers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_user_id = auth.uid()
    AND is_self_listed = true
  );

-- Owner UPDATE/DELETE
DROP POLICY IF EXISTS "svc_prov_owner_update" ON public.service_providers;
CREATE POLICY "svc_prov_owner_update" ON public.service_providers
  FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "svc_prov_owner_delete" ON public.service_providers;
CREATE POLICY "svc_prov_owner_delete" ON public.service_providers
  FOR DELETE USING (owner_user_id = auth.uid());
