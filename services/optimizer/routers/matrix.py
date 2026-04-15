"""Route matrix endpoint contract stub."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from auth import optimizer_error, require_internal_token

router = APIRouter(dependencies=[Depends(require_internal_token)])


class MatrixPoint(BaseModel):
    id: str = Field(min_length=1)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class MatrixRequest(BaseModel):
    provider: Literal["tmap", "naver", "kakao"]
    transport_mode: Literal["car", "transit", "walk", "bicycle"]
    points: list[MatrixPoint] = Field(min_length=2)


class MatrixLeg(BaseModel):
    minutes: int
    meters: int


class MatrixResponse(BaseModel):
    matrix: dict[str, dict[str, MatrixLeg]]


@router.post("/matrix", response_model=MatrixResponse)
async def compute_matrix(_request: MatrixRequest) -> MatrixResponse:
    raise optimizer_error(
        501,
        "NOT_IMPLEMENTED",
        "Matrix API is planned for Phase 2.",
        {"phase": "2"},
    )
