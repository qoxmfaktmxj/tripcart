# TripCart Execution Packet Generator

Claude 분석 결과를 Codex가 바로 실행할 수 있는 Execution Packet으로 변환하라.

## 입력
$ARGUMENTS

## 생성 절차

1. `/analyze` 결과를 기반으로 작업 분해
2. DEVELOPMENT_OPERATING_SYSTEM.md §8 Task packet format 준수
3. 위험도별 검증 계획 포함 (GOVERNANCE.md §5)
4. 구현 순서 규칙 적용: schema → API contract → server → client → tests → docs

## 출력: Codex Task Packet

```md
# Task: [작업명]

## 목적
[왜 이 변경이 필요한가]

## 위험도
R0 / R1 / R2 / R3

## 범위
- 수정 대상:
- 생성 대상:

## 비범위
- 건드리면 안 되는 것:

## 참고 문서
- [관련 canonical docs 목록]

## 구현 순서
1. [단계별 체크리스트]

## 검증 기준
- [ ] lint 통과
- [ ] typecheck 통과
- [ ] 관련 테스트 통과
- [ ] GS1/GS2/GS3 미파괴

## 완료 정의
- [ ] 코드 변경 완료
- [ ] 테스트 추가/갱신
- [ ] 문서 동기화: [대상 문서]

## Stop 조건
- [어떤 경우 멈추고 보고할 것인가]
```
