from fastapi.testclient import TestClient

from backend.api.main import app
from backend.engine.tests.test_validator import EXAMPLE

client = TestClient(app)
EXAMPLE_JSON = {"selection": [choice.model_dump() for choice in EXAMPLE]}


def test_health_and_data_expose_same_start_for_everyone():
    assert client.get("/api/health").json() == {"status": "ok"}
    first = client.get("/api/data")
    second = client.get("/api/data")
    assert first.status_code == 200
    assert first.json() == second.json()
    assert first.json()["budget"] == 100
    assert len(first.json()["measures"]) == 14


def test_validate_collects_errors():
    response = client.post(
        "/api/validate", json={"selection": EXAMPLE_JSON["selection"][:-1]}
    )
    assert response.status_code == 200
    assert response.json()["ok"] is False
    assert response.json()["errors"][0]["rule"] == "count"


def test_simulate_returns_reference_score():
    response = client.post("/api/simulate", json=EXAMPLE_JSON)
    assert response.status_code == 200
    assert round(response.json()["score"], 3) == 56.543


def test_simulate_rejects_invalid_scenario_with_422():
    response = client.post(
        "/api/simulate", json={"selection": EXAMPLE_JSON["selection"][:-1]}
    )
    assert response.status_code == 422
    assert response.json()["errors"][0]["rule"] == "count"


def test_unknown_district_in_city_measure_returns_422():
    scenario = [dict(choice) for choice in EXAMPLE_JSON["selection"]]
    scenario[3]["district"] = "nura"
    response = client.post("/api/simulate", json={"selection": scenario})
    assert response.status_code == 422
    assert any(error["rule"] == "district" for error in response.json()["errors"])


def test_explain_without_key_uses_engine_fallback(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.post("/api/explain", json=EXAMPLE_JSON)
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "fallback"
    assert "56,54" in body["text"]
    assert "Нура" in body["text"]
    assert body["contributions"]
    assert body["best_score"] >= body["score"]


def test_best_endpoint_returns_reference_scenario():
    response = client.get("/api/best")
    assert response.status_code == 200
    assert round(response.json()[0]["score"], 3) == 57.237
