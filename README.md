# finAns-platform

Платформенный репозиторий SDD (Spec-Driven Development) на базе OpenSpec.
Источник правды по спекам и стандартам личной финансовой админки **finAns**.

> **Точка входа в архитектуру** — `decisions/0000-sdd-architecture-proposal.md`

## Структура репозитория

| Каталог | Назначение |
|---------|------------|
| `openspec/` | OpenSpec: `specs/` (консолидированные спеки), `changes/` (активные предложения) |
| `decisions/` | Архитектурные решения (ADR), `0000` — seed |
| `templates/` | Шаблоны онбординга командных репозиториев |
| `workspace/` | Локальные клоны `finAns-backend` и `finAns-frontend` (не коммитятся) |

## Канонические репозитории

| Репозиторий | URL | Назначение |
|-------------|-----|------------|
| `finAns-platform` | [GitHub](https://github.com/SimonLavlinskiy/finAns-platform) | Спеки, ADR, OpenSpec workflow |
| `finAns-backend` | [GitHub](https://github.com/SimonLavlinskiy/finAns-backend) | Go API + PostgreSQL |
| `finAns-frontend` | [GitHub](https://github.com/SimonLavlinskiy/finAns-frontend) | React SPA |

## Быстрый старт

```bash
pnpm install
pnpm openspec:schema-sync
make init          # клонировать backend + frontend в workspace/
make verify        # проверить ветки
```

Разработка по спекам: [openspec/README.md](openspec/README.md).

## Контракт `.platform-link`

Командный репозиторий связывается с платформой файлом `.platform-link` в корне:

```yaml
platform_repo: git@github.com:SimonLavlinskiy/finAns-platform.git
platform_path: ../finAns-platform
openspec_changes: openspec/changes/
openspec_specs: openspec/specs/
```

## Роадмап

| Версия | Scope |
|--------|-------|
| v1 MVP | Теги, транзакции, баланс, обязательные платежи, планируемые расходы |
| v2 | Графики, лимиты, уведомления |
| v3 | Экспорт, мультивалютность, PWA, тёмная тема |

Канонические требования: `openspec/specs/`.
