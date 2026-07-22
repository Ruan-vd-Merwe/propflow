-- Add nullable user_id authorship to tenant_applications.
-- Existing rows stay NULL — no email backfill (mis-attribution risk).
-- Adds own-read SELECT policy: authenticated tenants see only rows where
-- user_id = auth.uid(). NULL rows are invisible (NULL = auth.uid() is false).
-- Anon INSERT policy is unchanged.

ALTER TABLE public.tenant_applications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenant_applications_user_id_idx
  ON public.tenant_applications (user_id);

CREATE POLICY "tenant_applications_select_own" ON public.tenant_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
