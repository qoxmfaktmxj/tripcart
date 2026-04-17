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
  '30000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'Remove Smoke Plan',
  'busan',
  '2026-05-04T09:00:00+09:00',
  'car',
  'confirmed'
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
  '30000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'Mutation Smoke Plan',
  'busan',
  '2026-05-03T09:00:00+09:00',
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

insert into public.trip_plan_stops (
  id,
  plan_id,
  place_id,
  stop_order,
  dwell_minutes
)
values
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    1,
    60
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    2,
    45
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

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';

do $$
declare
  v_payload jsonb;
  v_status trip_status;
begin
  v_payload := public.add_plan_stop(
    '30000000-0000-4000-8000-000000000002'::uuid,
    '20000000-0000-4000-8000-000000000001'::uuid,
    45,
    true
  );

  if v_payload->>'stop_order' <> '1' then
    raise exception 'add_plan_stop returned unexpected stop_order: %', v_payload;
  end if;

  select status into v_status
  from public.trip_plans
  where id = '30000000-0000-4000-8000-000000000002'::uuid;

  if v_status <> 'draft' then
    raise exception 'add_plan_stop did not reset plan to draft: %', v_status;
  end if;
end;
$$;

do $$
declare
  v_remaining_order smallint;
  v_status trip_status;
begin
  perform public.remove_plan_stop(
    '30000000-0000-4000-8000-000000000003'::uuid,
    '40000000-0000-4000-8000-000000000002'::uuid
  );

  select stop_order into v_remaining_order
  from public.trip_plan_stops
  where id = '40000000-0000-4000-8000-000000000003'::uuid;

  if v_remaining_order <> 1 then
    raise exception 'remove_plan_stop did not compact stop_order, got %', v_remaining_order;
  end if;

  select status into v_status
  from public.trip_plans
  where id = '30000000-0000-4000-8000-000000000003'::uuid;

  if v_status <> 'draft' then
    raise exception 'remove_plan_stop did not reset plan to draft: %', v_status;
  end if;
end;
$$;

do $$
declare
  v_stop_id uuid;
begin
  select id into v_stop_id
  from public.trip_plan_stops
  where plan_id = '30000000-0000-4000-8000-000000000002'::uuid
  limit 1;

  begin
    perform public.update_plan_stop(
      '30000000-0000-4000-8000-000000000002'::uuid,
      v_stop_id,
      '{"dwell_minutes":-5}'::jsonb
    );
    raise exception 'update_plan_stop allowed invalid dwell_minutes';
  exception
    when others then
      if sqlerrm not like '%INVALID_FIELD: dwell_minutes%' then
        raise;
      end if;
  end;
end;
$$;

insert into public.trip_executions (
  id,
  plan_id,
  user_id,
  status
)
values (
  '60000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'active'
);

do $$
begin
  begin
    perform public.reset_plan_to_draft('30000000-0000-4000-8000-000000000002'::uuid);
    raise exception 'reset_plan_to_draft allowed active execution mutation';
  exception
    when others then
      if sqlerrm not like '%PLAN_IN_PROGRESS%' then
        raise;
      end if;
  end;
end;
$$;

do $$
declare
  v_stop_id uuid;
begin
  select id into v_stop_id
  from public.trip_plan_stops
  where plan_id = '30000000-0000-4000-8000-000000000002'::uuid
  limit 1;

  begin
    perform public.update_plan_stop(
      '30000000-0000-4000-8000-000000000002'::uuid,
      v_stop_id,
      '{"dwell_minutes":60}'::jsonb
    );
    raise exception 'update_plan_stop allowed active execution mutation';
  exception
    when others then
      if sqlerrm not like '%PLAN_IN_PROGRESS%' then
        raise;
      end if;
  end;
end;
$$;

do $$
declare
  v_stop_id uuid;
begin
  select id into v_stop_id
  from public.trip_plan_stops
  where plan_id = '30000000-0000-4000-8000-000000000002'::uuid
  limit 1;

  begin
    perform public.remove_plan_stop(
      '30000000-0000-4000-8000-000000000002'::uuid,
      v_stop_id
    );
    raise exception 'remove_plan_stop allowed active execution mutation';
  exception
    when others then
      if sqlerrm not like '%PLAN_IN_PROGRESS%' then
        raise;
      end if;
  end;

  begin
    perform public.reorder_plan_stops(
      '30000000-0000-4000-8000-000000000002'::uuid,
      array[v_stop_id]::uuid[]
    );
    raise exception 'reorder_plan_stops allowed active execution mutation';
  exception
    when others then
      if sqlerrm not like '%PLAN_IN_PROGRESS%' then
        raise;
      end if;
  end;
end;
$$;

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';

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
