-- ============================================================================
-- Migration: RPC and shared itinerary security hardening
-- date: 2026-04-15
-- purpose:
--   1. Stop SECURITY DEFINER RPCs from trusting caller-supplied user ids.
--   2. Block direct RLS enumeration of link_only shared itineraries.
--   3. Add a validated share-code RPC for public/link-only preview reads.
--   4. Restrict privileged helper RPCs to minimum required roles.
-- ============================================================================

alter table public.shared_itineraries
  add column if not exists expires_at timestamptz;

drop policy if exists "Shared: 누구나 public/link_only 조회" on public.shared_itineraries;
drop policy if exists "Shared: public preview direct select" on public.shared_itineraries;
drop policy if exists "Shared: owner select" on public.shared_itineraries;

create policy "Shared: public preview direct select" on public.shared_itineraries
for select using (
  deleted_at is null
  and visibility = 'public'
  and (expires_at is null or expires_at > now())
);

create policy "Shared: owner select" on public.shared_itineraries
for select using (
  auth.uid() is not null
  and auth.uid() = created_by
  and deleted_at is null
);

create or replace function public.get_shared_itinerary(p_share_code text)
returns table (
  id uuid,
  share_code text,
  visibility share_visibility,
  source_plan_version integer,
  relative_stops jsonb,
  title text,
  description text,
  region text,
  transport_mode transport_mode,
  total_stops smallint,
  estimated_hours numeric(4, 1),
  cover_image_url text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shared public.shared_itineraries%rowtype;
begin
  select *
    into v_shared
  from public.shared_itineraries si
  where si.share_code = p_share_code
    and si.deleted_at is null;

  if v_shared.id is null then
    raise exception 'SHARED_NOT_FOUND';
  end if;

  if v_shared.expires_at is not null and v_shared.expires_at <= now() then
    raise exception 'SHARED_NOT_FOUND';
  end if;

  if v_shared.visibility = 'private' and v_shared.created_by is distinct from auth.uid() then
    raise exception 'SHARED_PRIVATE';
  end if;

  if v_shared.visibility not in ('public', 'link_only', 'private') then
    raise exception 'SHARED_NOT_FOUND';
  end if;

  update public.shared_itineraries
     set view_count = view_count + 1,
         updated_at = now()
   where public.shared_itineraries.id = v_shared.id;

  return query
  select
    v_shared.id,
    v_shared.share_code,
    v_shared.visibility,
    v_shared.source_plan_version,
    v_shared.relative_stops,
    v_shared.title,
    v_shared.description,
    v_shared.region,
    v_shared.transport_mode,
    v_shared.total_stops,
    v_shared.estimated_hours,
    v_shared.cover_image_url,
    v_shared.expires_at,
    v_shared.created_at,
    now();
end;
$$;

create or replace function public.start_trip_execution(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exec_id uuid;
  v_plan_owner uuid;
  v_plan_status trip_status;
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select user_id, status
    into v_plan_owner, v_plan_status
  from public.trip_plans
  where id = p_plan_id
    and deleted_at is null
  for update;

  if v_plan_owner is null then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  if v_plan_owner <> v_caller then
    raise exception 'NOT_OWNER';
  end if;

  if v_plan_status <> 'confirmed' then
    raise exception 'PLAN_NOT_CONFIRMED: status is %', v_plan_status;
  end if;

  begin
    insert into public.trip_executions (plan_id, user_id, status)
    values (p_plan_id, v_caller, 'active')
    returning id into v_exec_id;
  exception
    when unique_violation then
      raise exception 'EXECUTION_ALREADY_ACTIVE';
  end;

  insert into public.trip_execution_stops (
    execution_id,
    place_id,
    plan_stop_id,
    stop_order,
    planned_arrive_at,
    planned_leave_at,
    planned_dwell_minutes,
    planned_travel_from_prev_minutes
  )
  select
    v_exec_id,
    tps.place_id,
    tps.id,
    tps.stop_order,
    tps.arrive_at,
    tps.leave_at,
    tps.dwell_minutes,
    tps.travel_from_prev_minutes
  from public.trip_plan_stops tps
  where tps.plan_id = p_plan_id
  order by tps.stop_order;

  update public.trip_plans
     set status = 'in_progress',
         updated_at = now()
   where id = p_plan_id;

  return v_exec_id;
end;
$$;

create or replace function public.start_trip_execution(p_plan_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_user_id is distinct from auth.uid() then
    raise exception 'NOT_OWNER';
  end if;

  return public.start_trip_execution(p_plan_id);
end;
$$;

create or replace function public.import_shared_itinerary(
  p_share_code text,
  p_start_at timestamptz,
  p_transport_mode transport_mode default 'car',
  p_origin_lat numeric default null,
  p_origin_lng numeric default null,
  p_origin_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shared public.shared_itineraries%rowtype;
  v_new_plan_id uuid;
  v_stop record;
  v_order smallint := 1;
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
    into v_shared
  from public.shared_itineraries si
  where si.share_code = p_share_code
    and si.deleted_at is null;

  if v_shared.id is null then
    raise exception 'SHARED_NOT_FOUND';
  end if;

  if v_shared.expires_at is not null and v_shared.expires_at <= now() then
    raise exception 'SHARED_NOT_FOUND';
  end if;

  if v_shared.visibility = 'private' and v_shared.created_by <> v_caller then
    raise exception 'SHARED_PRIVATE';
  end if;

  insert into public.trip_plans (
    user_id,
    title,
    region,
    transport_mode,
    start_at,
    origin_lat,
    origin_lng,
    origin_name,
    status
  )
  values (
    v_caller,
    v_shared.title || ' (imported)',
    v_shared.region,
    p_transport_mode,
    p_start_at,
    p_origin_lat,
    p_origin_lng,
    p_origin_name,
    'draft'
  )
  returning id into v_new_plan_id;

  for v_stop in
    select *
    from jsonb_to_recordset(v_shared.relative_stops) as x(
      place_id uuid,
      day_index int,
      offset_minutes int,
      dwell_minutes int,
      "order" int
    )
    order by "order"
  loop
    insert into public.trip_plan_stops (
      plan_id,
      place_id,
      stop_order,
      dwell_minutes
    )
    values (
      v_new_plan_id,
      v_stop.place_id,
      v_order,
      coalesce(v_stop.dwell_minutes, 60)
    );

    v_order := v_order + 1;
  end loop;

  insert into public.shared_itinerary_imports (
    shared_id,
    imported_by,
    result_plan_id,
    scheduled_start_at
  )
  values (v_shared.id, v_caller, v_new_plan_id, p_start_at);

  update public.shared_itineraries
     set import_count = import_count + 1,
         updated_at = now()
   where id = v_shared.id;

  return v_new_plan_id;
end;
$$;

create or replace function public.import_shared_itinerary(
  p_share_code text,
  p_user_id uuid,
  p_start_at timestamptz,
  p_transport_mode transport_mode default 'car',
  p_origin_lat numeric default null,
  p_origin_lng numeric default null,
  p_origin_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_user_id is distinct from auth.uid() then
    raise exception 'NOT_OWNER';
  end if;

  return public.import_shared_itinerary(
    p_share_code,
    p_start_at,
    p_transport_mode,
    p_origin_lat,
    p_origin_lng,
    p_origin_name
  );
end;
$$;

create or replace function public.seed_golden_scenarios(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gomjangeo uuid;
  v_gwangalli uuid;
  v_haeundae uuid;
  v_cafe uuid;
  v_gamcheon uuid;
  v_jagalchi uuid;
  v_plan1 uuid;
  v_plan2 uuid;
  v_plan3 uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if auth.uid() is null or auth.uid() <> p_user_id then
      raise exception 'NOT_OWNER';
    end if;
  end if;

  v_gomjangeo := public.ensure_seed_place(
    'seed:gs:gomjangeo',
    'Haeundae Gomjangeo',
    'restaurant',
    35.1585961,
    129.1601750,
    'Busan Haeundae-gu Jung-dong',
    'busan',
    array['restaurant','grill']
  );

  v_gwangalli := public.ensure_seed_place(
    'seed:gs:gwangalli',
    'Gwangalli Beach',
    'attraction',
    35.1531696,
    129.1186028,
    'Busan Suyeong-gu',
    'busan',
    array['view','night']
  );

  v_haeundae := public.ensure_seed_place(
    'seed:gs:haeundae',
    'Haeundae Beach',
    'attraction',
    35.1587203,
    129.1604355,
    'Busan Haeundae-gu',
    'busan',
    array['beach','walk']
  );

  v_cafe := public.ensure_seed_place(
    'seed:gs:momos',
    'Momos Coffee Jeonpo',
    'cafe',
    35.1554730,
    129.0640850,
    'Busan Busanjin-gu',
    'busan',
    array['cafe','dessert']
  );

  v_gamcheon := public.ensure_seed_place(
    'seed:gs:gamcheon',
    'Gamcheon Culture Village',
    'attraction',
    35.0975144,
    129.0107697,
    'Busan Saha-gu',
    'busan',
    array['attraction','photo']
  );

  v_jagalchi := public.ensure_seed_place(
    'seed:gs:jagalchi',
    'Jagalchi Market',
    'restaurant',
    35.0966168,
    129.0305056,
    'Busan Jung-gu',
    'busan',
    array['restaurant','market']
  );

  delete from public.place_break_windows
   where place_id in (v_gomjangeo, v_gwangalli, v_haeundae, v_cafe, v_gamcheon, v_jagalchi);

  delete from public.place_hours
   where place_id in (v_gomjangeo, v_gwangalli, v_haeundae, v_cafe, v_gamcheon, v_jagalchi);

  delete from public.place_visit_profile
   where place_id in (v_gomjangeo, v_gwangalli, v_haeundae, v_cafe, v_gamcheon, v_jagalchi);

  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_gomjangeo, d, '11:00', '22:00'
  from unnest(array['mon','tue','wed','thu','fri','sat']::day_of_week[]) d;
  insert into public.place_hours (place_id, day, is_closed)
  values (v_gomjangeo, 'sun', true);

  insert into public.place_break_windows (place_id, day, break_start, break_end, last_order)
  select v_gomjangeo, d, '14:30', '17:00', '14:00'
  from unnest(array['mon','tue','wed','thu','fri']::day_of_week[]) d;
  insert into public.place_break_windows (place_id, day, break_start, break_end, last_order)
  values (v_gomjangeo, 'sat', '15:00', '17:00', '14:30');

  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_gamcheon, d, '09:00', '17:00'
  from unnest(array['mon','tue','wed','thu','fri','sat','sun']::day_of_week[]) d;

  insert into public.place_hours (place_id, day, open_time, close_time, crosses_midnight)
  values
    (v_jagalchi, 'fri', '05:00', '01:00', true),
    (v_jagalchi, 'sat', '05:00', '01:00', true);

  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_jagalchi, d, '05:00', '22:00'
  from unnest(array['mon','tue','wed','thu','sun']::day_of_week[]) d;

  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_gwangalli, d, '00:00', '23:59'
  from unnest(array['mon','tue','wed','thu','fri','sat','sun']::day_of_week[]) d;

  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_haeundae, d, '00:00', '23:59'
  from unnest(array['mon','tue','wed','thu','fri','sat','sun']::day_of_week[]) d;

  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_cafe, d, '10:00', '22:00'
  from unnest(array['mon','tue','wed','thu','sun']::day_of_week[]) d;
  insert into public.place_hours (place_id, day, open_time, close_time)
  select v_cafe, d, '10:00', '23:00'
  from unnest(array['fri','sat']::day_of_week[]) d;

  insert into public.place_visit_profile (
    place_id,
    dwell_minutes,
    min_dwell,
    max_dwell,
    parking_needed,
    rain_friendly
  )
  values
    (v_gomjangeo,60,40,90,true,true),
    (v_gwangalli,90,30,180,true,false),
    (v_haeundae,90,30,180,true,false),
    (v_cafe,45,20,90,false,true),
    (v_gamcheon,90,60,120,true,false),
    (v_jagalchi,60,30,120,true,true);

  perform public.recalculate_place_quality(v_gomjangeo);
  perform public.recalculate_place_quality(v_gwangalli);
  perform public.recalculate_place_quality(v_haeundae);
  perform public.recalculate_place_quality(v_cafe);
  perform public.recalculate_place_quality(v_gamcheon);
  perform public.recalculate_place_quality(v_jagalchi);

  delete from public.trip_plans
   where user_id = p_user_id
     and title in ('[GS1] Normal day trip', '[GS2] Break-time conflict', '[GS3] Cross-midnight');

  insert into public.trip_plans (
    user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status
  ) values (
    p_user_id, '[GS1] Normal day trip', 'busan', 'car', '2026-05-02T09:00:00+09:00',
    35.1152, 129.0422, 'Busan Station', 'draft'
  ) returning id into v_plan1;

  insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values
    (v_plan1, v_gamcheon, 1, 90),
    (v_plan1, v_gomjangeo, 2, 60),
    (v_plan1, v_haeundae, 3, 90),
    (v_plan1, v_cafe, 4, 45);

  insert into public.trip_plans (
    user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status
  ) values (
    p_user_id, '[GS2] Break-time conflict', 'busan', 'car', '2026-05-02T12:00:00+09:00',
    35.1152, 129.0422, 'Busan Station', 'draft'
  ) returning id into v_plan2;

  insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values
    (v_plan2, v_gamcheon, 1, 90),
    (v_plan2, v_gomjangeo, 2, 60),
    (v_plan2, v_gwangalli, 3, 90),
    (v_plan2, v_cafe, 4, 45);

  insert into public.trip_plans (
    user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status
  ) values (
    p_user_id, '[GS3] Cross-midnight', 'busan', 'car', '2026-05-01T15:00:00+09:00',
    35.1152, 129.0422, 'Busan Station', 'draft'
  ) returning id into v_plan3;

  insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values
    (v_plan3, v_gamcheon, 1, 90),
    (v_plan3, v_gwangalli, 2, 120),
    (v_plan3, v_gomjangeo, 3, 60),
    (v_plan3, v_jagalchi, 4, 60);

  raise notice 'Golden scenarios ready: GS1=% GS2=% GS3=%', v_plan1, v_plan2, v_plan3;
end;
$$;

revoke all on function public.get_shared_itinerary(text) from public;
grant execute on function public.get_shared_itinerary(text) to anon, authenticated, service_role;

revoke all on function public.start_trip_execution(uuid) from public;
revoke all on function public.start_trip_execution(uuid, uuid) from public;
grant execute on function public.start_trip_execution(uuid) to authenticated, service_role;
grant execute on function public.start_trip_execution(uuid, uuid) to authenticated, service_role;

revoke all on function public.import_shared_itinerary(text, timestamptz, transport_mode, numeric, numeric, text) from public;
revoke all on function public.import_shared_itinerary(text, uuid, timestamptz, transport_mode, numeric, numeric, text) from public;
grant execute on function public.import_shared_itinerary(text, timestamptz, transport_mode, numeric, numeric, text) to authenticated, service_role;
grant execute on function public.import_shared_itinerary(text, uuid, timestamptz, transport_mode, numeric, numeric, text) to authenticated, service_role;

revoke all on function public.seed_golden_scenarios(uuid) from public;
revoke all on function public.ensure_seed_place(text, text, place_category, numeric, numeric, text, text, text[]) from public;
revoke all on function public.recalculate_place_quality(uuid) from public;
revoke all on function public.increment_import_count(uuid) from public;
revoke all on function public.increment_view_count(uuid) from public;
grant execute on function public.seed_golden_scenarios(uuid) to service_role;
grant execute on function public.ensure_seed_place(text, text, place_category, numeric, numeric, text, text, text[]) to service_role;
grant execute on function public.recalculate_place_quality(uuid) to service_role;
grant execute on function public.increment_import_count(uuid) to service_role;
grant execute on function public.increment_view_count(uuid) to service_role;

do $$
begin
  if to_regprocedure('public.reorder_plan_stops(uuid,uuid[])') is not null then
    revoke all on function public.reorder_plan_stops(uuid, uuid[]) from public;
    grant execute on function public.reorder_plan_stops(uuid, uuid[]) to authenticated, service_role;
  end if;

  if to_regprocedure('public.reset_plan_to_draft(uuid)') is not null then
    revoke all on function public.reset_plan_to_draft(uuid) from public;
    grant execute on function public.reset_plan_to_draft(uuid) to authenticated, service_role;
  end if;

  if to_regprocedure('public.remove_plan_stop(uuid,uuid)') is not null then
    revoke all on function public.remove_plan_stop(uuid, uuid) from public;
    grant execute on function public.remove_plan_stop(uuid, uuid) to authenticated, service_role;
  end if;
end $$;

insert into public._schema_migrations (version, description)
values ('0.3.1', 'RPC user identity and link-only share RLS hardening')
on conflict do nothing;
