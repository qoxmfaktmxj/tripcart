# TripCart Functional QA Report

- Date: 2026-04-30
- Target: http://127.0.0.1:3202
- Mode: Browser + authenticated API functional pass/fail
- Health score: 54/100
- Summary: PASS 18, FAIL 2, BLOCKED 5
- Screenshots: C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30

## Results

| # | Feature | Result | Evidence / Details |
|---:|---|---|---|
| 1 | 홈 화면 로드/장바구니 모달 | PASS | 홈 H1 확인, 장바구니 dialog open/escape close 확인 \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\01-home-cart.png |
| 2 | 공개 장소 목록 UI | PASS | 장소 카드 6개 렌더링 \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\02-places-list.png |
| 3 | 공개 Places API | PASS | 공개 장소 5개 조회 |
| 4 | 장소 상세 화면 | PASS | 장소 상세 로드: Busan Station \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\03-place-detail.png |
| 5 | 게스트 저장 장소 UI | PASS | guest localStorage 저장 확인: Busan Station \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\04-guest-saved-places.png |
| 6 | 게스트 계획 생성 UI | PASS | 게스트 draft plan 생성: QA 게스트 92378 \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\05-guest-plan.png |
| 7 | 비인증 보호 API | PASS | GET /api/v1/plans 비인증 401 |
| 8 | 회원가입/로그인 세션 생성 | PASS | 신규 QA 계정 생성 및 세션 확보: qa-1777510494664@tripcart.local \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\06-signed-in.png |
| 9 | 인증 Saved Places API | PASS | 저장 API status=409, 목록 1개 |
| 10 | Kakao 공개 검색 API | PASS | Kakao Local 결과 1개 |
| 11 | Kakao 공개 검색 입력 가드 | PASS | 짧은 query 400 INVALID_QUERY |
| 12 | Plans API 생성/조회 | PASS | plan 생성/조회 성공: e9fed427-0326-46be-8174-342f7813387e |
| 13 | Plan Stops 추가 | PASS | stops 3개 추가 |
| 14 | 플랜 상세 UI | PASS | 인증 플랜 상세 화면 로드 \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\07-plan-detail-auth.png |
| 15 | Optimize + atomic alternatives 적용 | FAIL | status=404 body={"error":{"code":"OPTIMIZER_ERROR","message":"Optimizer request failed.","details":{}}} |
| 16 | Alternatives 조회/선택 | BLOCKED | Optimize 실패로 alternatives 검증 불가 |
| 17 | Share preview/import | PASS | share_code=f963a56ece83, imported=91649af2-07e1-419b-9b8b-eafbf499f59b |
| 18 | Execution 시작/조회 | BLOCKED | Plan confirmed 실패로 execution 시작 불가 |
| 19 | Execution 화면 | BLOCKED | execution 생성 실패로 화면 검증 불가 |
| 20 | Execution stop action + spend 기록 | BLOCKED | execution stop 없음 |
| 21 | Active execution 중 plan mutation 차단 | BLOCKED | execution 없음 |
| 22 | Place correction API | PASS | correction=9240ad5c-e069-4fb2-8774-74224ffd38e2 |
| 23 | Reoptimize endpoint 계약상 stub | PASS | 501 NOT_IMPLEMENTED 확인 |
| 24 | Media upload endpoint 부재 | FAIL | media upload route 없음: 404 |
| 25 | 모바일 viewport 핵심 페이지 | PASS | 390x844 places/plans 렌더링 확인 \| evidence=C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\08-mobile-places.png; C:\Users\kms\Desktop\dev\tripcart\.gstack\qa-reports\screenshots\tripcart-functional-2026-04-30\09-mobile-plans.png |

## Console / Network

- Console warnings/errors captured: 5
- error: Failed to load resource: the server responded with a status of 409 (Conflict)
- error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- error: Failed to load resource: the server responded with a status of 404 (Not Found)
- error: Failed to load resource: the server responded with a status of 501 (Not Implemented)
- error: Failed to load resource: the server responded with a status of 404 (Not Found)
- Request failures captured: 27
- https://dapi.kakao.com/v2/maps/sdk.js?appkey=8d9649b1527cf1de5cf2c45af27e7f59&autoload=false: net::ERR_BLOCKED_BY_ORB
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000103?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000104?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000105?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000106?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000103?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000105?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000104?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000106?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/_next/static/chunks/0wbr95vbbjfox.js: net::ERR_ABORTED
- https://dapi.kakao.com/v2/maps/sdk.js?appkey=8d9649b1527cf1de5cf2c45af27e7f59&autoload=false: net::ERR_BLOCKED_BY_ORB
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000103?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000104?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000105?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000106?_rsc=wrydy: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000103?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000104?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000105?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000106?_rsc=1md78: net::ERR_ABORTED
- http://127.0.0.1:3202/places/00000000-0000-4000-8000-000000000106?_rsc=mcvs3: net::ERR_ABORTED

## Notes

- This run intentionally did not modify application source code. It created only QA report/screenshot artifacts.
- Features with known missing routes are marked FAIL rather than PASS so the release gap is visible.