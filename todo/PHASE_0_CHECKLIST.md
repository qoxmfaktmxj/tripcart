# TripCart Phase 0 완료 체크리스트

## Exit Criteria (완료 기준)

### 1. Supabase 로컬 스택
- [ ] Docker Desktop 실행 확인
- [ ] `supabase init --workdir infra/supabase` 실행
- [ ] `supabase start --workdir infra/supabase` 성공 (PostgreSQL 17)
- [ ] `.env.local` 생성 후 anon key / service_role key 입력
- [ ] `psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql` 적용 성공
- [ ] 25개 이상 테이블 생성 확인 (`\dt`)
- [ ] `seed_golden_scenarios()` 실행 성공

### 2. 모노레포 의존성 설치
- [ ] 루트에서 `pnpm install` 성공
- [ ] workspace 패키지 간 참조 정상 (`@tripcart/*` import 확인)

### 3. apps/web (Next.js 16)
- [ ] `pnpm --filter @tripcart/web dev` 실행 성공
- [ ] `http://localhost:3000` 접속 후 Hello World 화면 확인
- [ ] 컬러 프리뷰 4개 박스 (`primary / plum / coral / gold`) 정상 렌더
- [ ] `pnpm --filter @tripcart/web typecheck` 에러 없음
- [ ] `pnpm --filter @tripcart/web lint` 통과

### 4. apps/mobile (Expo SDK 54)
- [ ] `pnpm --filter @tripcart/mobile start` 실행 성공
- [ ] Dev Client 빌드 또는 시뮬레이터에서 Hello World 확인
- [ ] `@tripcart/types` import 정상 동작

### 5. services/optimizer (FastAPI)
- [ ] `cd services/optimizer && uv sync` 성공
- [ ] `uv run uvicorn main:app --reload` 실행
- [ ] `http://localhost:8000/health` 응답 확인
  ```json
  { "status": "ok", "service": "tripcart-optimizer", "phase": "0" }
  ```
- [ ] `uv run pytest tests/ -v` 통과 (기본 테스트 3개)

### 6. CI 파이프라인
- [ ] GitHub repo 연결 후 push 시 CI 자동 실행
- [ ] `pnpm lint` 통과
- [ ] `pnpm typecheck` 통과
- [ ] Python `ruff` + `pytest` 통과

---

## 다음 단계: Phase 1 시작 조건

Phase 0 Exit Criteria를 모두 충족하면 Phase 1 시작:

1. `Auth + RLS`: Supabase Auth 연동, user_profile 트리거 확인
2. `Places CRUD`: `/places` read 경로 구현
3. `Saved Places CRUD`: 저장 / 해제 / 목록
4. `Trip Plans CRUD`: 플랜 생성 / 수정 / 삭제 / 스톱 추가

---

## 실행 명령어 요약

```bash
# 1. 의존성 설치
pnpm install

# 2. Supabase 시작 (Docker 필요)
supabase start --workdir infra/supabase

# 3. 스키마 적용
export SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql

# 4. web 개발 서버
pnpm --filter @tripcart/web dev

# 5. optimizer 개발 서버
cd services/optimizer
uv run uvicorn main:app --reload --port 8000

# 6. 전체 lint/typecheck
pnpm lint
pnpm typecheck
```
