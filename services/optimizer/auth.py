"""Internal authentication dependency for optimizer routes."""

from __future__ import annotations

import os
from hmac import compare_digest

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)


def optimizer_error(
    status_code: int,
    code: str,
    message: str,
    details: dict[str, object] | None = None,
) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message, "details": details or {}},
    )


def require_internal_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    expected_token = os.getenv("OPTIMIZER_INTERNAL_TOKEN")
    if not expected_token:
        raise optimizer_error(
            503,
            "OPTIMIZER_AUTH_NOT_CONFIGURED",
            "Optimizer internal token is not configured.",
        )

    received_token = credentials.credentials if credentials else ""
    if not received_token or not compare_digest(received_token, expected_token):
        raise optimizer_error(
            401,
            "UNAUTHORIZED",
            "Missing or invalid optimizer bearer token.",
        )
