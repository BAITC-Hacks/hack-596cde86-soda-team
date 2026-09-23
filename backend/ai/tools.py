"""Read-only tool exposed to the model; all numbers come from the engine."""

from backend.engine import (
    Choice,
    contributions,
    find_best,
    load_data,
    simulate,
    suggest_swaps,
)


def scenario_facts(selection: list[Choice]) -> dict:
    data = load_data()
    measures = {measure.id: measure for measure in data.measures}
    result = simulate(selection)
    best = find_best(1)[0]
    return {
        "simulation": result.model_dump(mode="json"),
        "contributions": [
            item.model_dump(mode="json") for item in contributions(selection)
        ],
        "best": best.model_dump(mode="json"),
        "gap_to_best": best.score - result.score,
        "suggestions": [
            item.model_dump(mode="json") for item in suggest_swaps(selection)
        ],
        "selected_measures": [
            {
                "id": choice.measure_id,
                "name": measures[choice.measure_id].name,
                "lag": measures[choice.measure_id].lag,
                "cost": measures[choice.measure_id].cost,
            }
            for choice in selection
        ],
        "budget": data.budget,
        "selected_count": len(selection),
        "indicator_labels": data.indicators,
    }
