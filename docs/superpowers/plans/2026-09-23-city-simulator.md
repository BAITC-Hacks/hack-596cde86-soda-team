# City Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить воспроизводимый симулятор пяти городских решений с детерминированным Score и объяснением.

**Architecture:** JSON → чистый Python engine → FastAPI → React. AI использует только результат серверных инструментов, fallback работает без ключа.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic 2, pytest, OpenAI SDK, React, TypeScript, Vite, Recharts, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-23-city-simulator-design.md`

## Global Constraints

- Бюджет 100, пять разных мер, не более двух из направления.
- JSON — источник исходных чисел; движок не использует сеть и LLM.
- Пользовательские тексты и README — на русском; кодовые идентификаторы — на английском.
- Секреты хранятся только локально; в репозитории есть `.env.example`.

## Review Focus

- Некорректный район у городской меры должен давать 422.
- Повтор меры с разными районами должен давать ошибку.
- Синергия не должна масштабироваться лагом.
- Критический порог ровно 40 не должен штрафоваться.
- Изменение порядка выбора не должно менять Score.

---

### Task 1: Данные, модели и валидация

**Files:** `data/*.json`, `backend/engine/models.py`, `data_loader.py`, `validator.py`, `backend/engine/tests/test_validator.py`.

**Interfaces:** `Choice(measure_id, district)`, `validate(selection) -> ValidationResult`, `load_data() -> CityData`.

- [x] Записать тесты отдельных правил и целостности датасета; запустить `pytest backend/engine/tests/test_validator.py -q` и увидеть отсутствие реализации.
- [x] Внести точные данные из приложения, модели и валидатор; повторить команду до зелёного результата.

### Task 2: Детерминированная симуляция и анализ

**Files:** `backend/engine/simulation.py`, `score.py`, `optimizer.py`, `backend/engine/tests/test_simulation.py`, `test_optimizer.py`.

**Interfaces:** `simulate`, `contributions`, `compare`, `find_best`, `suggest_swaps`.

- [x] Записать эталонные тесты для 52.558, 56.543, 57.237, порога 40, синергии и независимости порядка; получить ожидаемые падения.
- [x] Реализовать расчёт и анализ; запустить `pytest backend/engine/tests -q`.
- [x] Добавить тест полного перебора 694395 и оптимума; оптимизировать перебор при сохранении точной формулы.

### Task 3: API и объяснение

**Files:** `backend/api/main.py`, `backend/ai/{agent,tools,fallback}.py`, `backend/ai/prompts/system.md`, `backend/tests/test_api.py`, `backend/requirements.txt`.

**Interfaces:** шесть маршрутов `/api/*`; POST принимает `{"selection": [...]}`.

- [x] Записать тесты маршрутов, 422 и fallback; увидеть падение.
- [x] Реализовать API, серверные инструменты и вызов OpenAI с таймаутом; запустить `pytest backend -q`.

### Task 4: Интерфейс и запуск

**Files:** `frontend/*`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env.example`, `README.md`.

**Interfaces:** UI получает `/api/data`, отправляет выбор в `/api/validate`, `/api/simulate` и `/api/explain`; `/api/best` даёт оптимум.

- [x] Реализовать выбор пяти мер, валидацию, расчёт и результаты с доступными состояниями.
- [x] Запустить `pnpm run build`, `pytest backend -q`, проверить HTTP-сценарий и описать воспроизведение в README.
