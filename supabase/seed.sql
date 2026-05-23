-- PropFlow Seed Data
-- IMPORTANT: Run schema.sql first.
-- Then create the test user via Supabase Dashboard → Authentication → Add User:
--   Email: test@propflow.co.za
--   Password: password123
-- Copy the generated UUID and replace LANDLORD_UUID below.

-- ─── Replace this with the actual user UUID from Supabase Auth ───────────────
-- After creating test@propflow.co.za in the Auth dashboard, run:
--   SELECT id FROM auth.users WHERE email = 'test@propflow.co.za';
-- Then paste the UUID here (the trigger will have already created a profiles row).

do $$
declare
  v_landlord_id   uuid;
  v_property_id   uuid;
  v_sarah_id      uuid;
  v_james_id      uuid;
  v_andre_id      uuid;
  v_base_date     date := date_trunc('month', now())::date;
begin

  -- Get the landlord user id
  select id into v_landlord_id
  from auth.users
  where email = 'test@propflow.co.za'
  limit 1;

  if v_landlord_id is null then
    raise exception 'test@propflow.co.za not found in auth.users. Create the user first in the Supabase Auth dashboard.';
  end if;

  -- Ensure profile exists (trigger should have created it, but just in case)
  insert into public.profiles (id, full_name, email)
  values (v_landlord_id, 'Test Landlord', 'test@propflow.co.za')
  on conflict (id) do nothing;

  -- ── Property ────────────────────────────────────────────────────────────────
  insert into public.properties (owner_id, name, address)
  values (
    v_landlord_id,
    '12 Ocean View Drive',
    '12 Ocean View Drive, Sea Point, Cape Town, 8005'
  )
  returning id into v_property_id;

  -- ── Tenants ─────────────────────────────────────────────────────────────────

  -- Sarah Dlamini — 6 months on-time → score ~100
  insert into public.tenants (property_id, full_name, email, phone, lease_start, lease_end, monthly_rent)
  values (v_property_id, 'Sarah Dlamini', 'sarah.dlamini@email.com', '071 234 5678',
          v_base_date - interval '6 months', v_base_date + interval '6 months', 1500000)
  returning id into v_sarah_id;

  -- James Fortuin — 2 missed, 1 late → score ~55
  insert into public.tenants (property_id, full_name, email, phone, lease_start, lease_end, monthly_rent)
  values (v_property_id, 'James Fortuin', 'james.fortuin@email.com', '082 345 6789',
          v_base_date - interval '6 months', v_base_date + interval '6 months', 1200000)
  returning id into v_james_id;

  -- Andre Visser — 4 missed → score ~20
  insert into public.tenants (property_id, full_name, email, phone, lease_start, lease_end, monthly_rent)
  values (v_property_id, 'Andre Visser', 'andre.visser@email.com', '083 456 7890',
          v_base_date - interval '6 months', v_base_date + interval '6 months', 1100000)
  returning id into v_andre_id;

  -- ── Payments: Sarah (6 on-time) ─────────────────────────────────────────────
  -- 6 consecutive on-time → two streak bonuses (+10 each at 3 and 6)
  -- Score: 100 + 10 + 10 = 120 → capped at 100
  for i in 1..6 loop
    insert into public.payments (tenant_id, amount, due_date, paid_date, status)
    values (
      v_sarah_id, 1500000,
      (v_base_date - interval '1 month' * (7 - i))::date,
      (v_base_date - interval '1 month' * (7 - i) + interval '1 day')::date,
      'paid'
    );
  end loop;

  -- ── Payments: James (2 missed, 1 late, 3 on-time) ──────────────────────────
  -- Score: 100 - 20 - 20 - 8 = 52 → ~55
  -- Month 1: on-time
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_james_id, 1200000, v_base_date - interval '6 months', v_base_date - interval '6 months' + interval '1 day', 'paid');
  -- Month 2: missed
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_james_id, 1200000, v_base_date - interval '5 months', null, 'missed');
  -- Month 3: on-time
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_james_id, 1200000, v_base_date - interval '4 months', v_base_date - interval '4 months' + interval '1 day', 'paid');
  -- Month 4: late (10 days late)
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_james_id, 1200000, v_base_date - interval '3 months', v_base_date - interval '3 months' + interval '10 days', 'late');
  -- Month 5: missed
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_james_id, 1200000, v_base_date - interval '2 months', null, 'missed');
  -- Month 6: on-time
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_james_id, 1200000, v_base_date - interval '1 month', v_base_date - interval '1 month' + interval '2 days', 'paid');

  -- ── Payments: Andre (4 missed, 2 on-time) ──────────────────────────────────
  -- Score: 100 - 20 - 20 - 20 - 20 = 20
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_andre_id, 1100000, v_base_date - interval '6 months', v_base_date - interval '6 months' + interval '2 days', 'paid');
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_andre_id, 1100000, v_base_date - interval '5 months', null, 'missed');
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_andre_id, 1100000, v_base_date - interval '4 months', null, 'missed');
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_andre_id, 1100000, v_base_date - interval '3 months', v_base_date - interval '3 months' + interval '1 day', 'paid');
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_andre_id, 1100000, v_base_date - interval '2 months', null, 'missed');
  insert into public.payments (tenant_id, amount, due_date, paid_date, status)
  values (v_andre_id, 1100000, v_base_date - interval '1 month', null, 'missed');

  raise notice 'Seed complete. Property: %, Tenants: %, %, %',
    v_property_id, v_sarah_id, v_james_id, v_andre_id;
end;
$$;
