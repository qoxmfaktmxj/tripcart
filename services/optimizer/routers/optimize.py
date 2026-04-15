"""Optimizer endpoint contract stubs."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from auth import optimizer_error, require_internal_token

router = APIRouter(dependencies=[Depends(require_internal_token)])


class Coordinate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    name: str | None = None


class TimeWindow(BaseModel):
    open_at: datetime
    close_at: datetime


class OptimizeStop(BaseModel):
    stop_id: UUID
    place_id: UUID
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    dwell_minutes: int = Field(gt=0)
    locked: bool = False
    time_window: TimeWindow | None = None


class OptimizeRequest(BaseModel):
    plan_id: UUID
    transport_mode: Literal["car", "transit", "walk", "bicycle"]
    start_at: datetime
    origin: Coordinate
    stops: list[OptimizeStop] = Field(min_length=1)


class OptimizeMeta(BaseModel):
    total_travel_minutes: int
    score: float


class OptimizeResponse(BaseModel):
    selected_alternative_index: int
    alternatives: list[dict]
    warnings: list[dict]
    meta: OptimizeMeta


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(_request: OptimizeRequest) -> OptimizeResponse:
    raise optimizer_error(
        501,
        "NOT_IMPLEMENTED",
        "Optimize API is planned for Phase 2.",
        {"phase": "2"},
    )
