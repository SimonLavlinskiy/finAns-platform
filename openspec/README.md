# OpenSpec — finAns-platform

[OpenSpec](https://github.com/Fission-AI/OpenSpec/) для Spec-Driven Development. Схема: [`schemas/spec-driven/`](schemas/spec-driven/).

## Workspace

| Что | Где |
|-----|-----|
| OpenSpec | `openspec/` (этот репо) |
| Backend | `workspace/finAns-backend/` |
| Frontend | `workspace/finAns-frontend/` |

```bash
make init      # клонировать репозитории из workspace.yaml
make verify    # проверить ref веток
```

## Команды агента

| Команда | Фаза |
|---------|------|
| `/opsx:propose` | Артефакты change + ветка `propose/<change>` |
| `/opsx:explore` | Исследование (без кода) |
| `/opsx:spec-review` | Commit + push + PR спек |
| `/opsx:apply` | Разработка по стеку `backend` \| `frontend` |
| `/opsx:archive` | Архив change + merge delta specs |

```bash
pnpm openspec:update
```

## Цепочка

```
/opsx:propose → /opsx:spec-review → (merge) → /opsx:apply <stack> → /opsx:archive
```

## Git

| Фаза | finAns-platform | workspace |
|------|-----------------|-----------|
| propose | `propose/<change>` | — |
| apply | `features/<change>` | `features/<change>` |

## Канонические спеки

[`specs/`](specs/) — требования из ТЗ v1.0 (balance, tags, transactions, …).

## Первичная настройка

```bash
pnpm install
openspec schema validate spec-driven
pnpm openspec:schema-sync
make init
```
