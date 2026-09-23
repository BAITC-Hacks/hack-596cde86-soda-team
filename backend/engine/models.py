"""Shared engine models. The engine does not depend on API or AI code."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Indicator = Literal["T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2"]
Direction = Literal["T", "E", "S", "B", "C"]


class Choice(BaseModel):
    model_config = ConfigDict(extra="forbid")
    measure_id: str
    district: str | None = None


class ValidationIssue(BaseModel):
    rule: str
    message: str


class ValidationResult(BaseModel):
    ok: bool
    errors: list[ValidationIssue]
    total_cost: int
    remaining_budget: int


class District(BaseModel):
    id: str
    name: str
    population_share: float
    profile: str
    indicators: dict[Indicator, float]


class Measure(BaseModel):
    id: str
    direction: Direction
    name: str
    scope: Literal["district", "city"]
    cost: int = Field(ge=0)
    lag: int = Field(ge=0)
    effects: dict[Indicator, float]


class Synergy(BaseModel):
    first: str
    second: str
    indicator: Indicator
    bonus: float


class Incompatibility(BaseModel):
    first: str
    second: str
    scope: Literal["city", "same_district"]


class CityData(BaseModel):
    budget: int
    horizon_quarters: int
    rules: dict[str, int]
    example_selection: list[Choice]
    weights: dict[Indicator, float]
    indicators: dict[Indicator, str]
    directions: dict[Direction, str]
    districts: list[District]
    measures: list[Measure]
    synergies: list[Synergy]
    incompatibilities: list[Incompatibility]


class CriticalIndicator(BaseModel):
    district_id: str
    indicator: Indicator
    value: float


class DistrictOutcome(BaseModel):
    id: str
    name: str
    population_share: float
    before: dict[Indicator, float]
    after: dict[Indicator, float]
    delta: dict[Indicator, float]
    score_before: float
    score_after: float


class SimulationResult(BaseModel):
    selection: list[Choice]
    total_cost: int
    remaining_budget: int
    horizon_quarters: int
    districts: list[DistrictOutcome]
    city_average: float
    weakest_district: str
    critical_count: int
    critical: list[CriticalIndicator]
    synergies: list[str]
    score: float
    base_score: float
    score_delta: float


class Contribution(BaseModel):
    measure_id: str
    district: str | None
    score_delta: float


class Comparison(BaseModel):
    score_a: float
    score_b: float
    score_delta: float
    district_score_deltas: dict[str, float]


class RankedSelection(BaseModel):
    selection: list[Choice]
    cost: int
    score: float


class Swap(BaseModel):
    from_choice: Choice
    to_choice: Choice
    new_score: float
    gain: float
