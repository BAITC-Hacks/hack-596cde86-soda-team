"""Russian explanation assembled entirely from deterministic engine results."""


def _number(value: float) -> str:
    return f"{value:.2f}".replace(".", ",")


def render_fallback(facts: dict) -> str:
    result = facts["simulation"]
    districts = result["districts"]
    by_id = {district["id"]: district for district in districts}
    weakest = by_id[result["weakest_district"]]
    biggest_gain = max(
        districts,
        key=lambda district: district["score_after"] - district["score_before"],
    )
    lagged = [measure for measure in facts["selected_measures"] if measure["lag"] >= 3]
    critical = result["critical"]
    suggestions = facts["suggestions"]
    lines = [
        (
            f"Итоговый Astana Quality of Life Score: {_number(result['score'])}. "
            f"Прирост к базе: {_number(result['score_delta'])}. "
            f"Из бюджета {facts['budget']} потрачено {result['total_cost']}; остаток {result['remaining_budget']} не даёт бонуса."
        ),
        "",
        "Сильные стороны. "
        f"Наибольший прирост районной оценки — в районе {biggest_gain['name']}: "
        f"с {_number(biggest_gain['score_before'])} до {_number(biggest_gain['score_after'])}. "
        + (
            f"Сработали синергии: {', '.join(result['synergies'])}."
            if result["synergies"]
            else "Дополнительных синергий нет."
        ),
        "",
        "Риски. "
        + (
            "После мер остаются критические значения: "
            + "; ".join(
                f"{by_id[item['district_id']]['name']} — {facts['indicator_labels'][item['indicator']]} "
                f"({_number(item['value'])})"
                for item in critical
            )
            + "."
            if critical
            else "Показателей ниже критического порога после мер нет."
        ),
        "",
        "Компромиссы. "
        + (
            "Эффект мер "
            + ", ".join(item["id"] for item in lagged)
            + " проявляется с задержкой; на выбранном горизонте учитывается лишь его часть."
            if lagged
            else "Выбранные меры дают эффект в пределах короткого горизонта модели."
        ),
        "",
        (
            f"Слабейший район после решений — {weakest['name']}: оценка "
            f"{_number(weakest['score_after'])}. Вес слабейшего района в итоговой формуле "
            "создаёт стимул закрывать его провалы."
        ),
        "",
        (
            f"Сравнение с оптимумом. Лучший найденный набор даёт {_number(facts['best']['score'])}; "
            f"разрыв составляет {_number(facts['gap_to_best'])}."
        ),
    ]
    if suggestions:
        first = suggestions[0]
        place = (
            f" в районе {by_id[first['to_choice']['district']]['name']}"
            if first["to_choice"]["district"]
            else " для всего города"
        )
        lines.extend(
            [
                "",
                (
                    f"Возможная замена: {first['from_choice']['measure_id']} → "
                    f"{first['to_choice']['measure_id']}{place}. "
                    f"Она повышает Score на {_number(first['gain'])} до {_number(first['new_score'])} "
                    "при соблюдении ограничений."
                ),
            ]
        )
    else:
        lines.extend(
            ["", "Локальных замен одной меры с улучшением результата не найдено."]
        )
    lines.extend(
        [
            "",
            "Это условный сценарий на синтетических данных, а не прогноз для реальной Астаны.",
        ]
    )
    return "\n".join(lines)
