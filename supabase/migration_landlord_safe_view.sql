-- migration_landlord_safe_view.sql
-- Commit 7: Affordability derivation, landlord-safe view, matching integration
-- Run after: migration_tenant_onboarding.sql, migration_match_function.sql

-- =====================================================================
-- 1. LANDLORD-SAFE VIEW FUNCTION
--    Returns ONLY: display name, employment status, affordability range,
--    verification status, and relative fit label (if listing context).
--    Never exposes: income_band, monthly_income, sa_id_number, documents.
--
--    Access rules:
--    - Tenant is discoverable = true (open to landlord search), OR
--    - Tenant applied to one of the landlord's listings, OR
--    - Landlord sent an introduction request to this tenant
-- =====================================================================

create or replace function public.get_tenant_public_profile(
  p_tenant_id    uuid,
  p_listing_rent_cents integer default null  -- pass listing rent for relative fit
)
returns table (
  tenant_id           uuid,
  display_name        text,
  employment_status   text,
  affordability_min   integer,   -- cents
  affordability_max   integer,   -- cents
  verification_status text,
  relative_fit        text       -- 'comfortable' | 'moderate' | 'stretch' | null
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_landlord_id uuid := auth.uid();
  v_has_access  boolean := false;
begin
  -- Check access: discoverable, or relationship exists
  select true into v_has_access
  from public.tenant_profiles tp
  where tp.user_id = p_tenant_id
    and (
      -- Tenant opted in to discoverability
      tp.discoverable = true
      -- OR tenant applied to one of this landlord's properties
      or exists (
        select 1 from public.tenant_applications ta
        join public.properties pr on pr.id = ta.property_id
        where ta.email = (select email from public.profiles where id = p_tenant_id)
          and pr.owner_id = v_landlord_id
      )
      -- OR landlord sent an introduction request to this tenant
      or exists (
        select 1 from public.introduction_requests ir
        where ir.tenant_id = p_tenant_id
          and ir.landlord_id = v_landlord_id
      )
    );

  if v_has_access is not true then
    return;  -- empty result set
  end if;

  return query
  select
    p_tenant_id as tenant_id,
    pr.full_name as display_name,
    tp.employment_status::text,
    tp.affordability_min_cents as affordability_min,
    tp.affordability_max_cents as affordability_max,
    tp.verification_status::text,
    case
      when p_listing_rent_cents is null then null
      when tp.affordability_max_cents is null then null
      when p_listing_rent_cents <= coalesce(tp.affordability_min_cents, 0)
        then 'comfortable'
      when tp.affordability_max_cents is not null
           and p_listing_rent_cents <= tp.affordability_max_cents
        then 'moderate'
      else 'stretch'
    end as relative_fit
  from public.tenant_profiles tp
  join public.profiles pr on pr.id = tp.user_id
  where tp.user_id = p_tenant_id;
end;
$$;

-- =====================================================================
-- 2. UPDATED MATCH FUNCTION
--    Adds affordability as a signal alongside budget preference.
--    affordability_max_cents filters/down-ranks listings above it.
--    Budget preference (what tenant wants to spend) stays as a
--    separate scoring signal.
-- =====================================================================

create or replace function public.match_properties_for_tenant(
  p_user_id              uuid,
  p_budget_relax         numeric default 0.15,
  p_upcoming_before_days int     default 30,
  p_upcoming_after_days  int     default 90
)
returns table (
  property_id    uuid,
  match_kind     text,
  score          numeric,
  available_date date,
  name           text,
  suburb         text,
  province       text,
  bedrooms       integer,
  eff_rent_rand  integer,
  reasons        text[]
)
language sql
stable
as $$
with tp as (
  select
    user_id,
    looking_in_area,
    looking_in_province,
    budget_min,
    budget_max,
    affordability_max_cents,
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
    tp.affordability_max_cents,
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

    -- BUDGET fit (what tenant wants to spend)
    case
      when tp.budget_max is null                                  then 0.5
      when c.eff_rent_cents is null                               then 0.0
      when c.eff_rent_cents between coalesce(tp.budget_min,0) and tp.budget_max then 1.0
      when c.eff_rent_cents <= tp.budget_max * (1 + p_budget_relax)
           and c.eff_rent_cents >= coalesce(tp.budget_min,0) * (1 - p_budget_relax) then 0.5
      else 0.0
    end as budget_fit,

    -- AFFORDABILITY fit (what income supports)
    case
      when tp.affordability_max_cents is null                     then 0.5
      when c.eff_rent_cents is null                               then 0.0
      when c.eff_rent_cents <= tp.affordability_max_cents         then 1.0
      when c.eff_rent_cents <= tp.affordability_max_cents * 1.15  then 0.3
      else 0.0
    end as afford_fit,

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
           and s.afford_fit >= 0.3
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

    -- Score: 30% budget + 20% affordability + 25% area + 15% bed + 10% must-haves
    round(100 * (
          0.30 * s.budget_fit
        + 0.20 * s.afford_fit
        + 0.25 * s.area_fit
        + 0.15 * s.bed_fit
        + 0.10 * (case when s.must_total = 0 then 0.5
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
      case when s.afford_fit = 1.0 then 'within affordability'
           when s.afford_fit = 0.3 then 'slight stretch on income'
           when s.afford_fit = 0.0 and s.affordability_max_cents is not null
                then 'above affordability range' end,
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
