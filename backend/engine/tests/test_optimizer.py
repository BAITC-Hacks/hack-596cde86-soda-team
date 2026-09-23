import pytest

from backend.engine import (
    Choice,
    find_best,
    find_worst,
    search_space_size,
    suggest_swaps,
    validate,
)

from .test_validator import EXAMPLE


def test_cheapest_known_selection_is_valid():
    selection = [
        Choice(measure_id="M9", district="nura"),
        Choice(measure_id="M11", district="nura"),
        Choice(measure_id="M10", district="nura"),
        Choice(measure_id="M12"),
        Choice(measure_id="M4", district="esil"),
    ]
    verdict = validate(selection)
    assert verdict.ok
    assert verdict.total_cost == 61


def test_full_search_space_count_matches_reference():
    assert search_space_size() == 694_395


def test_full_search_finds_reference_optimum():
    best = find_best(1)[0]
    assert best.score == pytest.approx(57.237, abs=0.001)
    assert best.cost == 98
    assert {(c.measure_id, c.district) for c in best.selection} == {
        ("M2", None),
        ("M3", "nura"),
        ("M8", "nura"),
        ("M9", "nura"),
        ("M14", None),
    }


def test_worst_valid_scenario_is_below_baseline():
    worst = find_worst()
    assert worst.score == pytest.approx(52.04, abs=0.03)
    assert validate(worst.selection).ok


def test_swaps_improve_score_and_stay_valid():
    swaps = suggest_swaps(EXAMPLE)
    assert swaps
    assert all(swap.gain > 0 for swap in swaps)
    for swap in swaps:
        selection = [
            swap.to_choice if choice == swap.from_choice else choice
            for choice in EXAMPLE
        ]
        assert validate(selection).ok
