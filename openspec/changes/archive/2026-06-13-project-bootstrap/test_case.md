# Тест-кейсы: project-bootstrap

**Окружение:** dev (local Docker + Vite)  
**Данные:** пустая БД после миграций, без бизнес-seed

---

## 1. Backend — dev-окружение и health-check

<!-- spec: bootstrap-backend -->

### TC-01: Dev-окружение поднимается

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | Smoke |
| **Спека** | `bootstrap-backend` → Scenario: «Postgres healthy» |
| **Предусловия** | Docker установлен, `workspace/finAns-backend/` с bootstrap-кодом |
| **Шаги** | 1. `make up` 2. Дождаться healthy postgres |
| **Ожидаемый результат** | PostgreSQL 16 running; API контейнер или `make run` доступен |
| **Статус** | ☐ |

### TC-02: Health-check endpoint

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | API |
| **Спека** | `bootstrap-backend` → Scenario: «Точка входа приложения» |
| **Предусловия** | `make up && make migrate && make run` |
| **Шаги** | 1. `GET /api/v1/health` |
| **Ожидаемый результат** | HTTP 200, JSON `{ "status": "ok", ... }`, поле db указывает на доступность PostgreSQL |
| **Статус** | ☐ |

### TC-03: Миграции создают схему ТЗ

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | DB |
| **Спека** | `bootstrap-backend` → Scenario: «Применение миграций» |
| **Предусловия** | Postgres running |
| **Шаги** | 1. `make migrate` 2. `\dt` в psql |
| **Ожидаемый результат** | Таблицы: tags, transactions, spending_limits, mandatory_payments, mandatory_payment_statuses, planned_expenses, user_balance |
| **Статус** | ☐ |

### TC-04: JSON error на 404

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | API |
| **Спека** | `bootstrap-backend` → Scenario: «404 на неизвестный маршрут» |
| **Предусловия** | API running |
| **Шаги** | 1. `GET /api/v1/nonexistent` |
| **Ожидаемый результат** | HTTP 404, JSON `{ "error": { "code", "message" } }` |
| **Статус** | ☐ |

### TC-05: golangci-lint проходит

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | CI |
| **Спека** | `bootstrap-backend` → Scenario: «Блокировка при падении lint» |
| **Предусловия** | Bootstrap-код закоммичен |
| **Шаги** | 1. `make lint` |
| **Ожидаемый результат** | Exit code 0 |
| **Статус** | ☐ |

### TC-06: sqlc generate

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | Build |
| **Спека** | `bootstrap-backend` → Scenario: «Генерация sqlc» |
| **Предусловия** | sqlc установлен |
| **Шаги** | 1. `make sqlc` |
| **Ожидаемый результат** | Код в `internal/repository/sqlc/` регенерирован без ошибок |
| **Статус** | ☐ |

---

## 2. Backend — тесты

<!-- spec: bootstrap-backend -->

### TC-07: Unit-тест health handler

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | Unit |
| **Спека** | `bootstrap-backend` → тестовая стратегия design D7 |
| **Предусловия** | Код handler написан |
| **Шаги** | 1. `make test` |
| **Ожидаемый результат** | Health handler test green |
| **Статус** | ☐ |

### TC-08: Integration test testcontainers

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | Integration |
| **Спека** | `bootstrap-backend` → Scenario: «Покрытие сервисного слоя» (bootstrap: DB smoke) |
| **Предусловия** | Docker для testcontainers |
| **Шаги** | 1. `make test` (integration package) |
| **Ожидаемый результат** | Postgres container поднимается, ping успешен |
| **Статус** | ☐ |

---

## 3. Frontend — сборка и layout

<!-- spec: bootstrap-frontend -->

### TC-09: Dev-сервер стартует

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | Smoke |
| **Спека** | `bootstrap-frontend` → Scenario: «Dev-сервер» |
| **Предусловия** | `npm install` выполнен |
| **Шаги** | 1. `npm run dev` 2. Открыть localhost:5173 |
| **Ожидаемый результат** | Приложение загружается с layout (header + sidebar) |
| **Статус** | ☐ |

### TC-10: Production build

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | Build |
| **Спека** | `bootstrap-frontend` → Scenario: «Production build» |
| **Предусловия** | Исходники на месте |
| **Шаги** | 1. `npm run build` |
| **Ожидаемый результат** | `dist/` без ошибок TypeScript |
| **Статус** | ☐ |

### TC-11: Навигация placeholder-страниц

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | UI |
| **Спека** | `bootstrap-frontend` → Scenario: «Навигация между placeholder-страницами» |
| **Предусловия** | Dev-сервер running |
| **Шаги** | 1. Кликнуть «Теги» в sidebar 2. Кликнуть «Транзакции» |
| **Ожидаемый результат** | URL меняется, контент placeholder обновляется без reload |
| **Статус** | ☐ |

### TC-12: Health-check с фронта

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | Integration |
| **Спека** | `bootstrap-frontend` → Scenario: «Health-check с фронта» |
| **Предусловия** | Backend running, `VITE_API_URL` настроен |
| **Шаги** | 1. Открыть приложение 2. Проверить индикатор HealthStatus |
| **Ожидаемый результат** | Отображается успешный статус API |
| **Статус** | ☐ |

### TC-13: ESLint в CI

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | CI |
| **Спека** | `bootstrap-frontend` → Scenario: «Lint в CI» |
| **Предусловия** | CI workflow настроен |
| **Шаги** | 1. `npm run lint` |
| **Ожидаемый результат** | Exit code 0 |
| **Статус** | ☐ |

### TC-14: TypeScript strict

| | |
|---|---|
| **Приоритет** | P0 |
| **Тип** | Build |
| **Спека** | `bootstrap-frontend` → Scenario: «TypeScript strict mode» |
| **Предусловия** | tsconfig strict |
| **Шаги** | 1. `npx tsc --noEmit` |
| **Ожидаемый результат** | Нет ошибок типов |
| **Статус** | ☐ |

---

## 4. Platform-link и onboarding

<!-- spec: bootstrap-backend -->

### TC-15: platform-link в backend

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | Config |
| **Спека** | proposal → platform-link |
| **Предусловия** | Bootstrap завершён |
| **Шаги** | 1. Проверить `.platform-link` в finAns-backend |
| **Ожидаемый результат** | YAML указывает на finAns-platform, paths openspec корректны |
| **Статус** | ☐ |

<!-- spec: bootstrap-frontend -->

### TC-16: platform-link в frontend

| | |
|---|---|
| **Приоритет** | P1 |
| **Тип** | Config |
| **Спека** | `bootstrap-frontend` → Scenario: «Onboarding нового разработчика» |
| **Предусловия** | Bootstrap завершён |
| **Шаги** | 1. Клонировать repo 2. `.env.example` → `.env` 3. `npm run dev` |
| **Ожидаемый результат** | Dev-сервер стартует |
| **Статус** | ☐ |
