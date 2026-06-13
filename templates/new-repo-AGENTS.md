# <repo-name> / AGENTS.md

<Одна строка: что это за репозиторий и стек.>

> Единый файл инструкций для AI в этом репо — `AGENTS.md`. Отдельный `CLAUDE.md`
> в репозитории не создаём (конвенция finAns-platform; ADR 0000).

## Контекст: связь с платформой

Часть проекта finAns. Системные правила — в `finAns-platform`
(URL и путь см. в `.platform-link` этого репо):
- OpenSpec changes: `<platform>/openspec/changes/`
- OpenSpec specs (source of truth): `<platform>/openspec/specs/`
- ADR: `<platform>/decisions/` (точка входа — `0000-sdd-architecture-proposal`)

## Workflow для AI

Когда работаешь над фичей со ссылкой на spec:
1. Прочитай change в `<platform>/openspec/changes/<id>/`.
2. Изучи `tasks_<stack>.md` для своего стека (backend / frontend / design).
3. Реализуй код в этом репозитории.
4. По завершении — push, PR, в описании ссылка на change и capability.

## Локальные правила

<специфика этого репо: запуск, тесты, особенности>

## Примеры

**finAns-backend:** `make up`, `make test`, `make migrate`, API prefix `/api/v1/`

**finAns-frontend:** `npm run dev`, `npm run build`, `npm run lint`
