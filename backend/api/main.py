"""HTTP boundary for the deterministic engine and optional AI explanation."""

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.ai.agent import explain
from backend.ai.tools import scenario_facts
from backend.engine import (
    Choice,
    baseline,
    compare,
    find_best,
    load_data,
    simulate,
    validate,
)

app = FastAPI(title="Аким на 5 часов", version="1.0.0")


class ScenarioRequest(BaseModel):
    selection: list[Choice]


class CompareRequest(BaseModel):
    left: list[Choice]
    right: list[Choice]


@app.exception_handler(RequestValidationError)
async def request_validation_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "errors": [
                {"rule": "request", "message": error["msg"]} for error in exc.errors()
            ]
        },
    )


def _require_valid(selection: list[Choice]) -> None:
    verdict = validate(selection)
    if not verdict.ok:
        raise HTTPException(
            status_code=422, detail=[error.model_dump() for error in verdict.errors]
        )


@app.exception_handler(HTTPException)
async def http_error_handler(_request: Request, exc: HTTPException):
    if exc.status_code == 422 and isinstance(exc.detail, list):
        return JSONResponse(status_code=422, content={"errors": exc.detail})
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/data")
def data():
    payload = load_data().model_dump(mode="json")
    payload["baseline"] = baseline().model_dump(mode="json")
    return payload


@app.post("/api/validate")
def validate_scenario(request: ScenarioRequest):
    return validate(request.selection)


@app.post("/api/simulate")
def simulate_scenario(request: ScenarioRequest):
    _require_valid(request.selection)
    return simulate(request.selection)


@app.post("/api/explain")
def explain_scenario(request: ScenarioRequest):
    _require_valid(request.selection)
    facts = scenario_facts(request.selection)
    mode, text = explain(facts)
    return {
        "mode": mode,
        "text": text,
        "score": facts["simulation"]["score"],
        "contributions": facts["contributions"],
        "best_score": facts["best"]["score"],
        "gap_to_best": facts["gap_to_best"],
        "suggestions": facts["suggestions"],
    }


@app.post("/api/compare")
def compare_scenarios(request: CompareRequest):
    _require_valid(request.left)
    _require_valid(request.right)
    result = compare(request.left, request.right)
    return {
        "left_score": result.score_a,
        "right_score": result.score_b,
        "score_delta": result.score_b - result.score_a,
        "better": "left" if result.score_a > result.score_b else "right" if result.score_b > result.score_a else "equal",
        "district_score_deltas": result.district_score_deltas,
    }


@app.get("/api/best")
def best(top_n: int = Query(default=5, ge=1, le=100)):
    return find_best(top_n)
