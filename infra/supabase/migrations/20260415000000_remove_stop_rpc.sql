-- ============================================================================
-- Migration: remove_plan_stop RPC
-- date: 2026-04-15
-- purpose: Atomic stop removal with stop_order renumbering
--          Replaces row-by-row update pattern in plan-stops.ts
-- ============================================================================

create or replace function public.remove_plan_stop(
  p_plan_id   uuid,
  p_stop_id   uuid,
  p_user_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
begin
  -- 1. 소유권 확인
  select user_id into v_plan_owner
  from trip_plans
  where id = p_plan_id and deleted_at is null;

  if v_plan_owner is null then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  if v_plan_owner <> p_user_id then
    raise exception 'NOT_OWNER';
  end if;

  -- 2. stop 삭제
  delete from trip_plan_stops
  where id = p_stop_id and plan_id = p_plan_id;

  if not found then
    raise exception 'STOP_NOT_FOUND';
  end if;

  -- 3. 남은 stop_order 재정렬 (gap 없애기)
  with ordered as (
    select id, row_number() over (order by stop_order asc) as new_order
    from trip_plan_stops
    where plan_id = p_plan_id
  )
  update trip_plan_stops tps
  set stop_order = o.new_order,
      updated_at = now()
  from ordered o
  where tps.id = o.id;

  -- 4. plan을 draft로 되돌리기 + version increment
  update trip_plans
  set status    = 'draft',
      version   = version + 1,
      updated_at = now()
  where id = p_plan_id;
end;
$$;

-- RPC 실행 권한 부여 (authenticated 사용자만)
revoke all on function public.remove_plan_stop(uuid, uuid, uuid) from public;
grant execute on function public.remove_plan_stop(uuid, uuid, uuid) to authenticated;
