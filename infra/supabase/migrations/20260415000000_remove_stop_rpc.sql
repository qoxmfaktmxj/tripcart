-- ============================================================================
-- Migration: remove_plan_stop RPC
-- date: 2026-04-15
-- purpose: Atomic stop removal with stop_order renumbering
--          Replaces row-by-row update pattern in plan-stops.ts
-- security: uses auth.uid() internally — no p_user_id parameter to prevent
--           spoofing by authenticated users calling the RPC directly
-- ============================================================================

create or replace function public.remove_plan_stop(
  p_plan_id   uuid,
  p_stop_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_owner uuid;
  v_caller     uuid;
begin
  -- 0. 호출자 신원은 auth.uid()로만 확인 (p_user_id 파라미터 신뢰 금지)
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  -- 1. 소유권 확인
  select user_id into v_plan_owner
  from trip_plans
  where id = p_plan_id and deleted_at is null;

  if v_plan_owner is null then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  if v_plan_owner <> v_caller then
    raise exception 'NOT_OWNER';
  end if;

  -- 2. stop 삭제
  delete from trip_plan_stops
  where id = p_stop_id and plan_id = p_plan_id;

  if not found then
    raise exception 'STOP_NOT_FOUND';
  end if;

  -- 3. 남은 stop_order 재정렬 (gap 없애기)
  --    UNIQUE 제약(plan_id, stop_order) 충돌 방지:
  --    Step A — 임시 음수 order로 먼저 이동 (충돌 회피)
  --    Step B — 최종 order로 설정
  update trip_plan_stops
  set stop_order = -(stop_order + 10000),
      updated_at = now()
  where plan_id = p_plan_id;

  update trip_plan_stops tps
  set stop_order = sub.new_order,
      updated_at = now()
  from (
    select id,
           row_number() over (order by stop_order asc) as new_order
    from trip_plan_stops
    where plan_id = p_plan_id
  ) sub
  where tps.id = sub.id;

  -- 4. plan을 draft로 되돌리기 + version increment
  update trip_plans
  set status     = 'draft',
      version    = version + 1,
      updated_at = now()
  where id = p_plan_id;
end;
$$;

-- RPC 실행 권한 부여 (authenticated 사용자만)
revoke all on function public.remove_plan_stop(uuid, uuid) from public;
grant execute on function public.remove_plan_stop(uuid, uuid) to authenticated;
