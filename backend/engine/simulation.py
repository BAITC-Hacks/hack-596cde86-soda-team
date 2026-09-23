"""Apply lagged effects, synergies and the final deterministic Score."""

from functools import lru_cache

from .data_loader import load_data
from .models import Choice, Comparison, Contribution, DistrictOutcome, SimulationResult
from .score import calculate_score
from .validator import validate


def _simulate_unchecked(selection: list[Choice]) -> SimulationResult:
    data = load_data()
    measures = {measure.id: measure for measure in data.measures}
    adjusted: dict[str, dict[str, float]] = {
        district.id: dict(district.indicators) for district in data.districts
    }

    for choice in selection:
        measure = measures[choice.measure_id]
        targets = (
            [choice.district]
            if measure.scope == "district"
            else [district.id for district in data.districts]
        )
        factor = (data.horizon_quarters - measure.lag) / data.horizon_quarters
        for district_id in targets:
            for indicator, effect in measure.effects.items():
                adjusted[district_id][indicator] += effect * factor

    by_id = {choice.measure_id: choice for choice in selection}
    synergies: list[str] = []
    for synergy in data.synergies:
        if synergy.first not in by_id or synergy.second not in by_id:
            continue
        first = measures[synergy.first]
        targets = (
            [by_id[synergy.first].district]
            if first.scope == "district"
            else [district.id for district in data.districts]
        )
        for district_id in targets:
            adjusted[district_id][synergy.indicator] += synergy.bonus
        synergies.append(f"{synergy.first}+{synergy.second}")

    for indicators in adjusted.values():
        for indicator, value in indicators.items():
            indicators[indicator] = max(0.0, min(100.0, value))

    score, city_average, weakest, critical, district_scores = calculate_score(
        adjusted, data
    )
    districts = [
        DistrictOutcome(
            id=district.id,
            name=district.name,
            population_share=district.population_share,
            before=district.indicators,
            after=adjusted[district.id],
            delta={
                key: adjusted[district.id][key] - district.indicators[key]
                for key in data.weights
            },
            score_before=sum(
                data.weights[key] * district.indicators[key] for key in data.weights
            ),
            score_after=district_scores[district.id],
        )
        for district in data.districts
    ]
    cost = sum(measures[choice.measure_id].cost for choice in selection)
    return SimulationResult(
        selection=selection,
        total_cost=cost,
        remaining_budget=data.budget - cost,
        horizon_quarters=data.horizon_quarters,
        districts=districts,
        city_average=city_average,
        weakest_district=weakest,
        critical_count=len(critical),
        critical=critical,
        synergies=synergies,
        score=score,
        base_score=score,
        score_delta=0,
    )


@lru_cache(maxsize=1)
def baseline() -> SimulationResult:
    """Reference state; empty selections are not valid user scenarios."""
    return _simulate_unchecked([])


def simulate(selection: list[Choice]) -> SimulationResult:
    verdict = validate(selection)
    if not verdict.ok:
        raise ValueError("; ".join(error.message for error in verdict.errors))
    result = _simulate_unchecked(selection)
    result.base_score = baseline().score
    result.score_delta = result.score - result.base_score
    return result


def contributions(selection: list[Choice]) -> list[Contribution]:
    result = simulate(selection)
    return [
        Contribution(
            measure_id=choice.measure_id,
            district=choice.district,
            score_delta=result.score
            - _simulate_unchecked(
                [other for index, other in enumerate(selection) if index != offset]
            ).score,
        )
        for offset, choice in enumerate(selection)
    ]


def compare(a: list[Choice], b: list[Choice]) -> Comparison:
    first, second = simulate(a), simulate(b)
    first_scores = {district.id: district.score_after for district in first.districts}
    return Comparison(
        score_a=first.score,
        score_b=second.score,
        score_delta=second.score - first.score,
        district_score_deltas={
            district.id: district.score_after - first_scores[district.id]
            for district in second.districts
        },
    )
