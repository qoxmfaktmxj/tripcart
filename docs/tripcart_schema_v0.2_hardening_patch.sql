-- ============================================================================
-- TripCart DB Schema v0.2 Hardening Patch
-- applies on top of: tripcart_schema_v0.1.sql + tripcart_schema_v0.2_migration.sql
-- purpose:
--   1. one active execution per plan at DB level
--   2. start_trip_execution race hardening
--   3. idempotent golden scenario seeding
--   4. explicit auth.uid() style on direct-owner tables
-- ============================================================================

-- 1) one active execution per plan
create unique index if not exists uq_active_execution_per_plan
on public.trip_executions(plan_id)
where status = 'active';

comment on index public.uq_active_execution_per_plan is '한 plan 에 active execution 은 하나만 허용';

-- 2) direct-owner RLS style hardening
drop policy if exists "Users: 본인 프로필 조회" on public.users;
create policy "Users: 본인 프로필 조회" on public.users
for select using (auth.uid() is not null and auth.uid() = id);

drop policy if exists "Users: 본인 프로필 수정" on public.users;
create policy "Users: 본인 프로필 수정" on public.users
for update using (auth.uid() is not null and auth.uid() = id);

drop policy if exists "Corrections: 본인 생성" on public.place_data_corrections;
create policy "Corrections: 본인 생성" on public.place_data_corrections
for insert with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Corrections: 본인 조회" on public.place_data_corrections;
create policy "Corrections: 본인 조회" on public.place_data_corrections
for select using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Saved: 본인만" on public.user_saved_places;
create policy "Saved: 본인만" on public.user_saved_places
for all using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Plans: 본인 조회" on public.trip_plans;
create policy "Plans: 본인 조회" on public.trip_plans
for select using (auth.uid() is not null and auth.uid() = user_id and deleted_at is null);

drop policy if exists "Plans: 본인 생성" on public.trip_plans;
create policy "Plans: 본인 생성" on public.trip_plans
for insert with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Plans: 본인 수정" on public.trip_plans;
create policy "Plans: 본인 수정" on public.trip_plans
for update using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Plans: 본인 삭제" on public.trip_plans;
create policy "Plans: 본인 삭제" on public.trip_plans
for delete using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Executions: 본인만" on public.trip_executions;
create policy "Executions: 본인만" on public.trip_executions
for all using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Shared: 본인 생성" on public.shared_itineraries;
create policy "Shared: 본인 생성" on public.shared_itineraries
for insert with check (auth.uid() is not null and auth.uid() = created_by);

drop policy if exists "Shared: 본인 수정" on public.shared_itineraries;
create policy "Shared: 본인 수정" on public.shared_itineraries
for update using (auth.uid() is not null and auth.uid() = created_by);

drop policy if exists "Imports: 본인 생성" on public.shared_itinerary_imports;
create policy "Imports: 본인 생성" on public.shared_itinerary_imports
for insert with check (auth.uid() is not null and auth.uid() = imported_by);

drop policy if exists "Imports: 본인 조회" on public.shared_itinerary_imports;
create policy "Imports: 본인 조회" on public.shared_itinerary_imports
for select using (auth.uid() is not null and auth.uid() = imported_by);

drop policy if exists "Spends: 본인만" on public.trip_spends;
create policy "Spends: 본인만" on public.trip_spends
for all using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Media: 본인만" on public.media_assets;
create policy "Media: 본인만" on public.media_assets
for all using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Receipts: 본인만" on public.receipt_scans;
create policy "Receipts: 본인만" on public.receipt_scans
for all using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Notif rules: 본인만" on public.notification_rules;
create policy "Notif rules: 본인만" on public.notification_rules
for all using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Push tokens: own" on public.device_push_tokens;
create policy "Push tokens: own" on public.device_push_tokens
for all using (auth.uid() is not null and auth.uid() = user_id);

-- 3) start_trip_execution race-safe wrapper
create or replace function public.start_trip_execution(p_plan_id uuid, p_user_id uuid)
returns uuid as $$
declare
  v_exec_id uuid;
  v_plan_status trip_status;
begin
  select status
    into v_plan_status
  from public.trip_plans
  where id = p_plan_id
    and user_id = p_user_id
    and deleted_at is null;

  if v_plan_status is null then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  if v_plan_status != 'confirmed' then
    raise exception 'PLAN_NOT_CONFIRMED: status is %', v_plan_status;
  end if;

  begin
    insert into public.trip_executions (plan_id, user_id, status)
    values (p_plan_id, p_user_id, 'active')
    returning id into v_exec_id;
  exception
    when unique_violation then
      raise exception 'EXECUTION_ALREADY_ACTIVE';
  end;

  delete from public.trip_execution_stops where execution_id = v_exec_id;

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
$$ language plpgsql security definer;

comment on function public.start_trip_execution(uuid, uuid) is 'active execution uniqueness 를 DB 인덱스로 보장하는 실행 시작 함수';

-- 4) helper for idempotent seed place upsert
create or replace function public.ensure_seed_place(
  p_seed_key text,
  p_name text,
  p_category place_category,
  p_lat numeric,
  p_lng numeric,
  p_address text,
  p_region text,
  p_tags text[]
)
returns uuid as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.places
  where naver_place_id = p_seed_key
    and deleted_at is null
  limit 1;

  if v_id is null then
    insert into public.places (
      name, category, lat, lng, address, region, tags, naver_place_id, data_quality_score
    )
    values (
      p_name, p_category, p_lat, p_lng, p_address, p_region, p_tags, p_seed_key, 0
    )
    returning id into v_id;
  else
    update public.places
       set name = p_name,
           category = p_category,
           lat = p_lat,
           lng = p_lng,
           address = p_address,
           region = p_region,
           tags = p_tags,
           updated_at = now()
     where id = v_id;
  end if;

  return v_id;
end;
$$ language plpgsql security definer;

comment on function public.ensure_seed_place(text, text, place_category, numeric, numeric, text, text, text[]) is 'Golden scenario 시드 장소를 안정적으로 upsert';

-- 5) idempotent golden scenarios
create or replace function public.seed_golden_scenarios(p_user_id uuid)
returns void as $$
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
  -- shared seed places (stable keys)
  v_gomjangeo := public.ensure_seed_place(
    'seed:gs:gomjangeo',
    '해운대곰장어',
    'restaurant',
    35.1585961,
    129.1601750,
    '부산 해운대구 중동',
    'busan',
    array['맛집','해물']
  );

  v_gwangalli := public.ensure_seed_place(
    'seed:gs:gwangalli',
    '광안리해변',
    'attraction',
    35.1531696,
    129.1186028,
    '부산 수영구',
    'busan',
    array['뷰맛집','야경']
  );

  v_haeundae := public.ensure_seed_place(
    'seed:gs:haeundae',
    '해운대해수욕장',
    'attraction',
    35.1587203,
    129.1604355,
    '부산 해운대구',
    'busan',
    array['해변','산책']
  );

  v_cafe := public.ensure_seed_place(
    'seed:gs:momos',
    '모모스커피 전포',
    'cafe',
    35.1554730,
    129.0640850,
    '부산 부산진구',
    'busan',
    array['카페','디저트']
  );

  v_gamcheon := public.ensure_seed_place(
    'seed:gs:gamcheon',
    '감천문화마을',
    'attraction',
    35.0975144,
    129.0107697,
    '부산 사하구',
    'busan',
    array['관광지','포토존']
  );

  v_jagalchi := public.ensure_seed_place(
    'seed:gs:jagalchi',
    '자갈치시장',
    'restaurant',
    35.0966168,
    129.0305056,
    '부산 중구',
    'busan',
    array['맛집','시장']
  );

  -- reset dependent data for seed places only
  delete from public.place_break_windows
   where place_id in (v_gomjangeo, v_gwangalli, v_haeundae, v_cafe, v_gamcheon, v_jagalchi);

  delete from public.place_hours
   where place_id in (v_gomjangeo, v_gwangalli, v_haeundae, v_cafe, v_gamcheon, v_jagalchi);

  delete from public.place_visit_profile
   where place_id in (v_gomjangeo, v_gwangalli, v_haeundae, v_cafe, v_gamcheon, v_jagalchi);

  -- hours and break windows
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
    place_id, dwell_minutes, min_dwell, max_dwell, parking_needed, rain_friendly
  ) values
    (v_gomjangeo,60,40,90,true,true),
    (v_gwangalli,90,30,180,true,false),
    (v_haeundae,90,30,180,true,false),
    (v_cafe,45,20,90,false,true),
    (v_gamcheon,90,60,120,true,false),
    (v_jagalchi,60,30,120,true,true);

  perform recalculate_place_quality(v_gomjangeo);
  perform recalculate_place_quality(v_gwangalli);
  perform recalculate_place_quality(v_haeundae);
  perform recalculate_place_quality(v_cafe);
  perform recalculate_place_quality(v_gamcheon);
  perform recalculate_place_quality(v_jagalchi);

  -- reset only this user's existing GS plans
  delete from public.trip_plans
   where user_id = p_user_id
     and title in ('[GS1] 정상 당일치기', '[GS2] BT 충돌', '[GS3] 자정 넘김');

  insert into public.trip_plans (
    user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status
  ) values (
    p_user_id, '[GS1] 정상 당일치기', 'busan', 'car', '2026-05-02T09:00:00+09:00',
    35.1152, 129.0422, '부산역', 'draft'
  ) returning id into v_plan1;

  insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values
    (v_plan1, v_gamcheon, 1, 90),
    (v_plan1, v_gomjangeo, 2, 60),
    (v_plan1, v_haeundae, 3, 90),
    (v_plan1, v_cafe, 4, 45);

  insert into public.trip_plans (
    user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status
  ) values (
    p_user_id, '[GS2] BT 충돌', 'busan', 'car', '2026-05-02T12:00:00+09:00',
    35.1152, 129.0422, '부산역', 'draft'
  ) returning id into v_plan2;

  insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values
    (v_plan2, v_gamcheon, 1, 90),
    (v_plan2, v_gomjangeo, 2, 60),
    (v_plan2, v_gwangalli, 3, 90),
    (v_plan2, v_cafe, 4, 45);

  insert into public.trip_plans (
    user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status
  ) values (
    p_user_id, '[GS3] 자정 넘김', 'busan', 'car', '2026-05-01T15:00:00+09:00',
    35.1152, 129.0422, '부산역', 'draft'
  ) returning id into v_plan3;

  insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values
    (v_plan3, v_gamcheon, 1, 90),
    (v_plan3, v_gwangalli, 2, 120),
    (v_plan3, v_gomjangeo, 3, 60),
    (v_plan3, v_jagalchi, 4, 60);

  raise notice 'Golden scenarios ready: GS1=% GS2=% GS3=%', v_plan1, v_plan2, v_plan3;
end;
$$ language plpgsql security definer;

comment on function public.seed_golden_scenarios(uuid) is '재실행 가능한 golden scenario 시드';

-- 6) schema version mark
insert into public._schema_migrations (version, description)
values ('0.3.0', 'Hardening: unique active execution, explicit RLS style, idempotent golden seed')
on conflict do nothing;

