"""
Optimize Router — Phase 0 골격
Phase 2에서 OR-Tools CP-SAT 기반 time-window routing 구현 예정
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class OptimizeRequest(BaseModel):
    """최적화 요청 (Phase 2에서 확장)"""

    plan_id: str
    travel_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    travel_mode: str = "car"


class OptimizedStop(BaseModel):
    plan_stop_id: str
    stop_order: int
    arrive_at: str  # ISO 8601
    leave_at: str  # ISO 8601
    travel_from_prev_minutes: int
    travel_from_prev_meters: int
    warnings: list[dict]


class OptimizeResponse(BaseModel):
    alternatives: list[list[OptimizedStop]]
    warning_count: int


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(request: OptimizeRequest) -> OptimizeResponse:
    """
    시간 제약 기반 일정 최적화 (OR-Tools CP-SAT)

    Phase 0: stub — 501 반환
    Phase 2:
      - route matrix 활용
      - 브레이크타임/영업시간/체류시간 제약 반영
      - 대안 일정 2-3개 생성
    """
    raise HTTPException(
        status_code=501,
        detail={
            "code": "NOT_IMPLEMENTED",
            "message": "Optimize API는 Phase 2에서 구현됩니다.",
            "phase": "2",
        },
    )
