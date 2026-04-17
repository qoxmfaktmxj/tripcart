-- ============================================================================
-- TripCart DB Schema Canonical v0.3
-- date: 2026-03-24
-- environment: PostgreSQL 17+ / Supabase
--
-- usage:
--   fresh environment -> run this file once
--   existing v0.1/v0.2 environment -> use tripcart_schema_v0.2_hardening_patch.sql instead
--
-- note:
--   this canonical file supersedes older v0.1 / v0.2 split files for new development.
-- ============================================================================


-- ============================================================================
-- TripCart DB Schema v0.1
-- PostgreSQL 17+ / Supabase
-- 
-- 설계 원칙:
--   1. Plan(계획)과 Execution(실행)을 분리한다
--   2. 영업정보는 문자열이 아니라 구조화된 시간 데이터로 저장한다
--   3. 공유본은 snapshot/version 개념을 가진다
--   4. route_matrix_cache로 API 비용을 통제한다
--   5. 모든 테이블에 RLS를 적용한다
--   6. soft delete 패턴(deleted_at)을 사용한다
--
-- 의존 관계 순서:
--   enums → extensions → users → places → place_* → trips → shares → records → ai
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

create extension if not exists "uuid-ossp";      -- uuid_generate_v4()
create extension if not exists "pgcrypto";        -- gen_random_bytes (share codes)
create extension if not exists "btree_gist";      -- exclude constraints on ranges
create extension if not exists "pg_trgm";         -- trigram index for search

-- ============================================================================
-- 1. CUSTOM TYPES (ENUMS)
-- ============================================================================

-- 장소 카테고리
create type place_category as enum (
  'restaurant',       -- 식당
  'cafe',             -- 카페
  'attraction',       -- 관광지
  'accommodation',    -- 숙박
  'activity',         -- 액티비티
  'shopping',         -- 쇼핑
  'other'             -- 기타
);

-- 요일
create type day_of_week as enum (
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
);

-- 장소 예외 타입
create type place_exception_type as enum (
  'closed',           -- 임시휴무
  'special_hours'     -- 특별 영업시간
);

-- 이동수단
create type transport_mode as enum (
  'car',              -- 자동차
  'transit',          -- 대중교통
  'walk',             -- 도보
  'bicycle'           -- 자전거
);

-- 여행 계획 상태
create type trip_status as enum (
  'draft',            -- 장바구니 단계
  'optimized',        -- 최적화 완료
  'confirmed',        -- 사용자 확정
  'in_progress',      -- 여행 중
  'completed',        -- 완료
  'cancelled'         -- 취소
);

-- 실행 상태
create type execution_status as enum (
  'active',           -- 진행 중
  'paused',           -- 일시 중지
  'completed',        -- 완료
  'abandoned'         -- 중단
);

-- 지출 카테고리
create type spend_category as enum (
  'food',             -- 식비
  'cafe',             -- 카페
  'admission',        -- 입장료
  'transport',        -- 교통
  'shopping',         -- 쇼핑
  'accommodation',    -- 숙박
  'other'             -- 기타
);

-- 공유 가시성
create type share_visibility as enum (
  'public',           -- 누구나 접근 가능
  'link_only',        -- 링크 있는 사람만
  'private'           -- 비공개
);

-- OCR 처리 상태
create type ocr_status as enum (
  'queued',           -- 대기
  'processing',       -- 처리 중
  'parsed',           -- 파싱 완료
  'needs_review',     -- 검토 필요
  'confirmed',        -- 확정
  'failed'            -- 실패
);

-- 알림 타입
create type alert_type as enum (
  'leave_now',        -- 출발 권장
  'break_time_risk',  -- 브레이크타임 위험
  'closing_soon',     -- 마감 임박
  'delay_detected',   -- 지연 감지
  'trip_reminder'     -- 여행 시작일 리마인드
);

-- 알림 우선순위
create type alert_priority as enum (
  'urgent',           -- 긴급 (브레이크타임 직전)
  'normal'            -- 일반
);

-- 데이터 수정 요청 상태
create type correction_status as enum (
  'pending',          -- 대기
  'approved',         -- 승인
  'rejected',         -- 거절
  'auto_applied'      -- 자동 적용
);

-- routing provider
create type route_provider as enum (
  'tmap',
  'naver',
  'kakao'
);

-- ============================================================================
-- 2. USERS
-- ============================================================================

-- Supabase Auth의 auth.users를 참조하는 public 프로필 테이블
-- auth.users.id를 PK로 사용하여 1:1 매핑
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  nickname      text not null default '',
  avatar_url    text,
  provider      text not null default 'email',   -- kakao, google, apple, email
  
  -- 사용자 선호 설정
  preferences   jsonb not null default '{}'::jsonb,
  -- 예: {
  --   "default_transport": "car",
  --   "default_dwell_minutes": 60,
  --   "preferred_tags": ["맛집", "카페"],
  --   "avoid_tags": ["계단많은"],
  --   "home_region": "busan"
  -- }
  
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index idx_users_email on public.users(email) where deleted_at is null;
create index idx_users_provider on public.users(provider);

comment on table public.users is '사용자 프로필. auth.users와 1:1. 소셜 로그인 provider 정보 포함';

-- ============================================================================
-- 3. PLACES (장소 마스터)
-- ============================================================================

create table public.places (
  id            uuid primary key default uuid_generate_v4(),
  
  -- 기본 정보
  name          text not null,
  category      place_category not null,
  
  -- 위치
  lat           numeric(10, 7) not null,          -- 위도 (소수점 7자리 = ~1cm 정밀도)
  lng           numeric(10, 7) not null,          -- 경도
  address       text not null default '',
  road_address  text,                              -- 도로명 주소
  region        text not null,                     -- 지역 코드: busan, gangneung, jeju 등
  
  -- 연락처
  phone         text,
  website       text,
  
  -- 설명
  description   text not null default '',
  
  -- 이미지 (Supabase Storage 경로 배열)
  images        text[] not null default '{}',
  
  -- 태그 (검색/필터용)
  tags          text[] not null default '{}',
  -- 예: ['맛집', '해물', '뷰맛집', '주차가능', '아이동반']
  
  -- 외부 참조 ID (중복 방지)
  tour_api_id   text,                              -- 한국관광공사 TourAPI content_id
  naver_place_id text,                             -- 네이버 플레이스 ID
  kakao_place_id text,                             -- 카카오 장소 ID
  
  -- 메타
  data_quality_score smallint not null default 0,  -- 0~100, 데이터 완성도 점수
  verified_at   timestamptz,                       -- 마지막 검증일
  verified_by   uuid references public.users(id),
  
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- 지역 + 카테고리 복합 인덱스 (가장 빈번한 조회 패턴)
create index idx_places_region_category on public.places(region, category) where deleted_at is null;

-- 좌표 기반 범위 검색용 (bounding box)
create index idx_places_lat on public.places(lat) where deleted_at is null;
create index idx_places_lng on public.places(lng) where deleted_at is null;

-- 텍스트 검색 (pg_trgm)
create index idx_places_name_trgm on public.places using gin(name gin_trgm_ops) where deleted_at is null;

-- 태그 배열 검색
create index idx_places_tags on public.places using gin(tags) where deleted_at is null;

-- 외부 ID 유니크 (null 허용, 존재하면 유일)
create unique index idx_places_tour_api_id on public.places(tour_api_id) where tour_api_id is not null and deleted_at is null;
create unique index idx_places_naver_place_id on public.places(naver_place_id) where naver_place_id is not null and deleted_at is null;

comment on table public.places is '장소 마스터. 식당/관광지/카페/숙박 등. 외부 API ID로 중복 방지';
comment on column public.places.data_quality_score is '0~100. BT/영업시간/체류시간이 모두 검증되면 100';

-- ============================================================================
-- 4. PLACE_HOURS (요일별 영업시간)
-- ============================================================================

create table public.place_hours (
  id            uuid primary key default uuid_generate_v4(),
  place_id      uuid not null references public.places(id) on delete cascade,
  day           day_of_week not null,
  
  is_closed     boolean not null default false,    -- 정기휴무일이면 true
  open_time     time,                               -- null이면 is_closed=true이어야 함
  close_time    time,                               -- 자정 넘김: 다음날 02:00 → '26:00' 대신 별도 처리
  
  -- 자정 넘김 플래그
  -- close_time이 open_time보다 작으면 다음날까지 영업
  -- 예: open_time=18:00, close_time=02:00, crosses_midnight=true
  crosses_midnight boolean not null default false,
  
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  
  -- 한 장소의 한 요일에 하나의 레코드만 존재
  constraint uq_place_hours_place_day unique (place_id, day)
);

create index idx_place_hours_place on public.place_hours(place_id);

comment on table public.place_hours is '요일별 영업시간. is_closed=true면 정기휴무. crosses_midnight로 자정 넘김 처리';

-- ============================================================================
-- 5. PLACE_BREAK_WINDOWS (브레이크타임)
-- ============================================================================

create table public.place_break_windows (
  id            uuid primary key default uuid_generate_v4(),
  place_id      uuid not null references public.places(id) on delete cascade,
  day           day_of_week not null,
  
  break_start   time not null,                     -- 브레이크타임 시작
  break_end     time not null,                     -- 브레이크타임 종료
  last_order    time,                               -- 라스트오더 (break_start 전)
  
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  
  -- 유효성: break_start < break_end
  constraint chk_break_window_order check (break_start < break_end),
  -- 라스트오더가 있다면 break_start 이전이어야 함
  constraint chk_last_order_before_break check (last_order is null or last_order <= break_start)
);

create index idx_place_breaks_place on public.place_break_windows(place_id);

comment on table public.place_break_windows is '브레이크타임. 한 요일에 여러 BT 가능 (점심/저녁 사이 등)';

-- ============================================================================
-- 6. PLACE_EXCEPTIONS (임시휴무/특별영업)
-- ============================================================================

create table public.place_exceptions (
  id              uuid primary key default uuid_generate_v4(),
  place_id        uuid not null references public.places(id) on delete cascade,
  exception_date  date not null,
  exception_type  place_exception_type not null,
  
  -- special_hours인 경우에만 사용
  open_time       time,
  close_time      time,
  
  note            text,                             -- "설 연휴 휴무", "크리스마스 단축영업"
  
  created_at      timestamptz not null default now(),
  
  -- 같은 날 같은 타입은 하나만
  constraint uq_place_exception unique (place_id, exception_date, exception_type)
);

create index idx_place_exceptions_date on public.place_exceptions(exception_date);
create index idx_place_exceptions_place on public.place_exceptions(place_id);

comment on table public.place_exceptions is '임시휴무/공휴일 예외. 엔진이 특정 날짜 일정 생성 시 이 테이블을 먼저 확인';

-- ============================================================================
-- 7. PLACE_VISIT_PROFILE (방문 프로필)
-- ============================================================================

create table public.place_visit_profile (
  id              uuid primary key default uuid_generate_v4(),
  place_id        uuid not null references public.places(id) on delete cascade,
  
  dwell_minutes   smallint not null default 60,     -- 권장 체류시간 (분)
  min_dwell       smallint not null default 30,     -- 최소 체류시간
  max_dwell       smallint not null default 120,    -- 최대 체류시간
  
  parking_needed  boolean not null default false,   -- 주차 필요 여부
  parking_note    text,                              -- "공영주차장 도보 5분"
  
  rain_friendly   boolean not null default true,    -- 비 오는 날 적합
  kid_friendly    boolean,                           -- 아이 동반 적합 (null=정보없음)
  wheelchair_ok   boolean,                           -- 휠체어 접근성
  
  -- 혼잡도 힌트 (나중에 TMAP 혼잡도 데이터 연동)
  peak_hours_note text,                              -- "주말 12시~14시 대기 30분+"
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  
  constraint uq_visit_profile_place unique (place_id)
);

comment on table public.place_visit_profile is '방문 프로필. 체류시간, 주차, 날씨적합, 접근성 정보';

-- ============================================================================
-- 8. PLACE_DATA_CORRECTIONS (사용자 데이터 수정 제보)
-- ============================================================================

create table public.place_data_corrections (
  id              uuid primary key default uuid_generate_v4(),
  place_id        uuid not null references public.places(id) on delete cascade,
  user_id         uuid not null references public.users(id),
  
  field_name      text not null,                    -- 'break_start', 'open_time', 'phone' 등
  old_value       text,
  new_value       text not null,
  reason          text,                              -- 제보 사유
  
  status          correction_status not null default 'pending',
  reviewed_by     uuid references public.users(id),
  reviewed_at     timestamptz,
  
  created_at      timestamptz not null default now()
);

create index idx_corrections_place on public.place_data_corrections(place_id);
create index idx_corrections_status on public.place_data_corrections(status) where status = 'pending';

comment on table public.place_data_corrections is '사용자 데이터 제보. 관리자 검토 후 반영. 자주 제보되는 장소는 우선 검증 대상';

-- ============================================================================
-- 9. USER_SAVED_PLACES (즐겨찾기 / 장바구니 후보)
-- ============================================================================

create table public.user_saved_places (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  place_id      uuid not null references public.places(id) on delete cascade,
  
  note          text,                               -- 개인 메모
  
  created_at    timestamptz not null default now(),
  
  constraint uq_user_saved unique (user_id, place_id)
);

create index idx_saved_places_user on public.user_saved_places(user_id);

comment on table public.user_saved_places is '즐겨찾기. 장바구니에 넣기 전 후보 저장용';

-- ============================================================================
-- 10. TRIP_PLANS (여행 계획 - Plan 레이어)
-- ============================================================================

create table public.trip_plans (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  
  title           text not null default '',
  region          text not null,                    -- 지역 코드
  
  -- 시간
  start_at        timestamptz,                      -- 출발 시각 (절대 시각)
  end_at          timestamptz,                      -- 종료 예정 시각
  
  -- 이동수단
  transport_mode  transport_mode not null default 'car',
  
  -- 출발지/도착지 (장소가 아닐 수 있으므로 좌표로)
  origin_lat      numeric(10, 7),
  origin_lng      numeric(10, 7),
  origin_name     text,                              -- "해운대 숙소"
  dest_lat        numeric(10, 7),
  dest_lng        numeric(10, 7),
  dest_name       text,                              -- null이면 출발지로 복귀
  
  -- 상태
  status          trip_status not null default 'draft',
  
  -- 최적화 결과 메타
  optimization_meta jsonb,
  -- 예: {
  --   "total_travel_minutes": 142,
  --   "total_dwell_minutes": 240,
  --   "total_distance_km": 47.3,
  --   "score": 85.2,
  --   "warnings": ["브레이크타임 근접: 해운대회센터"],
  --   "alternatives_count": 3,
  --   "optimized_at": "2026-05-02T09:30:00+09:00",
  --   "optimizer_version": "0.1.0",
  --   "stop_cap_applied": false
  -- }
  
  -- 버전 관리 (공유 시 snapshot용)
  version         integer not null default 1,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_trip_plans_user on public.trip_plans(user_id) where deleted_at is null;
create index idx_trip_plans_status on public.trip_plans(status) where deleted_at is null;
create index idx_trip_plans_region on public.trip_plans(region) where deleted_at is null;

comment on table public.trip_plans is '여행 계획 (Plan 레이어). 최적화 전 draft부터 confirmed까지의 상태 전이';

-- ============================================================================
-- 11. TRIP_PLAN_STOPS (계획 경유지)
-- ============================================================================

create table public.trip_plan_stops (
  id              uuid primary key default uuid_generate_v4(),
  plan_id         uuid not null references public.trip_plans(id) on delete cascade,
  place_id        uuid not null references public.places(id),
  
  -- 순서 (최적화 결과)
  stop_order      smallint not null,
  
  -- 사용자 잠금 (이 순서를 고정)
  locked          boolean not null default false,
  locked_position smallint,                          -- locked=true일 때 고정 위치
  
  -- 체류 시간 (사용자가 조정 가능, 기본값은 place_visit_profile에서)
  dwell_minutes   smallint not null default 60,
  
  -- 최적화 엔진이 계산한 예상 시각 (절대 시각)
  arrive_at       timestamptz,
  leave_at        timestamptz,
  
  -- 이전 경유지에서의 이동 정보
  travel_from_prev_minutes  smallint,               -- 이전 지점에서 이동 시간
  travel_from_prev_meters   integer,                 -- 이전 지점에서 이동 거리
  
  -- 경고 플래그
  warnings        text[] not null default '{}',
  -- 예: ['break_time_risk', 'closing_soon', 'long_wait']
  
  -- 메모
  user_note       text,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  
  -- 같은 plan 내 순서 유일
  constraint uq_plan_stop_order unique (plan_id, stop_order)
);

create index idx_plan_stops_plan on public.trip_plan_stops(plan_id);

comment on table public.trip_plan_stops is '계획 경유지. stop_order로 방문 순서 관리. locked로 사용자 고정 순서 지원';

-- ============================================================================
-- 12. TRIP_PLAN_ALTERNATIVES (대안 일정안)
-- ============================================================================

create table public.trip_plan_alternatives (
  id              uuid primary key default uuid_generate_v4(),
  plan_id         uuid not null references public.trip_plans(id) on delete cascade,
  
  alternative_index smallint not null,              -- 0=메인, 1=대안1, 2=대안2
  label           text not null default '',          -- "이동 최소", "여유 코스", "맛집 우선"
  
  -- 전체 지표
  total_travel_minutes  smallint,
  total_dwell_minutes   smallint,
  total_distance_meters integer,
  score                 numeric(6, 2),
  warning_count         smallint not null default 0,
  
  -- 경유지 순서 (stop_id 배열 - 같은 plan의 stop을 재배열)
  stop_order_ids  uuid[] not null default '{}',
  
  -- 각 stop의 arrive_at/leave_at 스냅샷
  schedule_snapshot jsonb not null default '[]'::jsonb,
  -- 예: [
  --   {"stop_id": "...", "arrive_at": "...", "leave_at": "...", "warnings": []}
  -- ]
  
  selected        boolean not null default false,   -- 사용자가 선택한 안
  
  created_at      timestamptz not null default now(),
  
  constraint uq_plan_alt unique (plan_id, alternative_index)
);

create index idx_plan_alts_plan on public.trip_plan_alternatives(plan_id);

comment on table public.trip_plan_alternatives is '최적화 결과 1~3안. 사용자가 하나를 선택하면 selected=true';

-- ============================================================================
-- 13. TRIP_EXECUTIONS (실행 레이어)
-- ============================================================================

create table public.trip_executions (
  id              uuid primary key default uuid_generate_v4(),
  plan_id         uuid not null references public.trip_plans(id),
  user_id         uuid not null references public.users(id) on delete cascade,
  
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  
  status          execution_status not null default 'active',
  
  -- 지연 추적
  delay_minutes   smallint not null default 0,      -- 현재 누적 지연
  last_reopt_at   timestamptz,                       -- 마지막 재최적화 시각
  reopt_count     smallint not null default 0,
  
  -- 실행 요약 (완료 후 계산)
  summary         jsonb,
  -- 예: {
  --   "planned_stops": 6,
  --   "visited_stops": 5,
  --   "skipped_stops": 1,
  --   "total_spend": 87000,
  --   "actual_travel_minutes": 155,
  --   "planned_travel_minutes": 142
  -- }
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_executions_user on public.trip_executions(user_id);
create index idx_executions_plan on public.trip_executions(plan_id);
create index idx_executions_status on public.trip_executions(status) where status = 'active';

comment on table public.trip_executions is '여행 실행본. Plan을 복제하여 생성. 실제 방문/지출/사진이 여기에 연결됨';

-- ============================================================================
-- 14. TRIP_EXECUTION_STOPS (실행 경유지)
-- ============================================================================

create table public.trip_execution_stops (
  id                uuid primary key default uuid_generate_v4(),
  execution_id      uuid not null references public.trip_executions(id) on delete cascade,
  place_id          uuid not null references public.places(id),
  plan_stop_id      uuid references public.trip_plan_stops(id), -- 원본 plan stop (null이면 즉석 추가)
  
  stop_order        smallint not null,
  
  -- 실제 시각
  arrive_at         timestamptz,
  leave_at          timestamptz,
  
  -- 건너뜀
  skipped           boolean not null default false,
  skip_reason       text,                            -- "시간 부족", "휴무"
  
  -- 즉석 추가 여부
  is_adhoc          boolean not null default false,
  
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_exec_stops_execution on public.trip_execution_stops(execution_id);

comment on table public.trip_execution_stops is '실행 경유지. plan_stop_id로 원본 계획과 연결. is_adhoc으로 즉석 추가 구분';

-- ============================================================================
-- 15. SHARED_ITINERARIES (공유 일정)
-- ============================================================================

create table public.shared_itineraries (
  id                uuid primary key default uuid_generate_v4(),
  source_plan_id    uuid not null references public.trip_plans(id),
  created_by        uuid not null references public.users(id),
  
  -- 공유 코드 (URL: /trip/{share_code})
  share_code        text not null default encode(gen_random_bytes(6), 'hex'),
  
  visibility        share_visibility not null default 'link_only',
  
  -- 원본 plan의 버전 (수정되어도 공유 시점 스냅샷)
  source_plan_version integer not null default 1,
  
  -- 공유용 상대 시간 데이터 (날짜 독립적)
  -- D1+0분, D1+90분 같은 상대 오프셋 구조
  relative_stops    jsonb not null default '[]'::jsonb,
  -- 예: [
  --   {
  --     "place_id": "...",
  --     "day_index": 1,
  --     "offset_minutes": 0,
  --     "dwell_minutes": 60,
  --     "order": 1
  --   }
  -- ]
  
  -- 메타
  title             text not null default '',
  description       text,
  region            text not null,
  transport_mode    transport_mode not null default 'car',
  total_stops       smallint not null default 0,
  estimated_hours   numeric(4, 1),
  cover_image_url   text,
  
  -- 통계
  import_count      integer not null default 0,
  view_count        integer not null default 0,
  
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create unique index idx_shared_code on public.shared_itineraries(share_code) where deleted_at is null;
create index idx_shared_user on public.shared_itineraries(created_by) where deleted_at is null;
create index idx_shared_region on public.shared_itineraries(region) where deleted_at is null;

comment on table public.shared_itineraries is '공유 일정. relative_stops로 날짜 독립적 코스 저장. share_code로 URL 공유';

-- ============================================================================
-- 16. SHARED_ITINERARY_IMPORTS (공유 일정 가져오기)
-- ============================================================================

create table public.shared_itinerary_imports (
  id                uuid primary key default uuid_generate_v4(),
  shared_id         uuid not null references public.shared_itineraries(id),
  imported_by       uuid not null references public.users(id) on delete cascade,
  
  -- 가져오기 결과
  result_plan_id    uuid references public.trip_plans(id),   -- 복제된 plan
  
  scheduled_start_at timestamptz,                   -- 사용자가 지정한 시작 시각
  reoptimized       boolean not null default false,  -- 재최적화 여부
  
  imported_at       timestamptz not null default now()
);

create index idx_imports_shared on public.shared_itinerary_imports(shared_id);
create index idx_imports_user on public.shared_itinerary_imports(imported_by);

comment on table public.shared_itinerary_imports is '공유 일정 가져오기 기록. 원본은 수정 안 됨 (snapshot 원칙)';

-- ============================================================================
-- 17. ROUTE_MATRIX_CACHE (이동시간 캐시)
-- ============================================================================

create table public.route_matrix_cache (
  id              uuid primary key default uuid_generate_v4(),
  
  -- 키 조합
  origin_place_id uuid not null references public.places(id),
  dest_place_id   uuid not null references public.places(id),
  transport_mode  transport_mode not null,
  provider        route_provider not null,
  
  -- 시간대 (같은 구간도 출퇴근 시간대와 비수기가 다름)
  -- 'morning', 'afternoon', 'evening', 'night', 'rush_hour'
  timeband        text not null default 'default',
  
  -- 유효 날짜 범위
  valid_date      date not null default current_date,
  
  -- 결과
  duration_seconds integer not null,
  distance_meters  integer not null,
  
  -- 메타
  raw_response    jsonb,                             -- API 원본 응답 (디버깅용)
  
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '7 days'),
  
  -- 같은 구간/모드/시간대에 대해 하나의 캐시만
  constraint uq_route_cache unique (origin_place_id, dest_place_id, transport_mode, provider, timeband, valid_date)
);

create index idx_route_cache_origin on public.route_matrix_cache(origin_place_id);
create index idx_route_cache_expires on public.route_matrix_cache(expires_at);

comment on table public.route_matrix_cache is '이동시간 캐시. API 비용 절감 핵심. 7일 만료 기본. timeband로 시간대별 구분';

-- 만료된 캐시 자동 삭제 함수 (Supabase cron으로 매일 실행)
create or replace function cleanup_expired_route_cache()
returns void as $$
begin
  delete from public.route_matrix_cache where expires_at < now();
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 18. TRIP_SPENDS (지출 기록)
-- ============================================================================

create table public.trip_spends (
  id              uuid primary key default uuid_generate_v4(),
  execution_id    uuid not null references public.trip_executions(id) on delete cascade,
  exec_stop_id    uuid references public.trip_execution_stops(id),
  place_id        uuid references public.places(id),
  user_id         uuid not null references public.users(id),
  
  amount          integer not null,                  -- 원 단위 (소수점 불필요)
  category        spend_category not null default 'food',
  
  spent_at        timestamptz not null default now(),
  note            text,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_spends_execution on public.trip_spends(execution_id) where deleted_at is null;
create index idx_spends_user on public.trip_spends(user_id) where deleted_at is null;
create index idx_spends_user_month on public.trip_spends(user_id, spent_at) where deleted_at is null;

comment on table public.trip_spends is '지출 기록. 원 단위 integer. 월별/카테고리별 집계의 기반';

-- ============================================================================
-- 19. TRIP_SPEND_ITEMS (지출 항목 - 메뉴 라인)
-- ============================================================================

create table public.trip_spend_items (
  id              uuid primary key default uuid_generate_v4(),
  spend_id        uuid not null references public.trip_spends(id) on delete cascade,
  
  menu_name       text not null,
  quantity        smallint not null default 1,
  unit_price      integer,                           -- 원 단위 (null이면 총액만 기록)
  
  created_at      timestamptz not null default now()
);

create index idx_spend_items_spend on public.trip_spend_items(spend_id);

comment on table public.trip_spend_items is '지출 상세. 메뉴명/수량/단가. 자동완성은 이 테이블의 menu_name 집계로 구현';

-- ============================================================================
-- 20. MEDIA_ASSETS (사진/미디어)
-- ============================================================================

create table public.media_assets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  
  -- 연결 대상
  exec_stop_id    uuid references public.trip_execution_stops(id),
  spend_id        uuid references public.trip_spends(id),
  
  -- Supabase Storage
  storage_bucket  text not null default 'media',
  storage_path    text not null,                     -- 'users/{user_id}/trips/{exec_id}/{filename}'
  
  -- 메타
  mime_type       text not null,
  file_size_bytes integer,
  width           smallint,
  height          smallint,
  caption         text,
  
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_media_user on public.media_assets(user_id) where deleted_at is null;
create index idx_media_exec_stop on public.media_assets(exec_stop_id) where deleted_at is null;

comment on table public.media_assets is '사진/미디어. Supabase Storage 경로 참조. RLS로 소유자만 접근';

-- ============================================================================
-- 21. RECEIPT_SCANS (영수증 OCR - V2)
-- ============================================================================

create table public.receipt_scans (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  trip_execution_id   uuid references public.trip_executions(id),
  
  -- 이미지
  image_asset_id      uuid not null references public.media_assets(id),
  
  -- 매칭된 장소 (OCR 결과에서 추론)
  place_id            uuid references public.places(id),
  
  -- 처리 상태
  ocr_status          ocr_status not null default 'queued',
  
  -- OCR 결과
  raw_text            text,                          -- OCR 추출 원본 텍스트
  structured_draft    jsonb,                         -- AI가 생성한 구조화 초안
  -- 예: {
  --   "place_name_guess": "해운대 곰장어",
  --   "total_amount": 45000,
  --   "paid_at": "2026-05-02T13:25:00+09:00",
  --   "items": [
  --     {"name": "곰장어 1인분", "qty": 2, "price": 18000},
  --     {"name": "소주", "qty": 1, "price": 5000}
  --   ],
  --   "confidence": 0.82
  -- }
  
  -- 확정 후 연결
  confirmed_spend_id  uuid references public.trip_spends(id),
  confirmed_at        timestamptz,
  
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_receipt_user on public.receipt_scans(user_id);
create index idx_receipt_status on public.receipt_scans(ocr_status) where ocr_status in ('queued', 'processing');

comment on table public.receipt_scans is '영수증 OCR. AI 초안→사용자 확인→저장. 완전자동저장 금지 원칙';

-- ============================================================================
-- 22. ITINERARY_GAP_SUGGESTIONS (빈틈 채우기 추천 - V2)
-- ============================================================================

create table public.itinerary_gap_suggestions (
  id                uuid primary key default uuid_generate_v4(),
  plan_id           uuid not null references public.trip_plans(id) on delete cascade,
  
  -- 빈틈 위치
  from_stop_id      uuid not null references public.trip_plan_stops(id),
  to_stop_id        uuid not null references public.trip_plan_stops(id),
  gap_minutes       smallint not null,
  
  -- 검색 컨텍스트
  query_context     jsonb not null,
  -- 예: {
  --   "from_lat": 35.158, "from_lng": 129.160,
  --   "to_lat": 35.101, "to_lng": 129.036,
  --   "max_detour_minutes": 15,
  --   "preferred_categories": ["cafe"],
  --   "transport_mode": "car"
  -- }
  
  -- 추천 결과
  suggestions       jsonb not null default '[]'::jsonb,
  -- 예: [
  --   {"place_id": "...", "score": 92.3, "detour_min": 8, "dwell_min": 30},
  --   {"place_id": "...", "score": 87.1, "detour_min": 12, "dwell_min": 25}
  -- ]
  
  -- 사용자 선택
  selected_place_id uuid references public.places(id),
  
  created_at        timestamptz not null default now()
);

create index idx_gap_suggestions_plan on public.itinerary_gap_suggestions(plan_id);

comment on table public.itinerary_gap_suggestions is 'AI 빈틈 채우기. 제약 기반 삽입 추천 결과 저장. 선택 시 일정 재최적화 트리거';

-- ============================================================================
-- 23. NOTIFICATION_RULES (알림 설정)
-- ============================================================================

create table public.notification_rules (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  
  leave_now_enabled       boolean not null default true,
  break_time_risk_enabled boolean not null default true,
  closing_soon_enabled    boolean not null default true,
  delay_reopt_enabled     boolean not null default true,
  trip_reminder_enabled   boolean not null default true,
  
  -- 알림 사전 시간 (분)
  leave_now_advance_min   smallint not null default 10,  -- 출발 10분 전 알림
  
  updated_at              timestamptz not null default now(),
  
  constraint uq_notification_rules_user unique (user_id)
);

comment on table public.notification_rules is '사용자별 알림 on/off 설정. 종류별 개별 제어 가능';

-- ============================================================================
-- 24. SCHEDULED_ALERTS (예약 알림)
-- ============================================================================

create table public.scheduled_alerts (
  id                uuid primary key default uuid_generate_v4(),
  trip_execution_id uuid not null references public.trip_executions(id) on delete cascade,
  stop_id           uuid references public.trip_execution_stops(id),
  
  alert_type        alert_type not null,
  priority          alert_priority not null default 'normal',
  
  -- 예약 시각
  scheduled_at      timestamptz not null,
  
  -- 처리 상태
  sent_at           timestamptz,
  dismissed_at      timestamptz,
  
  -- 알림 내용
  payload           jsonb not null,
  -- 예: {
  --   "title": "지금 출발하세요",
  --   "body": "해운대곰장어까지 24분, 브레이크타임 14:30 전에 도착하려면 지금 출발 권장",
  --   "action": "navigate",
  --   "place_name": "해운대곰장어"
  -- }
  
  created_at        timestamptz not null default now()
);

create index idx_alerts_execution on public.scheduled_alerts(trip_execution_id);
create index idx_alerts_scheduled on public.scheduled_alerts(scheduled_at) where sent_at is null;

comment on table public.scheduled_alerts is '예약 알림. 로컬 알림 우선, 서버 푸시 보강. sent_at으로 발송 추적';

-- ============================================================================
-- 25. VIEWS: 통계 집계
-- ============================================================================

-- 월별 지출 요약 (materialized view 후보)
create or replace view v_monthly_spend_summary as
select
  ts.user_id,
  date_trunc('month', ts.spent_at)::date as month,
  ts.category,
  count(*) as spend_count,
  sum(ts.amount) as total_amount,
  avg(ts.amount)::integer as avg_amount
from public.trip_spends ts
where ts.deleted_at is null
group by ts.user_id, date_trunc('month', ts.spent_at), ts.category;

-- 사용자별 여행 요약
create or replace view v_user_trip_summary as
select
  u.id as user_id,
  count(distinct tp.id) as total_plans,
  count(distinct te.id) as total_executions,
  count(distinct tp.region) as visited_regions,
  max(te.started_at) as last_trip_at
from public.users u
left join public.trip_plans tp on tp.user_id = u.id and tp.deleted_at is null
left join public.trip_executions te on te.user_id = u.id
group by u.id;

-- 장소별 인기도 (추천 랭킹용)
create or replace view v_place_popularity as
select
  p.id as place_id,
  p.name,
  p.region,
  p.category,
  count(distinct tps.plan_id) as plan_count,
  count(distinct tes.execution_id) as visit_count,
  coalesce(avg(ts.amount), 0)::integer as avg_spend,
  count(distinct si.id) as shared_count
from public.places p
left join public.trip_plan_stops tps on tps.place_id = p.id
left join public.trip_execution_stops tes on tes.place_id = p.id and tes.skipped = false
left join public.trip_spends ts on ts.place_id = p.id and ts.deleted_at is null
left join public.shared_itineraries si on si.region = p.region and si.deleted_at is null
where p.deleted_at is null
group by p.id, p.name, p.region, p.category;

-- 자주 입력된 메뉴 (자동완성용)
create or replace view v_popular_menus as
select
  ts.place_id,
  tsi.menu_name,
  count(*) as input_count,
  max(tsi.created_at) as last_input_at
from public.trip_spend_items tsi
join public.trip_spends ts on ts.id = tsi.spend_id and ts.deleted_at is null
where ts.place_id is not null
group by ts.place_id, tsi.menu_name
having count(*) >= 2
order by ts.place_id, count(*) desc;

comment on view v_popular_menus is '장소별 자주 입력된 메뉴. 자동완성 칩 추천의 기반 (2회+ 입력된 것만)';

-- ============================================================================
-- 26. FUNCTIONS
-- ============================================================================

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 모든 updated_at 컬럼이 있는 테이블에 트리거 적용
do $$
declare
  tbl text;
begin
  for tbl in
    select table_name from information_schema.columns
    where column_name = 'updated_at' and table_schema = 'public'
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I for each row execute function update_updated_at()',
      tbl, tbl
    );
  end loop;
end;
$$;

-- 공유 일정 import_count 증가 함수
create or replace function increment_import_count(p_shared_id uuid)
returns void as $$
begin
  update public.shared_itineraries
  set import_count = import_count + 1, updated_at = now()
  where id = p_shared_id;
end;
$$ language plpgsql security definer;

-- 공유 일정 view_count 증가 함수
create or replace function increment_view_count(p_shared_id uuid)
returns void as $$
begin
  update public.shared_itineraries
  set view_count = view_count + 1
  where id = p_shared_id;
end;
$$ language plpgsql security definer;

-- data_quality_score 재계산 함수
create or replace function recalculate_place_quality(p_place_id uuid)
returns smallint as $$
declare
  score smallint := 0;
  has_hours boolean;
  has_breaks boolean;
  has_profile boolean;
  has_images boolean;
begin
  -- 기본 정보 (이름, 주소, 좌표) = 20점
  select true into has_hours from public.places where id = p_place_id and name != '' and address != '';
  if has_hours then score := score + 20; end if;
  
  -- 영업시간 존재 = 25점
  select exists(select 1 from public.place_hours where place_id = p_place_id) into has_hours;
  if has_hours then score := score + 25; end if;
  
  -- 브레이크타임 존재 (식당만 해당) = 20점
  select exists(select 1 from public.place_break_windows where place_id = p_place_id) into has_breaks;
  if has_breaks then score := score + 20; end if;
  
  -- 방문 프로필 존재 = 20점
  select exists(select 1 from public.place_visit_profile where place_id = p_place_id) into has_profile;
  if has_profile then score := score + 20; end if;
  
  -- 이미지 존재 = 15점
  select exists(select 1 from public.places where id = p_place_id and array_length(images, 1) > 0) into has_images;
  if has_images then score := score + 15; end if;
  
  -- 업데이트
  update public.places set data_quality_score = score where id = p_place_id;
  
  return score;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 27. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 모든 테이블에 RLS 활성화
alter table public.users enable row level security;
alter table public.places enable row level security;
alter table public.place_hours enable row level security;
alter table public.place_break_windows enable row level security;
alter table public.place_exceptions enable row level security;
alter table public.place_visit_profile enable row level security;
alter table public.place_data_corrections enable row level security;
alter table public.user_saved_places enable row level security;
alter table public.trip_plans enable row level security;
alter table public.trip_plan_stops enable row level security;
alter table public.trip_plan_alternatives enable row level security;
alter table public.trip_executions enable row level security;
alter table public.trip_execution_stops enable row level security;
alter table public.shared_itineraries enable row level security;
alter table public.shared_itinerary_imports enable row level security;
alter table public.route_matrix_cache enable row level security;
alter table public.trip_spends enable row level security;
alter table public.trip_spend_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.receipt_scans enable row level security;
alter table public.itinerary_gap_suggestions enable row level security;
alter table public.notification_rules enable row level security;
alter table public.scheduled_alerts enable row level security;

-- ── Users ──
create policy "Users: 본인 프로필 조회" on public.users for select using (auth.uid() = id);
create policy "Users: 본인 프로필 수정" on public.users for update using (auth.uid() = id);

-- ── Places (공개 읽기, 관리자만 쓰기) ──
create policy "Places: 누구나 조회" on public.places for select using (deleted_at is null);
create policy "Place hours: 누구나 조회" on public.place_hours for select using (true);
create policy "Place breaks: 누구나 조회" on public.place_break_windows for select using (true);
create policy "Place exceptions: 누구나 조회" on public.place_exceptions for select using (true);
create policy "Place profiles: 누구나 조회" on public.place_visit_profile for select using (true);

-- ── Place corrections ──
create policy "Corrections: 본인 생성" on public.place_data_corrections for insert with check (auth.uid() = user_id);
create policy "Corrections: 본인 조회" on public.place_data_corrections for select using (auth.uid() = user_id);

-- ── Saved places ──
create policy "Saved: 본인만" on public.user_saved_places for all using (auth.uid() = user_id);

-- ── Trip Plans ──
create policy "Plans: 본인 조회" on public.trip_plans for select using (auth.uid() = user_id and deleted_at is null);
create policy "Plans: 본인 생성" on public.trip_plans for insert with check (auth.uid() = user_id);
create policy "Plans: 본인 수정" on public.trip_plans for update using (auth.uid() = user_id);
create policy "Plans: 본인 삭제" on public.trip_plans for delete using (auth.uid() = user_id);

-- ── Trip Plan Stops ──
create policy "Plan stops: plan 소유자만" on public.trip_plan_stops for all
  using (exists(select 1 from public.trip_plans tp where tp.id = plan_id and tp.user_id = auth.uid()));

-- ── Trip Plan Alternatives ──
create policy "Plan alts: plan 소유자만" on public.trip_plan_alternatives for all
  using (exists(select 1 from public.trip_plans tp where tp.id = plan_id and tp.user_id = auth.uid()));

-- ── Trip Executions ──
create policy "Executions: 본인만" on public.trip_executions for all using (auth.uid() = user_id);

-- ── Execution Stops ──
create policy "Exec stops: execution 소유자만" on public.trip_execution_stops for all
  using (exists(select 1 from public.trip_executions te where te.id = execution_id and te.user_id = auth.uid()));

-- ── Shared Itineraries ──
create policy "Shared: 누구나 public/link_only 조회" on public.shared_itineraries for select
  using (deleted_at is null and visibility in ('public', 'link_only'));
create policy "Shared: 본인 생성" on public.shared_itineraries for insert with check (auth.uid() = created_by);
create policy "Shared: 본인 수정" on public.shared_itineraries for update using (auth.uid() = created_by);

-- ── Shared imports ──
create policy "Imports: 본인 생성" on public.shared_itinerary_imports for insert with check (auth.uid() = imported_by);
create policy "Imports: 본인 조회" on public.shared_itinerary_imports for select using (auth.uid() = imported_by);

-- ── Route cache (서비스 레벨, 모든 인증 사용자 읽기) ──
create policy "Route cache: 인증 사용자 조회" on public.route_matrix_cache for select using (auth.uid() is not null);

-- ── Spends ──
create policy "Spends: 본인만" on public.trip_spends for all using (auth.uid() = user_id);

-- ── Spend items (spend 소유자만) ──
create policy "Spend items: spend 소유자만" on public.trip_spend_items for all
  using (exists(select 1 from public.trip_spends ts where ts.id = spend_id and ts.user_id = auth.uid()));

-- ── Media ──
create policy "Media: 본인만" on public.media_assets for all using (auth.uid() = user_id);

-- ── Receipt scans ──
create policy "Receipts: 본인만" on public.receipt_scans for all using (auth.uid() = user_id);

-- ── Gap suggestions (plan 소유자만) ──
create policy "Gap: plan 소유자만" on public.itinerary_gap_suggestions for all
  using (exists(select 1 from public.trip_plans tp where tp.id = plan_id and tp.user_id = auth.uid()));

-- ── Notification rules ──
create policy "Notif rules: 본인만" on public.notification_rules for all using (auth.uid() = user_id);

-- ── Scheduled alerts (execution 소유자만) ──
create policy "Alerts: execution 소유자만" on public.scheduled_alerts for all
  using (exists(select 1 from public.trip_executions te where te.id = trip_execution_id and te.user_id = auth.uid()));

-- ============================================================================
-- 28. STORAGE POLICIES
-- ============================================================================

-- Supabase Storage 버킷 생성은 대시보드에서 수행
-- 여기서는 RLS 정책만 정의

-- media 버킷: 본인만 업로드/조회
-- insert policy: auth.uid()::text = (storage.foldername(name))[1]
-- select policy: auth.uid()::text = (storage.foldername(name))[1]
-- 경로 규칙: users/{user_id}/trips/{execution_id}/{filename}

-- ============================================================================
-- 29. SEED DATA HELPER
-- ============================================================================

-- 초기 지역 목록 (places.region에 사용)
comment on column public.places.region is '지역 코드. 초기: busan, gangneung, jeju_east, jeju_west, seoul_jongno, seoul_mapo';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- ============================================================================
-- TripCart DB Schema v0.2 — Migration from v0.1
-- PostgreSQL 15+ / Supabase
--
-- 변경 사항:
--   1. users 자동 bootstrap (auth.users → public.users trigger)
--   2. trip_execution_stops에 planned snapshot 필드 추가
--   3. device_push_tokens 테이블 신규
--   4. idempotent migration 구조 (IF NOT EXISTS 패턴)
--   5. golden scenario seed data 함수
--   6. start_trip_execution / import_shared_itinerary 핵심 함수
--
-- 실행 방법: v0.1 먼저 실행 후 이 파일 실행. 재실행해도 안전 (idempotent).
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Users Auto-Bootstrap
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nickname, provider)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do update set email = excluded.email, provider = excluded.provider, updated_at = now();
  insert into public.notification_rules (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is 'auth.users 가입 시 public.users + notification_rules 자동 생성';

-- ============================================================================
-- MIGRATION 2: trip_execution_stops — Planned Snapshot
-- ============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='trip_execution_stops' and column_name='planned_arrive_at') then
    alter table public.trip_execution_stops
      add column planned_arrive_at timestamptz,
      add column planned_leave_at timestamptz,
      add column planned_dwell_minutes smallint,
      add column planned_travel_from_prev_minutes smallint;
  end if;
end $$;

-- ============================================================================
-- MIGRATION 3: device_push_tokens
-- ============================================================================

create table if not exists public.device_push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  push_token text not null,
  platform text not null check (platform in ('ios','android','web')),
  device_name text,
  is_active boolean not null default true,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_push_token unique (push_token)
);
create index if not exists idx_push_tokens_user on public.device_push_tokens(user_id) where is_active=true;
alter table public.device_push_tokens enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='device_push_tokens' and policyname='Push tokens: own') then
    create policy "Push tokens: own" on public.device_push_tokens for all using (auth.uid()=user_id);
  end if;
end $$;

-- ============================================================================
-- MIGRATION 4: scheduled_alerts 보강
-- ============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='scheduled_alerts' and column_name='delivery_method') then
    alter table public.scheduled_alerts
      add column delivery_method text not null default 'local' check (delivery_method in ('local','push','both')),
      add column push_sent_to text[];
  end if;
end $$;

-- ============================================================================
-- MIGRATION 5: start_trip_execution 함수
-- ============================================================================

create or replace function public.start_trip_execution(p_plan_id uuid, p_user_id uuid)
returns uuid as $$
declare v_exec_id uuid; v_plan_status trip_status;
begin
  select status into v_plan_status from public.trip_plans where id=p_plan_id and user_id=p_user_id and deleted_at is null;
  if v_plan_status is null then raise exception 'PLAN_NOT_FOUND'; end if;
  if v_plan_status != 'confirmed' then raise exception 'PLAN_NOT_CONFIRMED: status is %', v_plan_status; end if;
  if exists (select 1 from public.trip_executions where plan_id=p_plan_id and status='active') then raise exception 'EXECUTION_ALREADY_ACTIVE'; end if;

  insert into public.trip_executions (plan_id, user_id, status) values (p_plan_id, p_user_id, 'active') returning id into v_exec_id;

  insert into public.trip_execution_stops (execution_id, place_id, plan_stop_id, stop_order, planned_arrive_at, planned_leave_at, planned_dwell_minutes, planned_travel_from_prev_minutes)
  select v_exec_id, tps.place_id, tps.id, tps.stop_order, tps.arrive_at, tps.leave_at, tps.dwell_minutes, tps.travel_from_prev_minutes
  from public.trip_plan_stops tps where tps.plan_id=p_plan_id order by tps.stop_order;

  update public.trip_plans set status='in_progress', updated_at=now() where id=p_plan_id;
  return v_exec_id;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- MIGRATION 6: import_shared_itinerary 함수
-- ============================================================================

create or replace function public.import_shared_itinerary(p_share_code text, p_user_id uuid, p_start_at timestamptz, p_transport_mode transport_mode default 'car', p_origin_lat numeric default null, p_origin_lng numeric default null, p_origin_name text default null)
returns uuid as $$
declare v_shared record; v_new_plan_id uuid; v_stop record; v_order smallint:=1;
begin
  select * into v_shared from public.shared_itineraries where share_code=p_share_code and deleted_at is null;
  if v_shared is null then raise exception 'SHARED_NOT_FOUND'; end if;
  if v_shared.visibility='private' then raise exception 'SHARED_PRIVATE'; end if;

  insert into public.trip_plans (user_id, title, region, transport_mode, start_at, origin_lat, origin_lng, origin_name, status)
  values (p_user_id, v_shared.title||' (imported)', v_shared.region, p_transport_mode, p_start_at, p_origin_lat, p_origin_lng, p_origin_name, 'draft')
  returning id into v_new_plan_id;

  for v_stop in select * from jsonb_to_recordset(v_shared.relative_stops) as x(place_id uuid, day_index int, offset_minutes int, dwell_minutes int, "order" int) order by "order"
  loop
    insert into public.trip_plan_stops (plan_id, place_id, stop_order, dwell_minutes) values (v_new_plan_id, v_stop.place_id, v_order, coalesce(v_stop.dwell_minutes, 60));
    v_order := v_order + 1;
  end loop;

  insert into public.shared_itinerary_imports (shared_id, imported_by, result_plan_id, scheduled_start_at) values (v_shared.id, p_user_id, v_new_plan_id, p_start_at);
  perform increment_import_count(v_shared.id);
  return v_new_plan_id;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- MIGRATION 7: Golden Scenario Seed Data
-- ============================================================================

create or replace function public.seed_golden_scenarios(p_user_id uuid)
returns void as $$
declare
  v_gomjangeo uuid; v_gwangalli uuid; v_haeundae uuid; v_cafe uuid; v_gamcheon uuid; v_jagalchi uuid;
  v_plan1 uuid; v_plan2 uuid; v_plan3 uuid;
begin
  -- Places
  insert into public.places (id,name,category,lat,lng,address,region,tags) values (uuid_generate_v4(),'해운대곰장어','restaurant',35.1585961,129.1601750,'부산 해운대구 중동','busan','{"맛집","해물"}') returning id into v_gomjangeo;
  insert into public.places (id,name,category,lat,lng,address,region,tags) values (uuid_generate_v4(),'광안리해변','attraction',35.1531696,129.1186028,'부산 수영구','busan','{"뷰맛집","야경"}') returning id into v_gwangalli;
  insert into public.places (id,name,category,lat,lng,address,region,tags) values (uuid_generate_v4(),'해운대해수욕장','attraction',35.1587203,129.1604355,'부산 해운대구','busan','{"해변","산책"}') returning id into v_haeundae;
  insert into public.places (id,name,category,lat,lng,address,region,tags) values (uuid_generate_v4(),'모모스커피 전포','cafe',35.1554730,129.0640850,'부산 부산진구','busan','{"카페","디저트"}') returning id into v_cafe;
  insert into public.places (id,name,category,lat,lng,address,region,tags) values (uuid_generate_v4(),'감천문화마을','attraction',35.0975144,129.0107697,'부산 사하구','busan','{"관광지","포토존"}') returning id into v_gamcheon;
  insert into public.places (id,name,category,lat,lng,address,region,tags) values (uuid_generate_v4(),'자갈치시장','restaurant',35.0966168,129.0305056,'부산 중구','busan','{"맛집","시장"}') returning id into v_jagalchi;

  -- Hours: 곰장어 (BT 14:30-17:00, 일요휴무)
  insert into public.place_hours (place_id,day,open_time,close_time) select v_gomjangeo,d,'11:00','22:00' from unnest(array['mon','tue','wed','thu','fri','sat']::day_of_week[]) d;
  insert into public.place_hours (place_id,day,is_closed) values (v_gomjangeo,'sun',true);
  insert into public.place_break_windows (place_id,day,break_start,break_end,last_order) select v_gomjangeo,d,'14:30','17:00','14:00' from unnest(array['mon','tue','wed','thu','fri']::day_of_week[]) d;
  insert into public.place_break_windows (place_id,day,break_start,break_end,last_order) values (v_gomjangeo,'sat','15:00','17:00','14:30');

  -- Hours: 감천 09:00-17:00
  insert into public.place_hours (place_id,day,open_time,close_time) select v_gamcheon,d,'09:00','17:00' from unnest(array['mon','tue','wed','thu','fri','sat','sun']::day_of_week[]) d;

  -- Hours: 자갈치 (금토 자정넘김 01:00까지)
  insert into public.place_hours (place_id,day,open_time,close_time,crosses_midnight) values (v_jagalchi,'fri','05:00','01:00',true),(v_jagalchi,'sat','05:00','01:00',true);
  insert into public.place_hours (place_id,day,open_time,close_time) select v_jagalchi,d,'05:00','22:00' from unnest(array['mon','tue','wed','thu','sun']::day_of_week[]) d;

  -- Hours: 24h 관광지
  insert into public.place_hours (place_id,day,open_time,close_time) select v_gwangalli,d,'00:00','23:59' from unnest(array['mon','tue','wed','thu','fri','sat','sun']::day_of_week[]) d;
  insert into public.place_hours (place_id,day,open_time,close_time) select v_haeundae,d,'00:00','23:59' from unnest(array['mon','tue','wed','thu','fri','sat','sun']::day_of_week[]) d;

  -- Hours: 카페
  insert into public.place_hours (place_id,day,open_time,close_time) select v_cafe,d,'10:00','22:00' from unnest(array['mon','tue','wed','thu','sun']::day_of_week[]) d;
  insert into public.place_hours (place_id,day,open_time,close_time) select v_cafe,d,'10:00','23:00' from unnest(array['fri','sat']::day_of_week[]) d;

  -- Visit profiles
  insert into public.place_visit_profile (place_id,dwell_minutes,min_dwell,max_dwell,parking_needed,rain_friendly) values
    (v_gomjangeo,60,40,90,true,true),(v_gwangalli,90,30,180,true,false),(v_haeundae,90,30,180,true,false),
    (v_cafe,45,20,90,false,true),(v_gamcheon,90,60,120,true,false),(v_jagalchi,60,30,120,true,true);

  -- Quality scores
  perform recalculate_place_quality(v_gomjangeo); perform recalculate_place_quality(v_gwangalli);
  perform recalculate_place_quality(v_haeundae); perform recalculate_place_quality(v_cafe);
  perform recalculate_place_quality(v_gamcheon); perform recalculate_place_quality(v_jagalchi);

  -- ═══ GS1: 정상 당일치기 (토 09:00, BT 충돌 없음) ═══
  insert into public.trip_plans (id,user_id,title,region,transport_mode,start_at,origin_lat,origin_lng,origin_name,status)
  values (uuid_generate_v4(),p_user_id,'[GS1] 정상 당일치기','busan','car','2026-05-02T09:00:00+09:00',35.1152,129.0422,'부산역','draft')
  returning id into v_plan1;
  insert into public.trip_plan_stops (plan_id,place_id,stop_order,dwell_minutes) values
    (v_plan1,v_gamcheon,1,90),(v_plan1,v_gomjangeo,2,60),(v_plan1,v_haeundae,3,90),(v_plan1,v_cafe,4,45);

  -- ═══ GS2: BT 충돌 (토 12:00, 곰장어 BT 14:30 충돌) ═══
  insert into public.trip_plans (id,user_id,title,region,transport_mode,start_at,origin_lat,origin_lng,origin_name,status)
  values (uuid_generate_v4(),p_user_id,'[GS2] BT 충돌','busan','car','2026-05-02T12:00:00+09:00',35.1152,129.0422,'부산역','draft')
  returning id into v_plan2;
  insert into public.trip_plan_stops (plan_id,place_id,stop_order,dwell_minutes) values
    (v_plan2,v_gamcheon,1,90),(v_plan2,v_gomjangeo,2,60),(v_plan2,v_gwangalli,3,90),(v_plan2,v_cafe,4,45);

  -- ═══ GS3: 자정 넘김 (금 15:00, 자갈치 01:00 영업) ═══
  insert into public.trip_plans (id,user_id,title,region,transport_mode,start_at,origin_lat,origin_lng,origin_name,status)
  values (uuid_generate_v4(),p_user_id,'[GS3] 자정 넘김','busan','car','2026-05-01T15:00:00+09:00',35.1152,129.0422,'부산역','draft')
  returning id into v_plan3;
  insert into public.trip_plan_stops (plan_id,place_id,stop_order,dwell_minutes) values
    (v_plan3,v_gamcheon,1,90),(v_plan3,v_gwangalli,2,120),(v_plan3,v_gomjangeo,3,60),(v_plan3,v_jagalchi,4,60);

  raise notice 'Golden scenarios: GS1=% GS2=% GS3=%', v_plan1, v_plan2, v_plan3;
end;
$$ language plpgsql;

-- ============================================================================
-- MIGRATION 8: Schema version tracking
-- ============================================================================

create table if not exists public._schema_migrations (
  version text primary key, description text not null, applied_at timestamptz not null default now()
);
insert into public._schema_migrations (version,description) values ('0.1.0','Initial schema') on conflict do nothing;
insert into public._schema_migrations (version,description) values ('0.2.0','Users bootstrap, planned snapshot, push tokens, golden scenarios') on conflict do nothing;

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

-- ============================================================================
-- RPC: remove_plan_stop
-- (also in infra/supabase/migrations/20260415000000_remove_stop_rpc.sql)
-- Atomic stop removal + stop_order gap elimination + plan draft reset.
-- Uses auth.uid() internally — no caller-supplied user id accepted.
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
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select user_id into v_plan_owner
  from trip_plans
  where id = p_plan_id and deleted_at is null;

  if v_plan_owner is null then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  if v_plan_owner <> v_caller then
    raise exception 'NOT_OWNER';
  end if;

  delete from trip_plan_stops
  where id = p_stop_id and plan_id = p_plan_id;

  if not found then
    raise exception 'STOP_NOT_FOUND';
  end if;

  -- Two-step renumber to avoid UNIQUE(plan_id, stop_order) mid-update collision
  update trip_plan_stops
  set stop_order = -stop_order, updated_at = now()
  where plan_id = p_plan_id;

  update trip_plan_stops tps
  set stop_order = sub.new_order, updated_at = now()
  from (
    select id, row_number() over (order by stop_order desc) as new_order
    from trip_plan_stops
    where plan_id = p_plan_id
  ) sub
  where tps.id = sub.id;

  update trip_plans
  set status = 'draft', version = version + 1, updated_at = now()
  where id = p_plan_id;
end;
$$;

revoke all on function public.remove_plan_stop(uuid, uuid) from public;
grant execute on function public.remove_plan_stop(uuid, uuid) to authenticated;

-- 6) schema version mark
insert into public._schema_migrations (version, description)
values ('0.3.0', 'Hardening: unique active execution, explicit RLS style, idempotent golden seed')
on conflict do nothing;

-- ============================================================================
-- RPC: reorder_plan_stops / reset_plan_to_draft
-- (also in infra/supabase/migrations/20260326000001_reorder_stops_rpc.sql)
-- Atomic stop ordering and plan draft reset helpers.
-- ============================================================================

create or replace function public.reorder_plan_stops(
  p_plan_id uuid,
  p_ordered_stop_ids uuid[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing_ids uuid[];
  v_stop_id uuid;
  v_new_order smallint;
begin
  select user_id into v_user_id
  from trip_plans
  where id = p_plan_id and deleted_at is null;

  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'NOT_OWNER';
  end if;

  select array_agg(id order by stop_order) into v_existing_ids
  from trip_plan_stops
  where plan_id = p_plan_id;

  if (select array_agg(x order by x) from unnest(v_existing_ids) x) is distinct from
     (select array_agg(x order by x) from unnest(p_ordered_stop_ids) x) then
    raise exception 'INVALID_STOP_IDS';
  end if;

  for v_stop_id in
    select id from trip_plan_stops where plan_id = p_plan_id and locked = true
  loop
    v_new_order := (
      select idx
      from generate_subscripts(p_ordered_stop_ids, 1) idx
      where p_ordered_stop_ids[idx] = v_stop_id
    );

    if (select locked_position from trip_plan_stops where id = v_stop_id) is not null
       and v_new_order is distinct from (
         select locked_position from trip_plan_stops where id = v_stop_id
       ) then
      raise exception 'LOCKED_POSITION_VIOLATED';
    end if;
  end loop;

  update trip_plan_stops
  set stop_order = -(stop_order + 1000)
  where plan_id = p_plan_id;

  for v_new_order in 1..array_length(p_ordered_stop_ids, 1) loop
    update trip_plan_stops
    set stop_order = v_new_order,
        updated_at = now()
    where id = p_ordered_stop_ids[v_new_order]
      and plan_id = p_plan_id;
  end loop;

  update trip_plans
  set status = 'draft',
      version = version + 1,
      updated_at = now()
  where id = p_plan_id;
end;
$$;

create or replace function public.reset_plan_to_draft(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from trip_plans
  where id = p_plan_id and deleted_at is null;

  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'NOT_OWNER';
  end if;

  update trip_plans
  set status = 'draft',
      version = version + 1,
      updated_at = now()
  where id = p_plan_id
    and deleted_at is null;
end;
$$;

-- ============================================================================
-- MIGRATION 9: RPC and shared itinerary security hardening
-- Mirrors infra/supabase/migrations/20260415000001_rpc_share_security_hardening.sql
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

-- ============================================================================
-- MIGRATION 10: Plan mutation RPC hardening
-- Mirrors infra/supabase/migrations/20260417000000_plan_mutation_rpc_hardening.sql
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
