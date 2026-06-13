# finAns-platform / AGENTS.md

Платформенный репозиторий SDD (Spec-Driven Development) на базе OpenSpec —
источник правды по спекам и стандартам finAns.

## Контекст и стандарты

- Архитектура (seed): `decisions/0000-sdd-architecture-proposal.md`
- Source of truth спек: `openspec/specs/`
- Активные предложения: `openspec/changes/`
- Контекст проекта, стек, репозитории: `openspec/config.yaml` (поле `context`)
- Схема workflow: `openspec/schemas/spec-driven/`
- Шаблон AGENTS для командных репо: `templates/new-repo-AGENTS.md`

## Канонические репозитории

| Репозиторий | Локально (после `make init`) |
|-------------|------------------------------|
| finAns-platform | этот репо |
| finAns-backend | `workspace/finAns-backend/` |
| finAns-frontend | `workspace/finAns-frontend/` |

## Workflow

- `make init` — клонировать командные репо в `workspace/`
- Новый change: `/opsx:propose <id>` → `/opsx:spec-review` → merge → `/opsx:apply <stack>` → `/opsx:archive`
- Стеки apply: `backend`, `frontend`
- Ветки: `propose/<change>` (спеки), `features/<change>` (код в workspace)

## Capabilities (канонические спеки)

| Capability | Версия | Описание |
|------------|--------|----------|
| `bootstrap-backend` | v1 | Каркас finAns-backend |
| `bootstrap-frontend` | v1 | Каркас finAns-frontend |
| `balance` | v1 | Глобальный баланс в хедере |
| `tags` | v1 | Теги и подтеги |
| `transactions` | v1 | Основная таблица транзакций |
| `mandatory-payments` | v1 | Обязательные платежи |
| `planned-expenses` | v1 | Планируемые расходы |
| `auth` | v1 (опц.) | HTTP Basic / логин-пароль |
| `analytics` | v2 | Графики аналитики |
| `spending-limits` | v2 | Лимиты трат |
| `notifications` | v2 | Уведомления в UI |

> Единый файл инструкций для AI в этом репозитории — `AGENTS.md`.
