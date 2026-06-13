## Context

finAns стартует с нуля: репозитории `finAns-backend` и `finAns-frontend` на GitHub пустые.
Platform-репо (`finAns-platform`) содержит канонические спеки из ТЗ v1.0.
Локальные клоны — `workspace/finAns-{backend,frontend}/` после `make init`.

Первые бизнес-change'ы (транзакции, теги, баланс) зависят от инфраструктурного каркаса,
но сами фичи — вне scope bootstrap.

## Goals / Non-Goals

**Goals:**

- Два репозитория с воспроизводимым dev-окружением (`make up` / `npm run dev`)
- Backend: Go best practices — Clean Architecture, sqlc, миграции, линтер, тесты, Swagger
- Frontend: React + TypeScript + Vite + shadcn/ui — оптимальный выбор для сложных таблиц и форм
- CI в GitHub Actions для обоих репо
- `.platform-link` + AGENTS.md в командных репо
- Начальная SQL-схема из ТЗ (все таблицы, без seed-данных бизнес-логики)

**Non-Goals:**

- Реализация CRUD бизнес-сущностей
- Auth middleware (заготовка CORS достаточна)
- S3/MinIO для файлов — локальный `uploads/` stub в backend

## Decisions

### D1: Go + chi + sqlc + Clean Architecture

**Решение:** chi (легковесный router), sqlc (типобезопасные SQL), слои handler → service → repository.

**Альтернативы:** gin (аналог chi); GORM (тяжёлый ORM — отклонён по ТЗ); ent (overkill для MVP).

**Структура:**

```
cmd/app/main.go
internal/
  config/       # viper + .env
  domain/       # entities, repository interfaces
  dto/          # request/response
  handler/      # HTTP handlers (chi)
  service/      # business logic (пусто на bootstrap)
  repository/   # sqlc implementations
  middleware/   # cors, logging, recover
db/
  migrations/   # golang-migrate SQL
  queries/      # sqlc .sql
  schema/       # sqlc schema
migrations/     # symlink или дубль для migrate CLI
```

**Обоснование:** [Go Standard Project Layout](https://github.com/golang-standards/project-layout) + Clean Architecture — industry standard для Go API.

### D2: PostgreSQL 16 + golang-migrate

**Решение:** Docker Compose postgres:16-alpine; миграции в `db/migrations/`.

**Альтернативы:** goose, atlas — golang-migrate указан в ТЗ.

### D3: slog (stdlib) вместо zap на bootstrap

**Решение:** `log/slog` с JSON handler в production, text в dev.

**Альтернативы:** zap — мощнее, но slog достаточен для single-user app; можно мигрировать позже.

### D4: React + TypeScript + Vite (не «проще»)

**Решение:** React 18 + TS + Vite + shadcn/ui + TanStack.

**Рассмотренные альтернatives:**

| Вариант | Плюсы | Минусы для finAns |
|---------|-------|-------------------|
| **Refine** | Быстрый CRUD-admin из коробки | Сложнее кастомизировать дерево тегов, матрицу платежей, графики v2 |
| **Ant Design Pro** | Готовые таблицы/формы | Тяжёлый bundle, сложная визуальная кастомизация |
| **HTMX + Go templates** | Минимум JS | Плохо для real-time баланса, сложных фильтров в URL, SPA UX |
| **Vue 3** | Проще порог входа | Меньше готовых решений для admin-table + tree + charts в одном стеке |

**Вывод:** React + TS — не самый «быстрый старт», но **оптимальный** для ТЗ (таблицы, фильтры, деревья, графики). Bootstrap ускоряем shadcn/ui + TanStack, не меняя стек.

### D5: Feature-based структура frontend

```
src/
  app/           # providers, router
  components/    # ui/ (shadcn), layout/
  features/      # transactions/, tags/, ... (placeholder pages)
  lib/           # api-client, utils
  hooks/
```

### D6: API conventions

- Prefix: `/api/v1/`
- Errors: `{ "error": { "code", "message" } }`
- Health: `GET /api/v1/health` → `{ "status": "ok", "version": "..." }`
- CORS: разрешить `http://localhost:5173` (Vite dev)

### D7: Тестовая стратегия backend

- Unit: service layer (mockery mocks) — цель 70% после первых сервисов
- Integration: testcontainers-go PostgreSQL для repository (1 smoke на bootstrap)
- Smoke: health-check HTTP test

### D8: CI — GitHub Actions

Оба репо на GitHub → `.github/workflows/ci.yml`.

## Risks / Trade-offs

| Риск | Митигация |
|------|-----------|
| sqlc learning curve | Начать с простых queries; Makefile target `sqlc` |
| shadcn setup time | Инициализировать CLI один раз; зафиксировать components list |
| Пустые репо без main | Первый коммит bootstrap создаёт main |
| React «медленнее» Refine | Экономия на кастомизации позже перевешивает |

## Migration Plan

1. Scaffold finAns-backend: go mod, структура, Docker, Makefile
2. SQL migrations — полная схема ТЗ
3. sqlc generate + health handler
4. CI + push → `main` на GitHub
5. Scaffold finAns-frontend: Vite react-ts, shadcn, layout, placeholders
6. CI + push → `main` на GitHub

## Open Questions

- [ ] Имя бинарника / Docker image tag convention — `finans-api`?
- [ ] Единый docker-compose в backend или отдельный infra-репо позже?
