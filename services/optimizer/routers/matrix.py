"""
Matrix Router — Phase 0 골격
Phase 2에서 TMAP API 연동 및 캐시 로직 구현 예정
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class MatrixRequest(BaseModel):
    """경로 행렬 계산 요청 (Phase 2에서 확장)"""

    place_ids: list[str]
    travel_mode: str = "car"
    travel_date: str  # YYYY-MM-DD


class MatrixResponse(BaseModel):
    """경로 행렬 응답"""

    matrix: list[list[int]]  # 분 단위 이동시간 [from][to]
    distances: list[list[int]]  # 미터 단위 거리 [from][to]
    cached: bool


@router.post("/matrix", response_model=MatrixResponse)
async def compute_matrix(request: MatrixRequest) -> MatrixResponse:
    """
    장소 간 이동 시간/거리 행렬 계산

    Phase 0: stub — 빈 행렬 반환
    Phase 2: TMAP API 연동 + route_matrix_cache 활용
    """
    n = len(request.place_ids)
    raise HTTPException(
        status_code=501,
        detail={
            "code": "NOT_IMPLEMENTED",
            "message": "Matrix API는 Phase 2에서 구현됩니다.",
            "phase": "2",
        },
    )
