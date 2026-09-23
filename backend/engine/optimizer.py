"""Exhaustive search over the finite, rule-compliant decision space."""

from collections import Counter
from collections.abc import Iterator
from functools import lru_cache
from heapq import heappush, heapreplace
from itertools import combinations, product

from .data_loader import load_data
from .models import Choice, RankedSelection, Swap
from .simulation import simulate
from .validator import validate


def _valid_selections() -> Iterator[list[Choice]]:
    data = load_data()
    district_ids = [district.id for district in data.districts]
    for group in combinations(data.measures, data.rules["required_choices"]):
        if sum(measure.cost for measure in group) > data.budget:
            continue
        if (
            max(Counter(measure.direction for measure in group).values())
            > data.rules["max_per_direction"]
        ):
            continue
        ids = {measure.id for measure in group}
        if any(
            conflict.scope == "city" and {conflict.first, conflict.second} <= ids
            for conflict in data.incompatibilities
        ):
            continue
        local = [measure for measure in group if measure.scope == "district"]
        conflicts = [
            conflict
            for conflict in data.incompatibilities
            if conflict.scope == "same_district"
            and conflict.first in ids
            and conflict.second in ids
        ]
        for assigned in product(district_ids, repeat=len(local)):
            districts = dict(
                zip((measure.id for measure in local), assigned, strict=True)
            )
            if any(
                districts[conflict.first] == districts[conflict.second]
                for conflict in conflicts
            ):
                continue
            yield [
                Choice(measure_id=measure.id, district=districts.get(measure.id))
                for measure in group
            ]


@lru_cache(maxsize=1)
def search_space_size() -> int:
    return sum(1 for _ in _valid_selections())


@lru_cache(maxsize=1)
def _fast_context():
    data = load_data()
    indicator_ids = list(data.weights)
    district_ids = [district.id for district in data.districts]
    district_index = {
        district_id: index for index, district_id in enumerate(district_ids)
    }
    indicator_index = {
        indicator: index for index, indicator in enumerate(indicator_ids)
    }
    base = tuple(
        tuple(district.indicators[indicator] for indicator in indicator_ids)
        for district in data.districts
    )
    effects = {}
    for measure in data.measures:
        delta = [
            (
                indicator_index[indicator],
                value * (data.horizon_quarters - measure.lag) / data.horizon_quarters,
            )
            for indicator, value in measure.effects.items()
        ]
        targets = [None] if measure.scope == "city" else district_ids
        for district_id in targets:
            target_indices = (
                range(len(district_ids))
                if district_id is None
                else [district_index[district_id]]
            )
            effects[(measure.id, district_id)] = tuple(
                (district_number, indicator_number, value)
                for district_number in target_indices
                for indicator_number, value in delta
            )
    synergies = tuple(
        (item.first, item.second, indicator_index[item.indicator], item.bonus)
        for item in data.synergies
    )
    return (
        base,
        tuple(data.weights.values()),
        tuple(district.population_share for district in data.districts),
        data.rules["critical_threshold"],
        district_index,
        effects,
        synergies,
    )


def _fast_score(selection: list[Choice]) -> float:
    base, weights, shares, threshold, district_index, effects, synergies = (
        _fast_context()
    )
    after = [list(row) for row in base]
    selected = {choice.measure_id: choice for choice in selection}
    for choice in selection:
        for district, indicator, value in effects[(choice.measure_id, choice.district)]:
            after[district][indicator] += value
    for first, second, indicator, bonus in synergies:
        if first in selected and second in selected:
            after[district_index[selected[first].district]][indicator] += bonus
    district_scores = []
    critical_count = 0
    for row in after:
        clipped = [max(0.0, min(100.0, value)) for value in row]
        district_scores.append(
            sum(weight * value for weight, value in zip(weights, clipped, strict=True))
        )
        critical_count += sum(value < threshold for value in clipped)
    average = sum(
        share * value for share, value in zip(shares, district_scores, strict=True)
    )
    return 0.7 * average + 0.3 * min(district_scores) - critical_count


@lru_cache(maxsize=1)
def _search() -> tuple[tuple[RankedSelection, ...], RankedSelection]:
    top: list[tuple[float, int, list[Choice]]] = []
    lowest: tuple[float, list[Choice]] | None = None
    for index, selection in enumerate(_valid_selections()):
        score = _fast_score(selection)
        if lowest is None or score < lowest[0]:
            lowest = (score, selection)
        record = (score, index, selection)
        if len(top) < 100:
            heappush(top, record)
        elif score > top[0][0]:
            heapreplace(top, record)
    ranked = sorted(top, key=lambda item: (-item[0], item[1]))
    data = load_data()
    costs = {measure.id: measure.cost for measure in data.measures}
    ranked = tuple(
        RankedSelection(
            selection=selection,
            cost=sum(costs[choice.measure_id] for choice in selection),
            score=score,
        )
        for score, _, selection in ranked
    )
    if lowest is None:
        raise RuntimeError("No valid selection exists")
    worst_score, worst_selection = lowest
    worst = RankedSelection(
        selection=worst_selection,
        cost=sum(costs[choice.measure_id] for choice in worst_selection),
        score=worst_score,
    )
    return ranked, worst


def find_best(top_n: int = 5) -> list[RankedSelection]:
    if not 1 <= top_n <= 100:
        raise ValueError("top_n должен быть от 1 до 100")
    return list(_search()[0][:top_n])


def find_worst() -> RankedSelection:
    return _search()[1]


def suggest_swaps(selection: list[Choice]) -> list[Swap]:
    original_score = simulate(selection).score
    data = load_data()
    options = [
        Choice(measure_id=measure.id, district=district_id)
        for measure in data.measures
        for district_id in (
            [district.id for district in data.districts]
            if measure.scope == "district"
            else [None]
        )
    ]
    result = []
    for position, old in enumerate(selection):
        for new in options:
            if new == old:
                continue
            candidate = list(selection)
            candidate[position] = new
            if not validate(candidate).ok:
                continue
            score = _fast_score(candidate)
            if score > original_score + 1e-9:
                result.append(
                    Swap(
                        from_choice=old,
                        to_choice=new,
                        new_score=score,
                        gain=score - original_score,
                    )
                )
    result.sort(
        key=lambda swap: (
            -swap.gain,
            swap.to_choice.measure_id,
            swap.to_choice.district or "",
        )
    )
    return result[:5]
