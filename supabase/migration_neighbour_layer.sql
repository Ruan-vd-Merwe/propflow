-- ── Neighbour layer — opt-in profiles + endorsements ─────────────────────────
-- Purely additive: two new tables + RLS. No existing tables touched.
-- Applied: 2026-06-29

CREATE TABLE IF NOT EXISTS public.neighbour_profiles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offers       text[]      NOT NULL DEFAULT '{}',
  area         text,
  province     text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS neighbour_profiles_user_idx
  ON public.neighbour_profiles (user_id);

CREATE TABLE IF NOT EXISTS public.neighbour_endorsements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id),
  CONSTRAINT no_self_endorse CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS neighbour_endorsements_to_idx
  ON public.neighbour_endorsements (to_user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.neighbour_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighbour_endorsements ENABLE ROW LEVEL SECURITY;

-- neighbour_profiles: authenticated users see active profiles; own full CRUD
CREATE POLICY "neighbour_profiles_select" ON public.neighbour_profiles
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "neighbour_profiles_own" ON public.neighbour_profiles
  FOR ALL USING (user_id = auth.uid());

-- neighbour_endorsements: authenticated SELECT (for counts); insert own; delete own
CREATE POLICY "neighbour_endorsements_select" ON public.neighbour_endorsements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "neighbour_endorsements_insert" ON public.neighbour_endorsements
  FOR INSERT WITH CHECK (
    from_user_id = auth.uid() AND to_user_id <> auth.uid()
  );

CREATE POLICY "neighbour_endorsements_delete" ON public.neighbour_endorsements
  FOR DELETE USING (from_user_id = auth.uid());
