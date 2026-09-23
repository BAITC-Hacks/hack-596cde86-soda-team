"""Pure Score calculation from fully adjusted district indicators."""

from .models import CityData, CriticalIndicator


def calculate_score(
    after: dict[str, dict[str, float]], data: CityData
) -> tuple[float, float, str, list[CriticalIndicator], dict[str, float]]:
    district_scores = {
        district.id: sum(
            data.weights[key] * after[district.id][key] for key in data.weights
        )
        for district in data.districts
    }
    city_average = sum(
        district.population_share * district_scores[district.id]
        for district in data.districts
    )
    weakest = min(data.districts, key=lambda district: district_scores[district.id]).id
    critical = [
        CriticalIndicator(
            district_id=district.id, indicator=key, value=after[district.id][key]
        )
        for district in data.districts
        for key in data.weights
        if after[district.id][key] < data.rules["critical_threshold"]
    ]
    score = 0.7 * city_average + 0.3 * district_scores[weakest] - len(critical)
    return score, city_average, weakest, critical, district_scores
