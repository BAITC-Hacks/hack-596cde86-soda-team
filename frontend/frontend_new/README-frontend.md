# Frontend — «Аким на 5 часов»

React 18 + TypeScript (strict) + Vite. Все данные и все числа приходят из API — во фронтенде нет данных датасета и нет расчёта Score.

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173, /api проксируется на http://localhost:8000
npm run build        # tsc + vite build → dist/
```

Другой адрес бэкенда: `VITE_PROXY_TARGET=http://host:port npm run dev` (dev-прокси) или `VITE_API_URL=http://host:port` (прямые запросы при сборке).

Docker: `Dockerfile` собирает статику и отдаёт её через nginx; `/api/` проксируется на сервис `backend:8000` (имя сервиса в `docker-compose.yml`).

## Структура

```
src/
  api/types.ts        контракты API (сверять с backend/engine/models.py)
  api/client.ts       fetch + таймаут 15 с + ApiError
  hooks/              useGameData, useLiveSimulation (живой прогноз), useAnimatedNumber
  lib/rules.ts        какие карточки можно нажать сейчас (итоговая проверка — /api/validate)
  lib/constants.ts    правила игры: 5 ячеек, ≤2 на направление, порог 40
  lib/directions.ts   цвета направлений
  components/         TopNav, Hud, Catalog, MeasureCard, SetPanel, DistrictMap, ExplainDrawer, IsoIcon
```

## Используемые эндпоинты

| Метод | Путь | Где используется |
|---|---|---|
| GET | `/api/data` | каталог, районы, показатели, бюджет, горизонт, синергии, несовместимости |
| GET | `/api/best?top_n=1` | «оптимум» в HUD и в итоге |
| POST | `/api/validate` | на каждое изменение набора (ошибки до отправки) |
| POST | `/api/simulate` | кнопка «Рассчитать Score» (422 → ошибки из `errors[]`) |
| POST | `/api/explain` | «Разбор агента» → `{ text, source: "llm" \| "fallback" }` |
| POST | `/api/preview` | **новый, нужен зоне B** — живой Score и вклад мер |

### Что нужно добавить в API (зона B)

`/api/simulate` по правилам возвращает 422 для неполного набора, поэтому живой прогноз при 0–4 мерах и подсказки «+0.42 к Score» на карточках без отдельного эндпоинта невозможны. Нужен `POST /api/preview`:

- тело: `{ "selection": Choice[] }`;
- расчёт тем же движком, но **без** правил «ровно 5» и «бюджет ≤ 100» (несовместимости можно оставить);
- ответ — `SimulationResult` плюс:
  - `contributions: { [measure_id]: number }` — `engine.contributions()` для мер в наборе;
  - `candidates: [{ measure_id, district, delta }]` — `Score(набор + мера в районе) − Score(набор)` для каждой меры не из набора и каждого допустимого района (`district: null` для городских мер).

Пока эндпоинта нет (404), фронт работает в упрощённом режиме: Score в HUD появляется только для полного валидного набора, а в подсказках карточек пишется «Прогноз вклада недоступен».

Ожидаемые поля `SimulationResult`: `score`, `base_score`, `d_avg`, `d_min`, `n_crit`, `districts[] { name, before, after, d_before, d_after }`. Если в `models.py` имена полей другие, поменять нужно только `src/api/types.ts`.
