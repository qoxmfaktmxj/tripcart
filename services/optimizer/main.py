"""
TripCart Optimizer — FastAPI Service
Phase 0: /health endpoint만 구현
Phase 2+: /matrix, /optimize 엔드포인트 추가 예정
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import matrix, optimize

app = FastAPI(
    title="TripCart Optimizer",
    description="Time-window routing & scheduling optimizer (OR-Tools 기반)",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — 내부 전용 서비스 (Next.js 서버사이드에서만 호출)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # web dev server
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(matrix.router, prefix="/v1", tags=["matrix"])
app.include_router(optimize.router, prefix="/v1", tags=["optimize"])


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """서비스 상태 확인 — Phase 0 검증용"""
    return {
        "status": "ok",
        "service": "tripcart-optimizer",
        "version": "0.1.0",
        "phase": "0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
