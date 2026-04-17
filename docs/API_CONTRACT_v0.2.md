# TripCart API Contract v0.2
업데이트: 2026-04-17
상태: **Canonical**

## 0. Base URLs

- App API: `https://api.tripcart.kr/v1`
- Optimizer API: `https://opt.tripcart.kr/v1`

> 로컬 개발에서는 reverse proxy 또는 `.env` 로 분리한다.

## 1. 공통 규칙

### 1.1 인증
- 기본 인증: `Authorization: Bearer <supabase_jwt>`
- public preview endpoint 는 예외적으로 anonymous 접근 허용 가능

### 1.2 게스트 트라이얼
- 비로그인 사용자는 공개 탐색에서 장소 담기, 임시 draft plan 조작이 가능하다.
- 게스트 상태는 브라우저 localStorage에서 관리한다.
- 로그인 후 웹 클라이언트가 기존 authenticated endpoint를 순서대로 호출해 계정 데이터로 이관한다.
- 저장 장소 이관은 `POST /me/saved-places`, 초안 플랜 이관은 `POST /plans`를 사용한다.
- 이관은 완전/부분 성공 모두 허용하며, 실패한 항목은 브라우저 guest 상태에 남겨 재시도 가능하게 유지한다.
### 1.3 포맷
- 모든 요청/응답은 JSON
- 시간은 ISO 8601 + timezone 포함
- 통화는 기본 KRW
- pagination 은 cursor 기반

### 1.4 에러 형식
```json
{
  "error": {
    "code": "BREAK_TIME_CONFLICT",
    "message": "브레이크타임에 걸립니다.",
    "details": {}
  }
}
```

### 1.5 공통 응답 메타
필요 시 아래 메타를 함께 반환한다.
```json
{
  "data": {},
  "meta": {
    "cursor": null,
    "has_more": false
  }
}
```

### 1.6 Phase stub 응답
계약은 존재하지만 현재 phase에서 구현 전인 endpoint는 404 대신 HTTP `501`과 표준 error envelope를 반환한다.

```json
{
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Endpoint is documented but not implemented in this phase.",
    "details": {
      "endpoint": "/api/v1/plans/{id}/optimize",
      "method": "POST",
      "phase": "stub"
    }
  }
}
```

현재 App API stub endpoint:

| Method | Endpoint | Phase |
|---|---|---|
| POST | `/plans/:id/optimize` | stub |
| POST | `/executions/:id/reoptimize` | stub |

## 2. 주요 공통 타입

### 2.1 Warning
```json
{
  "type": "break_time_conflict",
  "place_id": "uuid",
  "message": "브레이크타임 15:00-17:00 충돌",
  "severity": "high"
}
```

### 2.2 Place Summary
```json
{
  "id": "uuid",
  "name": "감천문화마을",
  "category": "attraction",
  "lat": 35.0975,
  "lng": 129.0107,
  "region": "busan",
  "thumbnail_url": null
}
```

### 2.3 Plan Stop
```json
{
  "id": "uuid",
  "place_id": "uuid",
  "place": {
    "id": "uuid",
    "name": "해운대곰장어",
    "category": "restaurant",
    "lat": 35.1585,
    "lng": 129.1601
  },
  "stop_order": 2,
  "locked": false,
  "dwell_minutes": 60,
  "arrive_at": "2026-05-02T11:30:00+09:00",
  "leave_at": "2026-05-02T12:30:00+09:00",
  "travel_from_prev_minutes": 30,
  "travel_from_prev_meters": 12400,
  "warnings": []
}
```

## 3. 에러 코드 체계

| Code | 의미 |
|---|---|
| NOT_IMPLEMENTED | 계약은 있으나 현재 phase에서 구현 전 |
| TOKEN_EXPIRED | 인증 토큰 만료 |
| NOT_OWNER | 소유권 없음 |
| PLAN_NOT_FOUND | 계획 없음 |
| PLAN_NOT_CONFIRMED | confirmed 상태가 아님 |
| PLAN_IN_PROGRESS | 여행 중이라 변경 불가 |
| EXECUTION_NOT_FOUND | execution 없음 |
| EXECUTION_ALREADY_ACTIVE | 이미 active execution 존재 |
| INVALID_FIELD | 잘못된 필드값 |
| INVALID_STOP_IDS | stop id 목록 불일치 |
| LOCKED_POSITION_VIOLATED | locked stop 위치 위반 |
| NOT_OPTIMIZED | 최적화가 아직 안 됨 |
| BREAK_TIME_CONFLICT | 브레이크타임 충돌 |
| LAST_ORDER_PASSED | 라스트오더 경과 |
| SHARED_NOT_FOUND | 공유 일정 없음 |
| SHARED_PRIVATE | private 공유 일정 |
| DUPLICATE_TOKEN | 이미 등록된 push token |
| RECEIPT_PARSE_FAILED | OCR/파싱 실패 |
| STORAGE_UPLOAD_FAILED | 업로드 실패 |
| GUEST_MIGRATION_PARTIAL | 일부 게스트 항목 이관 성공 |
| GUEST_MIGRATION_FAILED | 게스트 데이터 이관 실패 |
| DUPLICATE_PLAN_TITLE | 동일 제목 계획 병합 충돌 |

## 4. Places API

### 4.1 `GET /places`
장소 목록 조회.

Query:
- `region`
- `category`
- `q`
- `tags`
- `limit`
- `cursor`

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "모모스커피 전포",
      "category": "cafe",
      "lat": 35.1554,
      "lng": 129.0640,
      "address": "부산 부산진구 ...",
      "region": "busan",
      "tags": ["카페", "디저트"],
      "data_quality_score": 85,
      "thumbnail_url": null,
      "is_open_now": true,
      "next_break": null
    }
  ],
  "meta": { "cursor": null, "has_more": false }
}
```

### 4.2 `GET /places/:id`
장소 상세 조회.

Response:
```json
{
  "id": "uuid",
  "name": "해운대곰장어",
  "category": "restaurant",
  "description": "",
  "region": "busan",
  "hours": [],
  "break_windows": [],
  "visit_profile": {
    "dwell_minutes": 60,
    "min_dwell": 40,
    "max_dwell": 90,
    "parking_needed": true
  },
  "data_quality_score": 95
}
```

### 4.3 `POST /places/:id/corrections`
운영정보 수정 제보.

Request:
```json
{
  "field_name": "break_start",
  "old_value": "14:30",
  "new_value": "15:00",
  "reason": "토요일만 다름"
}
```

Response:
```json
{ "id": "uuid", "status": "pending" }
```

## 5. Saved Places API

### 5.1 `GET /me/saved-places`
현재 사용자의 저장 장소 목록.

### 5.2 `POST /me/saved-places`
저장 추가.

Request:
```json
{ "place_id": "uuid" }
```

Notes:
- 로그인 후 guest 상태에서 들고 온 장소를 계정으로 옮길 때도 같은 endpoint를 사용한다.
- 중복 저장은 `409 Conflict` 또는 멱등 성공으로 처리해도 된다.
### 5.3 `DELETE /me/saved-places/:place_id`
저장 해제.

## 6. Plans API

### 6.1 `POST /plans`
계획 생성.

Request:
```json
{
  "title": "부산 당일치기",
  "region": "busan",
  "transport_mode": "car",
  "start_at": "2026-05-02T09:00:00+09:00",
  "origin_name": "부산역"
}
```

Notes:
- 로그인 직후 guest 상태에서 만든 초안 플랜을 계정으로 이관할 때도 같은 endpoint를 사용한다.
- 중복 생성은 client-side dedupe 또는 `409 Conflict` 기반 멱등 처리로 다룬다.

Response:
```json
{
  "data": {
    "id": "uuid",
    "title": "부산 당일치기",
    "region": "busan",
    "transport_mode": "car",
    "start_at": "2026-05-02T09:00:00+09:00",
    "origin_name": "부산역",
    "visibility": "private",
    "status": "draft",
    "version": 1,
    "created_at": "2026-04-21T12:34:56+09:00"
  }
}
```
### 6.2 `GET /plans`
내 계획 목록.

Query:
- `status`
- `region`
- `limit`
- `cursor`

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "부산 당일치기",
      "region": "busan",
      "status": "confirmed",
      "transport_mode": "car",
      "start_at": "2026-05-02T09:00:00+09:00",
      "stop_count": 4,
      "total_travel_minutes": 98,
      "warning_count": 0,
      "created_at": "2026-03-24T10:00:00+09:00",
      "updated_at": "2026-03-24T10:30:00+09:00"
    }
  ],
  "meta": { "cursor": null, "has_more": false }
}
```

### 6.3 `GET /plans/:id`
계획 상세 조회.

Response:
```json
{
  "data": {
    "id": "uuid",
    "title": "부산 당일치기",
    "region": "busan",
    "status": "confirmed",
    "transport_mode": "car",
    "start_at": "2026-05-02T09:00:00+09:00",
    "origin": { "lat": 35.1152, "lng": 129.0422, "name": "부산역" },
    "destination": null,
    "version": 1,
    "stops": [],
    "optimization_meta": {
      "total_travel_minutes": 98,
      "score": 92.3,
      "warning_count": 0,
      "optimized_at": "2026-03-24T11:00:00+09:00"
    },
    "alternatives_count": 3,
    "has_active_execution": false
  }
}
```

### 6.4 `PATCH /plans/:id`
계획 수정.

Request:
```json
{
  "title": "부산 맛집 투어 (수정)",
  "start_at": "2026-05-02T10:00:00+09:00",
  "origin_lat": 35.1796,
  "origin_lng": 129.0756,
  "origin_name": "해운대 숙소"
}
```

Response:
```json
{ "id": "uuid", "status": "draft", "version": 2, "updated_at": "..." }
```

규칙:
- 수정되면 status 는 `draft` 로 되돌린다
- active execution 이 있으면 409 `PLAN_IN_PROGRESS`

### 6.5 `POST /plans/:id/stops`
계획에 경유지 추가.

Request:
```json
{
  "place_id": "uuid",
  "dwell_minutes": 60,
  "locked": false
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "place_id": "uuid",
    "stop_order": 1,
    "locked": false,
    "dwell_minutes": 60,
    "arrive_at": null,
    "leave_at": null,
    "warnings": []
  }
}
```

규칙:
- 추가되면 plan status 는 `draft` 로 되돌린다
- active execution 이 있으면 409 `PLAN_IN_PROGRESS`

### 6.6 `PATCH /plans/:id/stops/:stop_id`
계획 경유지 수정.

Request:
```json
{
  "dwell_minutes": 75,
  "locked": true,
  "user_note": "점심 고정"
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "place_id": "uuid",
    "stop_order": 2,
    "locked": true,
    "dwell_minutes": 75,
    "arrive_at": null,
    "leave_at": null,
    "warnings": []
  }
}
```

### 6.7 `DELETE /plans/:id/stops/:stop_id`
계획 경유지 삭제.

Response:
```http
204 No Content
```

규칙:
- 삭제와 `stop_order` 재정렬은 DB RPC에서 원자적으로 처리한다
- active execution 이 있으면 409 `PLAN_IN_PROGRESS`

### 6.8 `PATCH /plans/:id/stops/reorder`
경유지 순서 변경.

Request:
```json
{
  "ordered_stop_ids": ["uuid-3", "uuid-1", "uuid-2", "uuid-4"]
}
```

Response:
```json
{
  "id": "uuid",
  "status": "draft",
  "version": 3,
  "stops": []
}
```

### 6.9 `POST /plans/:id/optimize`
최적화 실행.

Request:
```json
{
  "locked_stop_ids": ["uuid-2"],
  "objective": "min_travel",
  "allow_alternatives": true
}
```

Response:
```json
{
  "plan_id": "uuid",
  "status": "confirmed",
  "selected_alternative_index": 0,
  "alternatives_count": 3,
  "warnings": []
}
```

### 6.10 `GET /plans/:id/alternatives`
대안 일정안 목록.

Response:
```json
{
  "plan_id": "uuid",
  "alternatives": [
    {
      "index": 0,
      "label": "이동 최소",
      "selected": true,
      "total_travel_minutes": 98,
      "total_dwell_minutes": 285,
      "score": 92.3,
      "warning_count": 0,
      "schedule": []
    }
  ]
}
```

### 6.11 `POST /plans/:id/alternatives/:idx/select`
대안 확정.

Response:
```json
{
  "plan_id": "uuid",
  "selected_alternative_index": 1,
  "status": "confirmed"
}
```

### 6.12 `POST /plans/:id/share`
공유 링크 생성.

Request:
```json
{
  "visibility": "link_only",
  "title": "부산 맛집 코스",
  "description": "토요일 기준"
}
```

Response:
```json
{
  "shared_id": "uuid",
  "share_code": "a1b2c3d4e5f6",
  "share_url": "https://tripcart.kr/trip/a1b2c3d4e5f6",
  "expires_at": null
}
```

## 7. Shared Itinerary API

### 7.1 `GET /shared/:code`
공유 일정 미리보기.

Rules:
- `link_only` 공유 일정은 테이블 직접 select로 노출하지 않는다.
- 서버/RPC 계층에서 `share_code`, `visibility`, `expires_at`을 검증한 뒤 snapshot만 반환한다.

Response:
```json
{
  "share_code": "a1b2c3d4e5f6",
  "title": "부산 맛집 코스",
  "region": "busan",
  "transport_mode": "car",
  "total_stops": 4,
  "estimated_hours": 8.5,
  "stops": [
    { "place_name": "감천문화마을", "day_index": 1, "offset_minutes": 0 }
  ]
}
```

### 7.2 `POST /shared/:code/import`
공유 일정 가져오기.

Request:
```json
{
  "start_at": "2026-06-14T09:00:00+09:00",
  "transport_mode": "car",
  "origin_lat": 35.1152,
  "origin_lng": 129.0422,
  "origin_name": "부산역"
}
```

Response:
```json
{
  "result_plan_id": "uuid",
  "status": "draft"
}
```

## 8. Execution API

### 8.1 `POST /plans/:id/start`
confirmed plan 을 execution 으로 시작.

Response:
```json
{
  "execution_id": "uuid",
  "status": "active",
  "started_at": "2026-05-02T09:00:00+09:00"
}
```

### 8.2 `GET /executions/:id`
execution 상세 조회.

Response:
```json
{
  "id": "uuid",
  "plan_id": "uuid",
  "status": "active",
  "delay_minutes": 10,
  "reopt_count": 1,
  "stops": [
    {
      "id": "uuid",
      "stop_order": 1,
      "place_id": "uuid",
      "place_name": "감천문화마을",
      "planned_arrive_at": "2026-05-02T09:30:00+09:00",
      "planned_leave_at": "2026-05-02T11:00:00+09:00",
      "arrive_at": "2026-05-02T09:40:00+09:00",
      "leave_at": null,
      "skipped": false,
      "is_adhoc": false
    }
  ],
  "next_alert": {
    "type": "break_time_risk",
    "fire_at": "2026-05-02T14:00:00+09:00"
  }
}
```

### 8.3 `PATCH /executions/:id/stops/:stop_id`
실행 경유지 상태 수정.

Request 예시 — 도착:
```json
{ "arrive_at": "2026-05-02T09:40:00+09:00" }
```

Request 예시 — 완료:
```json
{ "leave_at": "2026-05-02T11:10:00+09:00" }
```

Request 예시 — 건너뜀:
```json
{ "skipped": true, "skip_reason": "시간 부족" }
```

### 8.4 `POST /executions/:id/reoptimize`
남은 코스 기준 재최적화.

Request:
```json
{
  "strategy": "keep_restaurant_priority"
}
```

Response:
```json
{
  "execution_id": "uuid",
  "reopt_count": 2,
  "warnings": []
}
```

## 9. Spend / Media API

### 9.1 `POST /executions/:id/spends`
지출 추가.

Request:
```json
{
  "stop_id": "uuid",
  "category": "food",
  "occurred_at": "2026-05-02T12:10:00+09:00",
  "total_amount": 32000,
  "items": [
    { "name": "곰장어", "qty": 2, "unit_price": 11500, "line_amount": 23000 },
    { "name": "볶음밥", "qty": 1, "unit_price": 9000, "line_amount": 9000 }
  ]
}
```

Response:
```json
{ "id": "uuid", "total_amount": 32000 }
```

### 9.2 `GET /me/spends/summary`
주간/월간 지출 통계.

Query:
- `period=weekly|monthly`
- `from`
- `to`

Response:
```json
{
  "period": "monthly",
  "total_amount": 187000,
  "by_category": {
    "food": 98000,
    "cafe": 24000,
    "admission": 15000,
    "transport": 50000
  }
}
```

### 9.3 `POST /media/upload`
업로드용 signed URL 생성.

Request:
```json
{
  "kind": "trip-photo",
  "content_type": "image/jpeg",
  "file_name": "IMG_1234.jpg"
}
```

Response:
```json
{
  "asset_id": "uuid",
  "upload_url": "https://...",
  "storage_path": "media/u1/2026/05/asset.jpg"
}
```

## 10. Push Token API

### 10.1 `POST /me/push-tokens`
푸시 토큰 등록/갱신.

Request:
```json
{
  "push_token": "ExponentPushToken[xxxx]",
  "platform": "ios",
  "device_name": "iPhone 15 Pro"
}
```

Response:
```json
{ "id": "uuid", "is_active": true }
```

## 11. AI Assist API

### 11.1 `POST /plans/:id/gap-suggest`
빈 구간 추천.

Request:
```json
{
  "after_stop_id": "uuid",
  "before_stop_id": "uuid",
  "window_start": "2026-05-02T14:10:00+09:00",
  "window_end": "2026-05-02T15:40:00+09:00",
  "themes": ["cafe", "view"],
  "budget_max": 15000
}
```

Response:
```json
{
  "suggestions": [
    {
      "place_id": "uuid",
      "place_name": "뷰카페 A",
      "estimated_stay_minutes": 45,
      "extra_travel_minutes": 8,
      "reason": "동선 손실이 작고 뷰가 좋음",
      "constraints": {
        "open_ok": true,
        "breaktime_ok": true,
        "travel_time_ok": true
      }
    }
  ]
}
```

### 11.2 `POST /receipts/scan`
영수증 OCR draft 생성.

Request:
```json
{
  "asset_id": "uuid",
  "execution_id": "uuid",
  "stop_id": "uuid"
}
```

Response:
```json
{
  "receipt_id": "uuid",
  "status": "needs_review"
}
```

### 11.3 `GET /receipts/:id`
OCR draft 조회.

Response:
```json
{
  "id": "uuid",
  "status": "needs_review",
  "merchant_name": { "text": "해운대곰장어", "confidence": 0.93 },
  "occurred_at": { "iso": "2026-05-02T12:10:00+09:00", "confidence": 0.88 },
  "total_amount": { "value": 32000, "currency": "KRW", "confidence": 0.95 },
  "items": [
    { "name": "곰장어", "qty": 2, "unit_price": 11500, "amount": 23000, "confidence": 0.77 }
  ]
}
```

### 11.4 `POST /receipts/:id/confirm`
OCR draft 확정 후 spend 생성.

Request:
```json
{
  "merchant_name": "해운대곰장어",
  "occurred_at": "2026-05-02T12:10:00+09:00",
  "total_amount": 32000,
  "category": "food",
  "items": [
    { "name": "곰장어", "qty": 2, "unit_price": 11500, "line_amount": 23000 }
  ]
}
```

Response:
```json
{
  "receipt_id": "uuid",
  "status": "confirmed",
  "spend_id": "uuid"
}
```

## 12. Optimizer Internal API

> 이 API는 클라이언트가 직접 호출하지 않는다. App API / server-side orchestration 에서만 호출한다.
> 모든 요청은 `Authorization: Bearer <OPTIMIZER_INTERNAL_TOKEN>`을 요구한다.
> Phase 2 구현 전 stub은 아래 request shape를 검증한 뒤 표준 error envelope의 `501 NOT_IMPLEMENTED`를 반환한다.

### 12.1 `POST /optimize`
Request:
```json
{
  "plan_id": "uuid",
  "transport_mode": "car",
  "start_at": "2026-05-02T09:00:00+09:00",
  "origin": { "lat": 35.1152, "lng": 129.0422, "name": "부산역" },
  "stops": [
    {
      "stop_id": "uuid",
      "place_id": "uuid",
      "lat": 35.0975,
      "lng": 129.0107,
      "dwell_minutes": 90,
      "locked": false,
      "time_window": {
        "open_at": "2026-05-02T09:00:00+09:00",
        "close_at": "2026-05-02T17:00:00+09:00"
      }
    }
  ]
}
```

Response:
```json
{
  "selected_alternative_index": 0,
  "alternatives": [],
  "warnings": [],
  "meta": {
    "total_travel_minutes": 98,
    "score": 92.3
  }
}
```

### 12.2 `POST /matrix`
Request:
```json
{
  "provider": "tmap",
  "transport_mode": "car",
  "points": [
    { "id": "origin", "lat": 35.1152, "lng": 129.0422 },
    { "id": "p1", "lat": 35.0975, "lng": 129.0107 }
  ]
}
```

Response:
```json
{
  "matrix": {
    "origin": {
      "p1": { "minutes": 30, "meters": 12400 }
    }
  }
}
```

## 13. 버전 관리 규칙

- 이 문서가 API 정본이다
- endpoint 추가/제거/응답 shape 변경 시 이 문서를 먼저 수정한다
- 프론트와 백엔드는 `v0.2` 기준에서 출발한다
- breaking change 는 `v0.3` 로 올리고 changelog 를 같이 남긴다
