-- ============================================================================
-- TripCart RPC/share security smoke test
-- Requires local Supabase PostgreSQL with migrations applied.
-- Verifies:
--   1. SECURITY DEFINER RPCs do not trust caller-supplied user ids.
--   2. link_only shared itineraries are not directly selectable through RLS.
--   3. share-code RPC can return a validated link_only snapshot.
-- ============================================================================

\set ON_ERROR_STOP on

begin;

set local client_min_messages = warning;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'owner-smoke@tripcart.local',
    '',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'attacker-smoke@tripcart.local',
    '',
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    false
  );

insert into public.places (
  id,
  name,
  category,
  lat,
  lng,
  address,
  region
)
values (
  '20000000-0000-4000-8000-000000000001',
  'Smoke Place',
  'attraction',
  35.1000000,
  129.0000000,
  'Busan',
  'busan'
);

insert into public.trip_plans (
  id,
  user_id,
  title,
  region,
  start_at,
  transport_mode,
  status
)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Smoke Plan',
  'busan',
  '2026-05-02T09:00:00+09:00',
  'car',
  'confirmed'
);

insert into public.trip_plan_stops (
  id,
  plan_id,
  place_id,
  stop_order,
  dwell_minutes
)
values (
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  1,
  60
);

insert into public.shared_itineraries (
  id,
  source_plan_id,
  created_by,
  share_code,
  visibility,
  source_plan_version,
  relative_stops,
  title,
  region,
  transport_mode,
  total_stops
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'smokelink001',
    'link_only',
    1,
    '[{"place_id":"20000000-0000-4000-8000-000000000001","day_index":1,"offset_minutes":0,"dwell_minutes":60,"order":1}]'::jsonb,
    'Smoke Link',
    'busan',
    'car',
    1
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'smokepublic001',
    'public',
    1,
    '[]'::jsonb,
    'Smoke Public',
    'busan',
    'car',
    0
  );

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';

do $$
begin
  begin
    perform public.start_trip_execution(
      '30000000-0000-4000-8000-000000000001'::uuid,
      '10000000-0000-4000-8000-000000000001'::uuid
    );
    raise exception 'start_trip_execution allowed owner mismatch';
  exception
    when others then
      if sqlerrm not like '%NOT_OWNER%' then
        raise;
      end if;
  end;
end;
$$;

do $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.shared_itineraries
  where share_code = 'smokelink001';

  if v_count <> 0 then
    raise exception 'link_only direct select returned % rows for authenticated mismatch user', v_count;
  end if;
end;
$$;

do $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.shared_itineraries
  where share_code = 'smokepublic001';

  if v_count <> 1 then
    raise exception 'public direct select returned % rows, expected 1', v_count;
  end if;
end;
$$;

reset role;
set local role anon;
set local request.jwt.claim.role = 'anon';

do $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.shared_itineraries
  where share_code = 'smokelink001';

  if v_count <> 0 then
    raise exception 'link_only direct select returned % rows for anon', v_count;
  end if;
end;
$$;

do $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.get_shared_itinerary('smokelink001');

  if v_count <> 1 then
    raise exception 'share-code RPC returned % rows, expected 1', v_count;
  end if;
end;
$$;

reset role;

select 'rpc_share_security_smoke: ok' as result;

rollback;
