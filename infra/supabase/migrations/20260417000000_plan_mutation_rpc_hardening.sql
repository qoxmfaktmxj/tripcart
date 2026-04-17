-- ============================================================================
-- Migration: plan mutation RPC hardening
-- date: 2026-04-17
-- purpose:
--   1. Move add stop ordering into a SECURITY DEFINER RPC.
--   2. Lock trip_plans rows while mutating plan or stops.
--   3. Block plan/stop mutation when an active execution exists in the same
--      transaction that performs the mutation.
-- security:
--   All caller identity checks use auth.uid(); no caller-supplied user id is
--   trusted.
-- ============================================================================

alter table public.trip_plans
  drop constraint if exists chk_trip_plans_origin_lat,
  drop constraint if exists chk_trip_plans_origin_lng,
  drop constraint if exists chk_trip_plans_dest_lat,
  drop constraint if exists chk_trip_plans_dest_lng,
  add constraint chk_trip_plans_origin_lat
    check (origin_lat is null or origin_lat between -90 and 90),
  add constraint chk_trip_plans_origin_lng
    check (origin_lng is null or origin_lng between -180 and 180),
  add constraint chk_trip_plans_dest_lat
    check (dest_lat is null or dest_lat between -90 and 90),
  add constraint chk_trip_plans_dest_lng
    check (dest_lng is null or dest_lng between -180 and 180);

alter table public.trip_plan_stops
  drop constraint if exists chk_trip_plan_stops_dwell_minutes,
  add constraint chk_trip_plan_stops_dwell_minutes
    check (dwell_minutes between 1 and 1440);

create or replace function public.update_trip_plan(
  p_plan_id uuid,
  p_patch jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'INVALID_FIELD: patch';
  end if;

  if p_patch ? 'title' then
    if jsonb_typeof(p_patch->'title') <> 'string'
       or length(btrim(p_patch->>'title')) = 0 then
      raise exception 'INVALID_FIELD: title';
    end if;
  end if;

  if p_patch ? 'start_at'
     and jsonb_typeof(p_patch->'start_at') not in ('string', 'null') then
    raise exception 'INVALID_FIELD: start_at';
  end if;

  if p_patch ? 'transport_mode' then
    if jsonb_typeof(p_patch->'transport_mode') <> 'string'
       or (p_patch->>'transport_mode') not in ('car', 'transit', 'walk', 'bicycle') then
      raise exception 'INVALID_FIELD: transport_mode';
    end if;
  end if;

  if p_patch ? 'origin_lat'
     and jsonb_typeof(p_patch->'origin_lat') <> 'null'
     and (
       jsonb_typeof(p_patch->'origin_lat') <> 'number'
       or (p_patch->>'origin_lat')::numeric < -90
       or (p_patch->>'origin_lat')::numeric > 90
     ) then
    raise exception 'INVALID_FIELD: origin_lat';
  end if;

  if p_patch ? 'origin_lng'
     and jsonb_typeof(p_patch->'origin_lng') <> 'null'
     and (
       jsonb_typeof(p_patch->'origin_lng') <> 'number'
       or (p_patch->>'origin_lng')::numeric < -180
       or (p_patch->>'origin_lng')::numeric > 180
     ) then
    raise exception 'INVALID_FIELD: origin_lng';
  end if;

  if p_patch ? 'origin_name'
     and jsonb_typeof(p_patch->'origin_name') not in ('string', 'null') then
    raise exception 'INVALID_FIELD: origin_name';
  end if;

  select user_id
    into v_plan_owner
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

  if exists (
    select 1
    from public.trip_executions
    where plan_id = p_plan_id
      and status = 'active'
  ) then
    raise exception 'PLAN_IN_PROGRESS';
  end if;

  update public.trip_plans
     set title = case when p_patch ? 'title' then p_patch->>'title' else title end,
         start_at = case
           when p_patch ? 'start_at' and jsonb_typeof(p_patch->'start_at') = 'null' then null
           when p_patch ? 'start_at' then (p_patch->>'start_at')::timestamptz
           else start_at
         end,
         transport_mode = case
           when p_patch ? 'transport_mode' then (p_patch->>'transport_mode')::transport_mode
           else transport_mode
         end,
         origin_lat = case
           when p_patch ? 'origin_lat' and jsonb_typeof(p_patch->'origin_lat') = 'null' then null
           when p_patch ? 'origin_lat' then (p_patch->>'origin_lat')::numeric
           else origin_lat
         end,
         origin_lng = case
           when p_patch ? 'origin_lng' and jsonb_typeof(p_patch->'origin_lng') = 'null' then null
           when p_patch ? 'origin_lng' then (p_patch->>'origin_lng')::numeric
           else origin_lng
         end,
         origin_name = case
           when p_patch ? 'origin_name' and jsonb_typeof(p_patch->'origin_name') = 'null' then null
           when p_patch ? 'origin_name' then p_patch->>'origin_name'
           else origin_name
         end,
         status = 'draft',
         version = version + 1,
         updated_at = now()
   where id = p_plan_id
     and deleted_at is null;
end;
$$;

create or replace function public.add_plan_stop(
  p_plan_id uuid,
  p_place_id uuid,
  p_dwell_minutes integer default 60,
  p_locked boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller uuid;
  v_next_order smallint;
  v_stop public.trip_plan_stops%rowtype;
  v_place public.places%rowtype;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_dwell_minutes is null or p_dwell_minutes < 1 or p_dwell_minutes > 1440 then
    raise exception 'INVALID_FIELD: dwell_minutes';
  end if;

  select user_id
    into v_plan_owner
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

  if exists (
    select 1
    from public.trip_executions
    where plan_id = p_plan_id
      and status = 'active'
  ) then
    raise exception 'PLAN_IN_PROGRESS';
  end if;

  select *
    into v_place
  from public.places
  where id = p_place_id
    and deleted_at is null;

  if v_place.id is null then
    raise exception 'PLACE_NOT_FOUND';
  end if;

  select coalesce(max(stop_order), 0) + 1
    into v_next_order
  from public.trip_plan_stops
  where plan_id = p_plan_id;

  insert into public.trip_plan_stops (
    plan_id,
    place_id,
    stop_order,
    dwell_minutes,
    locked,
    locked_position
  )
  values (
    p_plan_id,
    p_place_id,
    v_next_order,
    p_dwell_minutes::smallint,
    coalesce(p_locked, false),
    case when coalesce(p_locked, false) then v_next_order else null end
  )
  returning * into v_stop;

  update public.trip_plans
     set status = 'draft',
         version = version + 1,
         updated_at = now()
   where id = p_plan_id;

  return jsonb_build_object(
    'id', v_stop.id,
    'plan_id', v_stop.plan_id,
    'place_id', v_stop.place_id,
    'stop_order', v_stop.stop_order,
    'locked', v_stop.locked,
    'locked_position', v_stop.locked_position,
    'dwell_minutes', v_stop.dwell_minutes,
    'arrive_at', v_stop.arrive_at,
    'leave_at', v_stop.leave_at,
    'travel_from_prev_minutes', v_stop.travel_from_prev_minutes,
    'travel_from_prev_meters', v_stop.travel_from_prev_meters,
    'warnings', v_stop.warnings,
    'user_note', v_stop.user_note,
    'places', jsonb_build_object(
      'id', v_place.id,
      'name', v_place.name,
      'category', v_place.category,
      'lat', v_place.lat,
      'lng', v_place.lng,
      'region', v_place.region,
      'images', v_place.images
    )
  );
end;
$$;

create or replace function public.update_plan_stop(
  p_plan_id uuid,
  p_stop_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller uuid;
  v_stop public.trip_plan_stops%rowtype;
  v_place public.places%rowtype;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'INVALID_FIELD: patch';
  end if;

  if p_patch ? 'dwell_minutes' then
    if jsonb_typeof(p_patch->'dwell_minutes') <> 'number'
       or (p_patch->>'dwell_minutes')::integer < 1
       or (p_patch->>'dwell_minutes')::integer > 1440 then
      raise exception 'INVALID_FIELD: dwell_minutes';
    end if;
  end if;

  if p_patch ? 'locked' and jsonb_typeof(p_patch->'locked') <> 'boolean' then
    raise exception 'INVALID_FIELD: locked';
  end if;

  if p_patch ? 'user_note'
     and jsonb_typeof(p_patch->'user_note') not in ('string', 'null') then
    raise exception 'INVALID_FIELD: user_note';
  end if;

  select user_id
    into v_plan_owner
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

  if exists (
    select 1
    from public.trip_executions
    where plan_id = p_plan_id
      and status = 'active'
  ) then
    raise exception 'PLAN_IN_PROGRESS';
  end if;

  select *
    into v_stop
  from public.trip_plan_stops
  where id = p_stop_id
    and plan_id = p_plan_id
  for update;

  if v_stop.id is null then
    raise exception 'STOP_NOT_FOUND';
  end if;

  update public.trip_plan_stops
     set dwell_minutes = case
           when p_patch ? 'dwell_minutes' then (p_patch->>'dwell_minutes')::smallint
           else dwell_minutes
         end,
         locked = case
           when p_patch ? 'locked' then (p_patch->>'locked')::boolean
           else locked
         end,
         locked_position = case
           when p_patch ? 'locked' and (p_patch->>'locked')::boolean then stop_order
           when p_patch ? 'locked' then null
           else locked_position
         end,
         user_note = case
           when p_patch ? 'user_note' and jsonb_typeof(p_patch->'user_note') = 'null' then null
           when p_patch ? 'user_note' then p_patch->>'user_note'
           else user_note
         end,
         updated_at = now()
   where id = p_stop_id
     and plan_id = p_plan_id
   returning * into v_stop;

  select *
    into v_place
  from public.places
  where id = v_stop.place_id;

  update public.trip_plans
     set status = 'draft',
         version = version + 1,
         updated_at = now()
   where id = p_plan_id;

  return jsonb_build_object(
    'id', v_stop.id,
    'plan_id', v_stop.plan_id,
    'place_id', v_stop.place_id,
    'stop_order', v_stop.stop_order,
    'locked', v_stop.locked,
    'locked_position', v_stop.locked_position,
    'dwell_minutes', v_stop.dwell_minutes,
    'arrive_at', v_stop.arrive_at,
    'leave_at', v_stop.leave_at,
    'travel_from_prev_minutes', v_stop.travel_from_prev_minutes,
    'travel_from_prev_meters', v_stop.travel_from_prev_meters,
    'warnings', v_stop.warnings,
    'user_note', v_stop.user_note,
    'places', jsonb_build_object(
      'id', v_place.id,
      'name', v_place.name,
      'category', v_place.category,
      'lat', v_place.lat,
      'lng', v_place.lng,
      'region', v_place.region,
      'images', v_place.images
    )
  );
end;
$$;

create or replace function public.reset_plan_to_draft(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select user_id
    into v_plan_owner
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

  if exists (
    select 1
    from public.trip_executions
    where plan_id = p_plan_id
      and status = 'active'
  ) then
    raise exception 'PLAN_IN_PROGRESS';
  end if;

  update public.trip_plans
     set status = 'draft',
         version = version + 1,
         updated_at = now()
   where id = p_plan_id
     and deleted_at is null;
end;
$$;

create or replace function public.remove_plan_stop(
  p_plan_id uuid,
  p_stop_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select user_id
    into v_plan_owner
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

  if exists (
    select 1
    from public.trip_executions
    where plan_id = p_plan_id
      and status = 'active'
  ) then
    raise exception 'PLAN_IN_PROGRESS';
  end if;

  delete from public.trip_plan_stops
  where id = p_stop_id
    and plan_id = p_plan_id;

  if not found then
    raise exception 'STOP_NOT_FOUND';
  end if;

  update public.trip_plan_stops
     set stop_order = -stop_order,
         updated_at = now()
   where plan_id = p_plan_id;

  update public.trip_plan_stops tps
     set stop_order = sub.new_order,
         updated_at = now()
    from (
      select id,
             row_number() over (order by stop_order desc) as new_order
      from public.trip_plan_stops
      where plan_id = p_plan_id
    ) sub
   where tps.id = sub.id;

  update public.trip_plans
     set status = 'draft',
         version = version + 1,
         updated_at = now()
   where id = p_plan_id;
end;
$$;

create or replace function public.reorder_plan_stops(
  p_plan_id uuid,
  p_ordered_stop_ids uuid[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller uuid;
  v_existing_ids uuid[];
  v_stop_id uuid;
  v_new_order smallint;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select user_id
    into v_plan_owner
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

  if exists (
    select 1
    from public.trip_executions
    where plan_id = p_plan_id
      and status = 'active'
  ) then
    raise exception 'PLAN_IN_PROGRESS';
  end if;

  select array_agg(id order by stop_order)
    into v_existing_ids
  from public.trip_plan_stops
  where plan_id = p_plan_id;

  if coalesce(array_length(p_ordered_stop_ids, 1), 0) = 0 then
    raise exception 'INVALID_STOP_IDS';
  end if;

  if (select array_agg(x order by x) from unnest(v_existing_ids) x) is distinct from
     (select array_agg(x order by x) from unnest(p_ordered_stop_ids) x) then
    raise exception 'INVALID_STOP_IDS';
  end if;

  for v_stop_id in
    select id from public.trip_plan_stops where plan_id = p_plan_id and locked = true
  loop
    v_new_order := (
      select idx
      from generate_subscripts(p_ordered_stop_ids, 1) idx
      where p_ordered_stop_ids[idx] = v_stop_id
    );

    if (select locked_position from public.trip_plan_stops where id = v_stop_id) is not null
       and v_new_order is distinct from (
         select locked_position from public.trip_plan_stops where id = v_stop_id
       ) then
      raise exception 'LOCKED_POSITION_VIOLATED';
    end if;
  end loop;

  update public.trip_plan_stops
     set stop_order = -(stop_order + 1000)
   where plan_id = p_plan_id;

  for v_new_order in 1..array_length(p_ordered_stop_ids, 1) loop
    update public.trip_plan_stops
       set stop_order = v_new_order,
           updated_at = now()
     where id = p_ordered_stop_ids[v_new_order]
       and plan_id = p_plan_id;
  end loop;

  update public.trip_plans
     set status = 'draft',
         version = version + 1,
         updated_at = now()
   where id = p_plan_id;
end;
$$;

revoke all on function public.update_trip_plan(uuid, jsonb) from public;
revoke all on function public.add_plan_stop(uuid, uuid, integer, boolean) from public;
revoke all on function public.update_plan_stop(uuid, uuid, jsonb) from public;
revoke all on function public.reset_plan_to_draft(uuid) from public;
revoke all on function public.remove_plan_stop(uuid, uuid) from public;
revoke all on function public.reorder_plan_stops(uuid, uuid[]) from public;

grant execute on function public.update_trip_plan(uuid, jsonb) to authenticated, service_role;
grant execute on function public.add_plan_stop(uuid, uuid, integer, boolean) to authenticated, service_role;
grant execute on function public.update_plan_stop(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.reset_plan_to_draft(uuid) to authenticated, service_role;
grant execute on function public.remove_plan_stop(uuid, uuid) to authenticated, service_role;
grant execute on function public.reorder_plan_stops(uuid, uuid[]) to authenticated, service_role;

insert into public._schema_migrations (version, description)
values ('0.3.2', 'Plan mutation RPC hardening with active execution lock checks')
on conflict do nothing;
