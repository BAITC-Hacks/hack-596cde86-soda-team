import pytest

from backend.engine import Choice, baseline, compare, contributions, simulate

from .test_validator import EXAMPLE


def test_baseline_matches_reference():
    result = baseline()
    assert result.city_average == pytest.approx(56.862, abs=0.001)
    assert result.critical_count == 2
    assert result.score == pytest.approx(52.558, abs=0.001)
    assert result.districts[-1].score_after == pytest.approx(49.18, abs=0.001)
    assert result.districts[2].after["E2"] == 40


def test_example_matches_reference_and_triggers_synergy():
    result = simulate(EXAMPLE)
    assert result.score == pytest.approx(56.543, abs=0.001)
    assert result.total_cost == 95
    assert "M10+M12" in result.synergies
    nura = next(d for d in result.districts if d.id == "nura")
    assert nura.after["B1"] == pytest.approx(67.5)
    assert nura.after["S1"] == pytest.approx(48)


def test_optimum_reference():
    selection = [
        Choice(measure_id="M2"),
        Choice(measure_id="M3", district="nura"),
        Choice(measure_id="M8", district="nura"),
        Choice(measure_id="M9", district="nura"),
        Choice(measure_id="M14"),
    ]
    result = simulate(selection)
    assert result.total_cost == 98
    assert result.score == pytest.approx(57.237, abs=0.001)


def test_invalid_selection_has_no_score():
    with pytest.raises(ValueError, match="ровно 5"):
        simulate(EXAMPLE[:-1])


def test_selection_order_does_not_change_score():
    assert simulate(EXAMPLE).score == simulate(list(reversed(EXAMPLE))).score


def test_contributions_are_marginal_score_changes():
    full = simulate(EXAMPLE)
    items = contributions(EXAMPLE)
    assert len(items) == 5
    assert items[0].measure_id == "M7"
    assert items[0].score_delta > 0
    assert all(item.score_delta <= full.score - baseline().score for item in items)


def test_compare_reports_score_difference():
    result = compare(
        EXAMPLE,
        [
            Choice(measure_id="M2"),
            Choice(measure_id="M3", district="nura"),
            Choice(measure_id="M8", district="nura"),
            Choice(measure_id="M9", district="nura"),
            Choice(measure_id="M14"),
        ],
    )
    assert result.score_delta == pytest.approx(57.237 - 56.543, abs=0.002)
