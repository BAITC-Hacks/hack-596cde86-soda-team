"""Load and validate the one authoritative synthetic dataset."""

import json
from functools import lru_cache
from pathlib import Path

from .models import CityData

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@lru_cache(maxsize=1)
def load_data() -> CityData:
    weights = json.loads((DATA_DIR / "weights.json").read_text(encoding="utf-8"))
    districts = json.loads((DATA_DIR / "districts.json").read_text(encoding="utf-8"))
    catalog = json.loads((DATA_DIR / "measures.json").read_text(encoding="utf-8"))
    data = CityData(
        budget=weights["budget"],
        horizon_quarters=weights["horizon_quarters"],
        rules=weights["rules"],
        example_selection=weights["example_selection"],
        weights=weights["indicator_weights"],
        indicators=weights["indicators"],
        directions=weights["directions"],
        districts=districts,
        measures=catalog["measures"],
        synergies=catalog["synergies"],
        incompatibilities=catalog["incompatibilities"],
    )
    indicator_ids = set(data.weights)
    district_ids = [district.id for district in data.districts]
    measure_ids = [measure.id for measure in data.measures]
    if abs(sum(data.weights.values()) - 1) > 1e-9:
        raise ValueError("Indicator weights must sum to one")
    if abs(sum(d.population_share for d in data.districts) - 1) > 1e-9:
        raise ValueError("Population shares must sum to one")
    if len(district_ids) != len(set(district_ids)) or len(measure_ids) != len(
        set(measure_ids)
    ):
        raise ValueError("District and measure identifiers must be unique")
    if set(data.indicators) != indicator_ids:
        raise ValueError("Indicator labels do not match weights")
    if any(set(d.indicators) != indicator_ids for d in data.districts):
        raise ValueError("Each district needs every indicator")
    if any(not set(m.effects) <= indicator_ids for m in data.measures):
        raise ValueError("Unknown indicator in a measure")
    if any(m.lag > data.horizon_quarters for m in data.measures):
        raise ValueError("Measure lag exceeds the simulation horizon")
    if any(
        s.first not in measure_ids or s.second not in measure_ids
        for s in data.synergies
    ):
        raise ValueError("Unknown measure in synergy")
    if any(
        i.first not in measure_ids or i.second not in measure_ids
        for i in data.incompatibilities
    ):
        raise ValueError("Unknown measure in incompatibility")
    return data
