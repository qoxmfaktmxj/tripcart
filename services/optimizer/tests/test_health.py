"""Phase 0 optimizer service tests."""

from fastapi.testclient import TestClient

from main import create_app


def build_client(monkeypatch, *, token: str = "test-token") -> TestClient:
    monkeypatch.setenv("OPTIMIZER_INTERNAL_TOKEN", token)
    return TestClient(create_app())


def test_health(monkeypatch):
    client = build_client(monkeypatch)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "tripcart-optimizer"
    assert data["phase"] == "0"


def test_optimize_requires_bearer_token(monkeypatch):
    client = build_client(monkeypatch)
    response = client.post("/v1/optimize", json=contract_optimize_payload())
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Missing or invalid optimizer bearer token.",
            "details": {},
        }
    }


def test_optimize_rejects_wrong_bearer_token(monkeypatch):
    client = build_client(monkeypatch)
    response = client.post(
        "/v1/optimize",
        headers={"Authorization": "Bearer wrong-token"},
        json=contract_optimize_payload(),
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_optimizer_auth_requires_configuration(monkeypatch):
    monkeypatch.delenv("OPTIMIZER_INTERNAL_TOKEN", raising=False)
    client = TestClient(create_app())
    response = client.post(
        "/v1/optimize",
        headers={"Authorization": "Bearer test-token"},
        json=contract_optimize_payload(),
    )
    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "OPTIMIZER_AUTH_NOT_CONFIGURED",
            "message": "Optimizer internal token is not configured.",
            "details": {},
        }
    }


def test_optimize_accepts_contract_payload_and_returns_error_envelope(monkeypatch):
    client = build_client(monkeypatch)
    response = client.post(
        "/v1/optimize",
        headers={"Authorization": "Bearer test-token"},
        json=contract_optimize_payload(),
    )
    assert response.status_code == 501
    assert response.json() == {
        "error": {
            "code": "NOT_IMPLEMENTED",
            "message": "Optimize API is planned for Phase 2.",
            "details": {"phase": "2"},
        }
    }


def test_matrix_requires_bearer_token(monkeypatch):
    client = build_client(monkeypatch)
    response = client.post("/v1/matrix", json=contract_matrix_payload())
    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "UNAUTHORIZED",
            "message": "Missing or invalid optimizer bearer token.",
            "details": {},
        }
    }


def test_matrix_accepts_contract_payload_and_returns_error_envelope(monkeypatch):
    client = build_client(monkeypatch)
    response = client.post(
        "/v1/matrix",
        headers={"Authorization": "Bearer test-token"},
        json=contract_matrix_payload(),
    )
    assert response.status_code == 501
    assert response.json() == {
        "error": {
            "code": "NOT_IMPLEMENTED",
            "message": "Matrix API is planned for Phase 2.",
            "details": {"phase": "2"},
        }
    }


def test_docs_are_disabled_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("OPTIMIZER_INTERNAL_TOKEN", "test-token")
    client = TestClient(create_app())

    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def contract_optimize_payload() -> dict:
    return {
        "plan_id": "11111111-1111-4111-8111-111111111111",
        "transport_mode": "car",
        "start_at": "2026-05-02T09:00:00+09:00",
        "origin": {"lat": 35.1152, "lng": 129.0422, "name": "Busan Station"},
        "stops": [
            {
                "stop_id": "22222222-2222-4222-8222-222222222222",
                "place_id": "33333333-3333-4333-8333-333333333333",
                "lat": 35.0975,
                "lng": 129.0107,
                "dwell_minutes": 90,
                "locked": False,
                "time_window": {
                    "open_at": "2026-05-02T09:00:00+09:00",
                    "close_at": "2026-05-02T17:00:00+09:00",
                },
            }
        ],
    }


def contract_matrix_payload() -> dict:
    return {
        "provider": "tmap",
        "transport_mode": "car",
        "points": [
            {"id": "origin", "lat": 35.1152, "lng": 129.0422},
            {"id": "p1", "lat": 35.0975, "lng": 129.0107},
        ],
    }
