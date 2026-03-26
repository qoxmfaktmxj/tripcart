-- reorder_plan_stops: 원자적 stop 순서 변경
-- 전략: 음수 temp order → 최종 order 설정 (UNIQUE 제약 회피)
CREATE OR REPLACE FUNCTION public.reorder_plan_stops(
  p_plan_id uuid,
  p_ordered_stop_ids uuid[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_ids uuid[];
  v_stop_id uuid;
  v_new_order smallint;
BEGIN
  -- 1. 소유권 확인
  SELECT user_id INTO v_user_id FROM trip_plans WHERE id = p_plan_id AND deleted_at IS NULL;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;

  -- 2. 기존 stop id 목록 확인
  SELECT array_agg(id ORDER BY stop_order) INTO v_existing_ids
  FROM trip_plan_stops WHERE plan_id = p_plan_id;

  -- 3. 완전성 검증 (집합이 동일한지)
  IF v_existing_ids IS DISTINCT FROM (SELECT array_agg(x) FROM unnest(p_ordered_stop_ids) x) THEN
    -- 정렬 후 비교
    IF (SELECT array_agg(x ORDER BY x) FROM unnest(v_existing_ids) x) IS DISTINCT FROM
       (SELECT array_agg(x ORDER BY x) FROM unnest(p_ordered_stop_ids) x) THEN
      RAISE EXCEPTION 'INVALID_STOP_IDS';
    END IF;
  END IF;

  -- 4. locked position 검증
  FOR v_stop_id IN
    SELECT id FROM trip_plan_stops WHERE plan_id = p_plan_id AND locked = true
  LOOP
    v_new_order := (SELECT idx FROM generate_subscripts(p_ordered_stop_ids, 1) idx
                    WHERE p_ordered_stop_ids[idx] = v_stop_id);
    -- locked_position이 NULL이면 검증 건너뜀 (방어적)
    IF (SELECT locked_position FROM trip_plan_stops WHERE id = v_stop_id) IS NOT NULL
       AND v_new_order IS DISTINCT FROM (SELECT locked_position FROM trip_plan_stops WHERE id = v_stop_id) THEN
      RAISE EXCEPTION 'LOCKED_POSITION_VIOLATED';
    END IF;
  END LOOP;

  -- 5. Phase 1: 음수 temp order 설정 (UNIQUE 제약 회피)
  UPDATE trip_plan_stops SET stop_order = -(stop_order + 1000) WHERE plan_id = p_plan_id;

  -- 6. 최종 order 설정
  FOR v_new_order IN 1..array_length(p_ordered_stop_ids, 1) LOOP
    UPDATE trip_plan_stops
    SET stop_order = v_new_order, updated_at = now()
    WHERE id = p_ordered_stop_ids[v_new_order] AND plan_id = p_plan_id;
  END LOOP;

  -- 7. plan status → draft, version++
  UPDATE trip_plans
  SET status = 'draft', version = version + 1, updated_at = now()
  WHERE id = p_plan_id;
END;
$$;

-- reset_plan_to_draft: 원자적 status→draft + version++ (race condition 방지)
CREATE OR REPLACE FUNCTION public.reset_plan_to_draft(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 소유권 확인 (SECURITY DEFINER이므로 반드시 필요)
  SELECT user_id INTO v_user_id FROM trip_plans WHERE id = p_plan_id AND deleted_at IS NULL;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;

  UPDATE trip_plans
  SET status = 'draft', version = version + 1, updated_at = now()
  WHERE id = p_plan_id AND deleted_at IS NULL;
END;
$$;
