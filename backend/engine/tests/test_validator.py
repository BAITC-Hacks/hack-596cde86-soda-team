from backend.engine import Choice, load_data, validate

EXAMPLE = [
    Choice(measure_id="M7", district="nura"),
    Choice(measure_id="M8", district="nura"),
    Choice(measure_id="M10", district="nura"),
    Choice(measure_id="M12"),
    Choice(measure_id="M5", district="saryarka"),
]


def rules(selection):
    return {error.rule for error in validate(selection).errors}


def test_dataset_is_complete():
    data = load_data()
    assert len(data.districts) == 5
    assert len(data.measures) == 14
    assert sum(data.weights.values()) == 1
    assert sum(d.population_share for d in data.districts) == 1
    assert validate(data.example_selection).ok


def test_example_is_valid():
    assert validate(EXAMPLE).ok
    assert validate(EXAMPLE).total_cost == 95


def test_requires_exactly_five_measures():
    assert "count" in rules(EXAMPLE[:-1])


def test_rejects_duplicate_measure_even_in_another_district():
    choice = Choice(measure_id="M7", district="esil")
    assert "duplicate" in rules(EXAMPLE + [choice])


def test_rejects_budget_overrun():
    selection = [
        Choice(measure_id="M2"),
        Choice(measure_id="M3", district="nura"),
        Choice(measure_id="M5", district="saryarka"),
        Choice(measure_id="M7", district="esil"),
        Choice(measure_id="M8", district="nura"),
    ]
    assert "budget" in rules(selection)


def test_rejects_unknown_measure():
    assert "measure" in rules(EXAMPLE[:4] + [Choice(measure_id="unknown")])


def test_requires_known_district_for_local_measure():
    assert "district" in rules(EXAMPLE[:4] + [Choice(measure_id="M4")])
    assert "district" in rules(
        EXAMPLE[:4] + [Choice(measure_id="M4", district="unknown")]
    )


def test_city_measure_rejects_district():
    assert "district" in rules(
        EXAMPLE[:3] + [Choice(measure_id="M12", district="nura"), EXAMPLE[4]]
    )


def test_direction_limit():
    selection = [
        Choice(measure_id="M7", district="nura"),
        Choice(measure_id="M8", district="nura"),
        Choice(measure_id="M9", district="nura"),
        Choice(measure_id="M10", district="nura"),
        Choice(measure_id="M12"),
    ]
    assert "direction" in rules(selection)


def test_global_incompatibility():
    selection = [
        Choice(measure_id="M1", district="esil"),
        Choice(measure_id="M3", district="nura"),
        Choice(measure_id="M4", district="almaty"),
        Choice(measure_id="M10", district="nura"),
        Choice(measure_id="M12"),
    ]
    assert "incompatible" in rules(selection)


def test_same_district_incompatibility():
    assert "incompatible" in rules(
        EXAMPLE[:2] + [Choice(measure_id="M4", district="nura"), EXAMPLE[3], EXAMPLE[4]]
    )
    selection = EXAMPLE[:4] + [
        Choice(measure_id="M13", district="saryarka"),
        EXAMPLE[4],
    ]
    assert "incompatible" in rules(selection)


def test_same_district_rule_does_not_block_other_district():
    selection = EXAMPLE[:2] + [
        Choice(measure_id="M4", district="esil"),
        EXAMPLE[3],
        EXAMPLE[4],
    ]
    assert "incompatible" not in rules(selection)
