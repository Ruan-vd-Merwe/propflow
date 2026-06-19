-- =====================================================================
-- PropTrust — tenant ⇄ property matching        (v2 — units corrected)
-- One function, three feeds: 'exact' | 'relaxed' | 'upcoming'
--
-- CHANGE FROM v1: budget_min/max are stored in CENTS (confirmed from
-- data: values 600000–1600000 = R6,000–R16,000/mo). v1 wrongly treated
-- budget as rand, which broke the budget filter by 100x. Everything
-- below now compares in CENTS.
--
-- ---------------------------------------------------------------------
-- CONFIRMED FROM DATA:
--   * budget_min / budget_max ........ CENTS
--   * monthly_rent_cents ............. CENTS (suffix + matches budget scale)
--   * all properties currently is_listed=true AND status='available'
--     (40 rows) — so 'available now' can key off either; they're
--     redundant *in current data* (no occupied/vacant rows exist yet).
--   * lease_agreements is EMPTY → 'upcoming' falls back to
--     tenants.lease_end / properties.lease_end_date until it's populated.
--
-- STILL UNCONFIRMED — verify before listings carry rent:
--   * asking_rent UNIT is unknown (column is 100% NULL, no data to infer,
--     and the no-suffix naming convention proved unreliable for budget).
--     Read the listing-form write path. Default here: asking_rent is RAND
--     → multiplied by 100 to cents. FLIP THE ×100 IF IT'S ALREADY CENTS.
--   * lease_agreements.status vocabulary (table empty) — the
--     `lease_end > current_date` guard does the real work regardless.
--
-- KNOWN BLOCKER (data, not logic):
--   * asking_rent AND monthly_rent_cents are both NULL on all properties,
--     so eff_rent_cents is NULL → every listed unit fails budget and is
--     invisible to search. Require rent at listing time to fix.
--
-- RECOMMENDED SCHEMA ADDITIONS (run separately when ready):
--   alter table properties add column features text[] default '{}';
--   alter table properties add column relet_intent boolean default false;
-- =====================================================================

create or replace function public.match_properties_for_tenant(
  p_user_id              uuid,
  p_budget_relax         numeric default 0.15,  -- widen budget by ±15% for 'relaxed'
  p_upcoming_before_days int     default 30,    -- lease may end up to 30d before move-in
  p_upcoming_after_days  int     default 90     -- ...or up to 90d after
)
returns table (
  property_id    uuid,
  match_kind     text,        -- 'exact' | 'relaxed' | 'upcoming'
  score          numeric,     -- 0..100
  available_date date,
  name           text,
  suburb         text,
  province       text,
  bedrooms       integer,
  eff_rent_rand  integer,     -- effective monthly rent in RAND (for display)
  reasons        text[]       -- why it matched / how it differs
)
language sql
stable
as $$
with tp as (
  select
    user_id,
    looking_in_area,
    looking_in_province,
    budget_min,                              -- CENTS
    budget_max,                              -- CENTS
    coalesce(move_in_date, current_date) as move_in_date,
    desired_bedrooms,
    area_interests,
    must_haves,
    dealbreakers,
    importance_weights
  from public.tenant_profiles
  where user_id = p_user_id
  limit 1
),

cand as (
  select
    p.id,
    p.name,
    p.suburb,
    p.province,
    p.bedrooms,
    coalesce(p.description, '')         as description,
    coalesce(p.area_tags, '{}'::text[]) as area_tags,
    p.is_listed,
    p.status,
    p.available_from,
    -- effective rent in CENTS. monthly_rent_cents is cents; asking_rent
    -- is assumed RAND here (×100). >>> FLIP THE ×100 IF asking_rent IS CENTS <<<
    coalesce(p.monthly_rent_cents, (p.asking_rent * 100)::bigint) as eff_rent_cents,
    greatest(
      coalesce(p.lease_end_date, date '1900-01-01'),
      coalesce((select max(t.lease_end)
                  from public.tenants t
                 where t.property_id = p.id), date '1900-01-01'),
      coalesce((select max(la.lease_end)
                  from public.lease_agreements la
                 where la.property_id = p.id
                   and coalesce(la.status,'') not in ('terminated','cancelled')),
               date '1900-01-01')
    ) as derived_lease_end
  from public.properties p
),

scored as (
  select
    c.*,
    tp.looking_in_area,
    tp.looking_in_province,
    tp.budget_min,
    tp.budget_max,
    tp.move_in_date,
    tp.desired_bedrooms,

    case
      when tp.looking_in_area is not null
           and lower(c.suburb) = lower(tp.looking_in_area)        then 1.0
      when c.area_tags && tp.area_interests
           or c.suburb = any(tp.area_interests)                   then 0.6
      when tp.looking_in_province is not null
           and c.province = tp.looking_in_province                then 0.3
      else 0.0
    end as area_fit,

    -- BUDGET fit — all CENTS now
    case
      when tp.budget_max is null                                  then 0.5
      when c.eff_rent_cents is null                               then 0.0   -- no price → can't match
      when c.eff_rent_cents between coalesce(tp.budget_min,0) and tp.budget_max then 1.0
      when c.eff_rent_cents <= tp.budget_max * (1 + p_budget_relax)
           and c.eff_rent_cents >= coalesce(tp.budget_min,0) * (1 - p_budget_relax) then 0.5
      else 0.0
    end as budget_fit,

    case
      when tp.desired_bedrooms is null                            then 0.5
      when c.bedrooms >= tp.desired_bedrooms                      then 1.0
      when c.bedrooms = tp.desired_bedrooms - 1                   then 0.5
      else 0.0
    end as bed_fit,

    (select count(*) from unnest(tp.must_haves) mh
       where c.description ilike '%'||mh||'%' or mh = any(c.area_tags)) as must_hit,
    cardinality(tp.must_haves)                                          as must_total,
    (select count(*) from unnest(tp.dealbreakers) db
       where c.description ilike '%'||db||'%' or db = any(c.area_tags)) as deal_hit
  from cand c
  cross join tp
)

select * from (
  select
    s.id as property_id,

    case
      when s.deal_hit > 0 then 'relaxed'
      when s.is_listed
           and s.area_fit = 1.0 and s.budget_fit = 1.0
           and (s.available_from is null or s.available_from <= s.move_in_date)
        then 'exact'
      when s.is_listed and s.area_fit >= 0.3 and s.budget_fit >= 0.5
        then 'relaxed'
      when (not s.is_listed)
           and s.derived_lease_end > current_date
           and s.derived_lease_end between s.move_in_date - p_upcoming_before_days
                                       and s.move_in_date + p_upcoming_after_days
           and s.area_fit >= 0.3 and s.budget_fit >= 0.5
        then 'upcoming'
      else null
    end as match_kind,

    round(100 * (
          0.35 * s.budget_fit
        + 0.35 * s.area_fit
        + 0.15 * s.bed_fit
        + 0.15 * (case when s.must_total = 0 then 0.5
                       else s.must_hit::numeric / s.must_total end)
    ), 1) as score,

    case when not s.is_listed then s.derived_lease_end + 1
         else coalesce(s.available_from, current_date) end as available_date,

    s.name, s.suburb, s.province, s.bedrooms,
    (s.eff_rent_cents / 100)::int as eff_rent_rand,

    array_remove(array[
      case when s.budget_fit = 1.0 then 'within budget'
           when s.budget_fit = 0.5 and s.budget_max is not null and s.eff_rent_cents > s.budget_max
                then 'R'||((s.eff_rent_cents - s.budget_max)/100)||'/mo over budget'
           when s.budget_fit = 0.5 then 'near budget' end,
      case when s.area_fit = 1.0 then 'in '||s.suburb
           when s.area_fit = 0.6 then 'near your area ('||s.suburb||')'
           when s.area_fit = 0.3 then 'same province' end,
      case when s.desired_bedrooms is not null and s.bedrooms < s.desired_bedrooms
                then s.bedrooms||' bed (you wanted '||s.desired_bedrooms||')' end,
      case when not s.is_listed then 'available ~'||to_char(s.derived_lease_end + 1, 'Mon YYYY') end,
      case when s.deal_hit > 0 then 'matches a dealbreaker — review' end
    ], null) as reasons

  from scored s
  where
       s.deal_hit > 0
    or (s.is_listed and s.area_fit >= 0.3 and s.budget_fit >= 0.5)
    or ((not s.is_listed)
        and s.derived_lease_end > current_date
        and s.derived_lease_end between s.move_in_date - p_upcoming_before_days
                                    and s.move_in_date + p_upcoming_after_days
        and s.area_fit >= 0.3 and s.budget_fit >= 0.5)
) sub
order by
  case match_kind
    when 'exact'    then 0
    when 'relaxed'  then 1
    when 'upcoming' then 2
    else 3
  end,
  score desc;
$$;
