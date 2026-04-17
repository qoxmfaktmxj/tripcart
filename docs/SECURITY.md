# TripCart Security and Data Policy v1.0
업데이트: 2026-04-15
상태: **Canonical**

## 1. 보안 목표

TripCart는 여행 기록, 위치, 지출, 영수증, 사진을 다루므로  
**사용자 소유권, 최소 수집, 서비스 역할 분리** 가 핵심이다.

## 2. 인증/권한 원칙

- 인증은 Supabase Auth 사용
- 사용자 소유 데이터는 기본적으로 RLS 보호
- service role 은 서버/백엔드 작업 전용
- 클라이언트는 anon/public key 만 사용

## 3. 데이터 분류

### 3.1 일반 데이터
- places
- 운영시간
- 관광지/식당 설명
- 공유 preview 공개 데이터

### 3.2 사용자 소유 데이터
- saved places
- trip plans
- executions
- spends
- media
- receipt scans
- notification rules
- push tokens

### 3.3 민감 가능 데이터
- receipt image
- card/approval 관련 OCR raw payload
- 사용자의 상세 이동 일정
- 사진 EXIF/location metadata

## 4. 영수증 정책

- 원본 receipt 이미지는 **기본 장기 보관 금지**
- OCR raw payload 는 기본 저장하지 않음
- 저장이 필요하면 TTL 과 마스킹 정책을 명시
- 카드번호/승인번호는 전체 저장 금지
- last4 수준 또는 비저장 원칙

## 5. 업로드 정책

- signed URL 기반 업로드
- MIME/type / size 제한
- 사용자 폴더 분리
- 삭제 정책 명확화
- 이미지 업로드 후 EXIF strip 를 고려

## 6. 로그 정책

로그에 아래를 남기지 않는다.
- 전체 JWT
- service role key
- raw receipt OCR payload
- 전체 카드정보/승인정보
- 사용자 이메일/전화번호를 불필요하게 평문 기록

## 7. secret 관리

- public key 와 server secret 분리
- `.env.local`, secret manager, CI secrets 사용
- repo committed 금지:
  - service role
  - OCR provider key
  - TMAP/Naver privileged keys
  - OpenAI API key
  - Anthropic API key

## 5.1 AI provider key policy

- AI provider keys are server-only secrets.
- Supported server env names:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `AI_PROVIDER` (`openai` or `anthropic`, optional)
- `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` must never contain AI provider keys.
- If both OpenAI and Anthropic keys exist, `AI_PROVIDER` selects the active provider.
- If no AI provider key exists, AI-backed features must fail closed with a standard configuration error or remain disabled.
  - internal optimizer token

## 8. 네이버 데이터 수집 정책

- 자동 네이버 크롤링 금지
- 공식 API / 수동 검증 / 사용자 제보 조합 사용
- 약관/법적 리스크가 있는 자동 수집은 MVP 범위에서 제외

## 9. 실행/공유 보안

- shared itinerary 는 snapshot 이다
- private / link_only / public visibility 를 구분
- 공유 링크는 원본 plan 자체가 아니라 공유 snapshot 을 노출
- import 는 새 plan 을 생성하며 원본을 직접 편집하지 않는다
- `link_only`는 테이블 직접 select로 열거 가능하면 안 된다.
- `link_only` 조회는 share_code, visibility, expires_at을 검증하는 서버/RPC 경로로 제한한다.

## 9.1 2026-04 audit hardening 상태

아래 항목은 2026-04-15 hardening 기준이다.

- SECURITY DEFINER RPC는 `auth.uid()` 존재와 소유권을 함수 내부에서 확인한다.
- SECURITY DEFINER RPC에는 `SET search_path = public`을 명시한다.
- PUBLIC/anon/authenticated 기본 EXECUTE 권한은 최소 권한으로 재부여한다.
- `link_only` 공유 일정 직접 select는 차단하고 share_code 검증 RPC로 조회한다.
- optimizer `/v1/optimize`, `/v1/matrix`는 internal bearer token을 요구한다.
- production dependency audit high 취약점은 릴리스 차단으로 본다.
- owner mismatch와 `link_only` 직접 select 차단은 local Supabase smoke로 검증한다.
- 남은 수동 확인: `.env.local` hosted secret rotation 여부.

## 10. 운영 보안 체크리스트

### 배포 전
- RLS enabled 확인
- service role client-side leak 없음
- storage bucket policy 확인
- signed URL expiration 확인
- optimizer internal auth 확인
- SECURITY DEFINER RPC owner mismatch 테스트 통과
- `link_only` 공유 visibility 테스트 통과
- production dependency audit high 없음

### 기능 릴리스 전
- receipt retention 정책 확인
- push token revoke 처리 확인
- share visibility 테스트 완료
- owner mismatch 테스트 완료

## 11. 사고 대응 기본선

- service role 유출 시 즉시 rotate
- OCR provider key 유출 시 rotate
- receipt leak 의심 시 원본 파일 전량 만료/삭제 정책 실행
- 공유 링크 이상 노출 시 share_code rotation 또는 visibility 강등

## 12. 문서 갱신 규칙

아래가 바뀌면 이 문서를 갱신한다.
- receipt retention
- storage path policy
- key usage
- auth/RLS 구조
- share visibility rule
