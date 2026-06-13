# Schema: spec-driven

OpenSpec-схема для finAns (finAns-platform + finAns-backend + finAns-frontend).

## Артефакты

| id | Файл |
|----|------|
| proposal | proposal.md |
| specs | specs/**/*.md |
| design | design.md (технический дизайн, не UI-стек) |
| tasks-backend | tasks_backend.md |
| tasks-frontend | tasks_frontend.md |
| test-cases | test_case.md |

## Стеки apply

- `backend` — Go, PostgreSQL, REST API, миграции
- `frontend` — React, TypeScript, UI

## Цепочка

```
/opsx:propose → /opsx:spec-review → (merge) → /opsx:apply <stack> → /opsx:archive
```
