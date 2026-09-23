"""Collect all selection errors before any Score is calculated."""

from collections import Counter

from .data_loader import load_data
from .models import Choice, ValidationIssue, ValidationResult


def validate(selection: list[Choice]) -> ValidationResult:
    data = load_data()
    measures = {measure.id: measure for measure in data.measures}
    districts = {district.id for district in data.districts}
    errors: list[ValidationIssue] = []

    def issue(rule: str, message: str) -> None:
        errors.append(ValidationIssue(rule=rule, message=message))

    required = data.rules["required_choices"]
    if len(selection) != required:
        issue("count", f"Нужно выбрать ровно {required} мероприятий.")
    counts = Counter(choice.measure_id for choice in selection)
    for measure_id, count in counts.items():
        if count > 1:
            issue("duplicate", f"Мероприятие {measure_id} выбрано несколько раз.")

    total_cost = 0
    by_direction: Counter[str] = Counter()
    by_id: dict[str, Choice] = {}
    for choice in selection:
        measure = measures.get(choice.measure_id)
        if measure is None:
            issue("measure", f"Неизвестное мероприятие: {choice.measure_id}.")
            continue
        total_cost += measure.cost
        by_direction[measure.direction] += 1
        by_id[measure.id] = choice
        if measure.scope == "district" and choice.district not in districts:
            issue("district", f"Для {measure.id} нужно выбрать существующий район.")
        if measure.scope == "city" and choice.district is not None:
            issue("district", f"Для городской меры {measure.id} район не указывается.")

    if total_cost > data.budget:
        issue("budget", f"Стоимость {total_cost} превышает бюджет {data.budget}.")
    for direction, count in by_direction.items():
        if count > data.rules["max_per_direction"]:
            issue(
                "direction",
                f"В направлении {data.directions[direction]} выбрано больше {data.rules['max_per_direction']} мер.",
            )
    for conflict in data.incompatibilities:
        first = by_id.get(conflict.first)
        second = by_id.get(conflict.second)
        if (
            first
            and second
            and (conflict.scope == "city" or first.district == second.district)
        ):
            detail = (
                "в одном районе"
                if conflict.scope == "same_district"
                else "в одном сценарии"
            )
            issue(
                "incompatible",
                f"Меры {conflict.first} и {conflict.second} несовместимы {detail}.",
            )

    return ValidationResult(
        ok=not errors,
        errors=errors,
        total_cost=total_cost,
        remaining_budget=data.budget - total_cost,
    )
