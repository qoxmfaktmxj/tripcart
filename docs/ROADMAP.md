# TripCart Roadmap v1.3
업데이트: 2026-04-09  
상태: **Canonical Execution Plan**

## 1. 배경

TripCart는 장소 목록 기반 탐색 앱이 아니라, 저장한 후보를 실제 일정과 실행 흐름으로 연결하는 제품이다.
공개 랜딩은 제품 가치를 설명하고, 운영형 화면은 계획과 실행에 필요한 작업을 담당한다.

## 2. 실행 원칙

- solo founder + Codex pair development
- monorepo + local Supabase 우선
- 정본은 `docs/` 1군 문서로 유지
- 기능 변경은 문서와 코드 동기화를 같이 한다
- 로그인은 시작 장벽이 아니라 동기화 시점이다

## 3. 단계 계획

| Phase | 범위 | 목표 | 상태 |
|---|---|---|---|
| Phase 0 | 부트스트랩 | Repo, local Supabase, schema, auth, docs 체계 | 완료 |
| Phase 1 | 제품 코어 | auth, places, saved places, plans CRUD | 진행 중 |
| Phase 1.5 | guest-first trial | 공개 랜딩, guest 저장/초안, 로그인 이관 | 진행 중 |
| Phase 2 | 최적화 연동 | optimizer, alternatives, share/import | 계획 |
| Phase 3 | 실행/기록 | execution, spend, media | 계획 |
| Phase 4 | 고도화 | smart alert, correction flow, polish | 계획 |
| Phase 5 | V2 | gap suggest, OCR, personalization | 계획 |

## 4. Phase 0 - 기초 완료

### 목표
- local Supabase, optimizer, monorepo 기본 동작 보장
- canonical schema 적용
- 문서와 개발 진입점 정리

### 핵심 산출물
- monorepo skeleton
- Next.js / Expo / FastAPI 부트스트랩
- local Supabase reset 가능한 개발 흐름
- README, architecture, design, API contract 정리

### 완료 기준
- `pnpm lint`, `pnpm typecheck`, `pnpm build` 통과
- local Supabase 재기동과 seed 확인 가능
- canonical docs 읽기 순서와 정본 경계가 명확함

## 5. Phase 1 - 제품 코어

### 목표
- 인증, 장소 조회, 저장, 플랜 CRUD를 사용자 흐름으로 연결

### 우선순위
1. Auth entry와 세션 기반 운영
2. Places read path
3. Saved places CRUD
4. Plans CRUD
5. Plan detail/edit/delete

### 완료 기준
- 로그인 사용자 기준으로 장소 저장과 플랜 생성/수정/삭제가 가능
- `/places`, `/saved-places`, `/plans`, `/plans/[id]` 흐름이 브라우저에서 재현 가능
- 문서와 실제 API shape가 일치함

## 6. Phase 1.5 - 게스트 트라이얼 + 이관

### 목표
- 로그인 없이 먼저 써보고, 로그인 후 그대로 이어서 관리하게 만든다

### 작업 항목
1. 공개 앱스토어형 홈 랜딩
2. guest saved places (`localStorage`)
3. guest draft plans (`localStorage`)
4. 로그인/회원가입 후 client-side migration
5. migration banner, guest 안내 문구, CTA 정렬

### 완료 기준
- 비로그인 사용자가 `/places`, `/saved-places`, `/plans`를 바로 쓸 수 있음
- guest 상태가 로그인 후 `POST /me/saved-places`, `POST /plans`를 통해 계정으로 이관됨
- 성공 항목만 제거되고 실패 항목은 guest 상태에 남음
- 홈 랜딩, auth 화면, 운영 화면 문구가 guest-first 정책과 일치함

## 7. Phase 2 - 최적화 연동

### 목표
- 최적화 결과, 대안 일정, 공유/가져오기 흐름 연결

### 범위
1. optimizer `/matrix`, `/optimize` 연동
2. warning / alternative 생성
3. plan sharing + import
4. region 1곳, 자동차 모드 기준 우선 완성

### 완료 기준
- 플랜에서 최적화 요청이 가능
- alternative 선택과 공유 링크 생성이 가능
- import 후 사용자 플랜으로 복제 가능

## 8. Phase 3 - 실행/기록

### 목표
- 계획을 실제 실행 흐름으로 전환하고 방문/지출을 기록

### 범위
1. execution 시작
2. stop 완료/건너뛰기
3. spend 입력과 요약
4. media 기초 저장

### 완료 기준
- active execution 생성/종료가 명확함
- 실행 상태가 계획과 분리되어 유지됨
- 기본 spend/media 기록이 동작함

## 9. 위험 항목

- guest 이관과 RLS 경계는 중복/부분 실패 처리가 가장 취약하다
- public landing과 operational surface가 다시 섞이면 제품 메시지가 약해진다
- 로컬 환경과 canonical docs가 어긋나면 이후 optimizer/share 작업에서 다시 비용이 커진다
- mobile 실제 QA는 Android SDK/에뮬레이터 환경이 갖춰져야 한다

## 10. 기준 테스트 항목

- 문서와 코드의 guest-first 정책 일치
- Places / Saved Places / Plans 기본 흐름 보존
- guest save -> guest plan -> login migration 브라우저 검증
- 한국어 UI 깨짐 없음
- 모바일/데스크톱 랜딩 레이아웃 정상
