---
owner: Simon
reviewers: [TBD]
target_release: v1-mvp
status: draft
created: 2026-06-13
---

# project-bootstrap: Каркас репозиториев finAns-backend и finAns-frontend

## Зачем

Проекту finAns нужны два командных репозитория с единым скелетом, dev-окружением, CI, линтерами и тестами — до начала бизнес-фич (транзакции, теги, баланс). Репозитории на GitHub уже созданы, но пустые; без каркаса невозможно предсказуемо разрабатывать MVP.

## Что меняется

- Создаётся **finAns-backend** (Go + PostgreSQL): Clean Architecture, chi, sqlc, golang-migrate, Docker Compose, Makefile, golangci-lint, testify + mockery, testcontainers-go, Swagger, health-check, начальные миграции схемы ТЗ
- Создаётся **finAns-frontend** (React 18 + TypeScript + Vite): shadcn/ui, TanStack Table/Query, React Router, React Hook Form + Zod, layout-скелет MVP, CI
- Связь с platform: `.platform-link`, `AGENTS.md`, `README.md` в каждом репо
- Базовые соглашения: API `/api/v1/`, JSON errors, CORS для dev, locale ru

## Non-цели

- Бизнес-фичи MVP (транзакции, теги, баланс, платежи) — отдельные change'ы после bootstrap
- Auth (HTTP Basic / login) — change `auth-v1` (опционально)
- Графики, лимиты, уведомления — v2
- Production-деплой и HTTPS — отдельный change infra

## Capabilities

### Новые capabilities

- `bootstrap-backend`: каркас finAns-backend — Go, PostgreSQL, Clean Architecture, dev-окружение, CI, health-check, миграции, sqlc, тесты
- `bootstrap-frontend`: каркас finAns-frontend — React/TS/Vite, shadcn/ui, layout, API-клиент, CI

### Изменяемые capabilities

<!-- канонические bootstrap-* specs уже в openspec/specs/; delta уточняет технические детали -->

## Влияние

- **finAns-backend** (`workspace/finAns-backend/`): Go 1.22+, PostgreSQL 16, chi, sqlc, golang-migrate, zap/slog; Docker Compose, Makefile, GitHub Actions
- **finAns-frontend** (`workspace/finAns-frontend/`): React 18, TypeScript 5, Vite 6, Tailwind, shadcn/ui; GitHub Actions
- **finAns-platform**: delta-спеки → после archive в `openspec/specs/`
- **API**: `GET /api/v1/health` (backend); frontend настроен на `VITE_API_URL`
- **Зависимости**: все MVP change'ы опираются на этот bootstrap
