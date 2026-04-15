"""TripCart Optimizer FastAPI service."""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import matrix, optimize


def create_app() -> FastAPI:
    is_production = os.getenv("APP_ENV", "").lower() in {"prod", "production"}

    optimizer_app = FastAPI(
        title="TripCart Optimizer",
        description="Time-window routing and scheduling optimizer",
        version="0.1.0",
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )

    optimizer_app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @optimizer_app.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        error = {
            "code": detail.get("code", "HTTP_ERROR"),
            "message": detail.get("message", str(exc.detail)),
            "details": detail.get("details", {}),
        }
        return JSONResponse(status_code=exc.status_code, content={"error": error})

    optimizer_app.include_router(matrix.router, prefix="/v1", tags=["matrix"])
    optimizer_app.include_router(optimize.router, prefix="/v1", tags=["optimize"])

    @optimizer_app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {
            "status": "ok",
            "service": "tripcart-optimizer",
            "version": "0.1.0",
            "phase": "0",
        }

    return optimizer_app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
