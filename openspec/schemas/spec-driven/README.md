# Schema: spec-driven

OpenSpec-схема для монорепозитория finAn (Go backend + React frontend).

## Артефакты

| id | Файл |
|----|------|
| proposal | proposal.md |
| specs | specs/**/*.md |
| design | design.md |
| tasks-backend | tasks_backend.md |
| tasks-frontend | tasks_frontend.md |
| tasks-design | tasks_design.md |
| test-cases | test_case.md |

## Стеки apply

- `backend` — Go, PostgreSQL, REST API, миграции
- `frontend` — React, TypeScript, UI
- `design` — макеты, компоненты, user flow

## Цепочка

```
/opsx:propose → /opsx:spec-review → (merge) → /opsx:apply <stack> → /opsx:archive
```
