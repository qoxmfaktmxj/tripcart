"""
Phase 0 최소 테스트 — /health 엔드포인트 동작 확인
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "tripcart-optimizer"
    assert data["phase"] == "0"


def test_optimize_not_implemented():
    response = client.post(
        "/v1/optimize",
        json={
            "plan_id": "test-uuid",
            "travel_date": "2026-05-02",
            "start_time": "09:00",
        },
    )
    assert response.status_code == 501


def test_matrix_not_implemented():
    response = client.post(
        "/v1/matrix",
        json={
            "place_ids": ["uuid-1", "uuid-2"],
            "travel_date": "2026-05-02",
        },
    )
    assert response.status_code == 501
