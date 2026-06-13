---
status: Accepted
date: 2026-06-13
deciders: [@simon]
supersedes: —
superseded-by: —
---

# ADR 0000: Архитектура finAns

> **Seed-ADR.** Все последующие ADR (0001+) должны ссылаться на этот документ.

## Контекст и проблема

Нужна личная финансовая админка: учёт доходов/расходов, обязательных платежей,
планируемых трат, тегов и аналитики. Один пользователь, десктоп-first.

Задача: зафиксировать топологию репозиториев и SDD-процесс до начала разработки,
чтобы спеки оставались источником правды, а код жил в отдельных репозиториях.

## §01 · Frontend

**Решение:** отдельный репозиторий **finAns-frontend** — React 18 + TypeScript (Vite).

**Обоснование:** сложные таблицы с фильтрами, древовидные теги, графики и формы
требуют богатого клиентского UI; shadcn/ui + TanStack дают гибкость без тяжёлого
фреймворка уровня Ant Design Pro.

## §02 · Backend API

**Решение:** отдельный репозиторий **finAns-backend** — Go + PostgreSQL, REST JSON.

**Обоснование:** Clean Architecture (handler → service → repository), sqlc/pgx,
высокая производительность фильтрации, простой деплой бинарника.

## §03 · Топология репозиториев

```
finAns-platform   ← спеки, ADR, OpenSpec workflow
         ↓ .platform-link
finAns-backend    ← Go API
finAns-frontend   ← React SPA
```

Связь командных репо с платформой — через `.platform-link` (YAML-маркер).
**Git submodule не используем.**

Локальная разработка: `workspace/` в platform-репо содержит клоны backend и frontend
(`make init` из `workspace.yaml`).

GitHub:
- https://github.com/SimonLavlinskiy/finAns-platform
- https://github.com/SimonLavlinskiy/finAns-backend
- https://github.com/SimonLavlinskiy/finAns-frontend

## §04 · SDD-процесс на базе OpenSpec

**Решение:** Spec-Driven Development через OpenSpec (`@fission-ai/openspec`).

Workflow: `/opsx:propose` → `/opsx:spec-review` → `/opsx:apply` → `/opsx:archive`.

- `openspec/changes/<id>/` — активное предложение
- `openspec/specs/` — консолидированный источник правды
- `decisions/` — архитектурные решения (MADR-lite)

Схема: `spec-driven` (стеки apply: backend, frontend, design).

## §05 · Единый AGENTS.md

В каждом репозитории — один файл `AGENTS.md` для AI-агентов.
Отдельный `CLAUDE.md` не создаём (см. §07 skazbani ADR 0000 — перенесено как конвенция).

## §06 · CI

GitHub Actions в каждом репозитории:
- **backend:** golangci-lint → test (≥70% service layer) → build
- **frontend:** lint → typecheck → build
- **platform:** validate openspec schema (опционально)

## §07 · Роадмап версий

| Версия | Scope |
|--------|-------|
| v1 MVP | bootstrap, теги, транзакции, баланс, обязательные платежи, планируемые расходы |
| v2 | аналитика, лимиты, уведомления |
| v3 | экспорт, мультивалютность, PWA, тёмная тема |

## Последствия

- Platform-репо не содержит прикладного кода — только спеки и стандарты.
- Любая фича начинается с change в `openspec/changes/`.
- Командные репо обязаны иметь `.platform-link` на finAns-platform.
