---
owner: Simon
reviewers: [TBD]
target_release: v1-mvp
status: draft
created: 2026-06-13
---

# main-fin-table: Главная таблица транзакций, формы, баланс и теги

## Зачем

Bootstrap finAns-backend и finAns-frontend завершён — каркас, схема БД и placeholder UI готовы. Следующий шаг MVP: реализовать ядро продукта — таблицу доходов/расходов с фильтрами, CRUD через drawer-форму, баланс в хедере и управление тегами. Без этого пользователь не может вести учёт финансов.

## Что меняется

- **Backend:** полный REST API для транзакций (CRUD, дублирование, фильтрация, пагинация, автодополнение), тегов (дерево, CRUD, usage), баланса (GET/PUT); загрузка/удаление файлов; seed-фикстуры; unit/integration/HTTP-тесты
- **Frontend:** главный экран `/transactions` — таблица с колонками, пагинацией, действиями; drawer-форма добавления/редактирования; панель фильтров с URL-sync; баланс в хедере с редактированием стартовой суммы; страница `/tags` с деревом; тёмная финтех-тема; TanStack Query + optimistic updates
- **API-конвенции:** суммы в копейках (int64), даты ISO 8601, единый формат ошибок и пагинации
- Миграция: добавление `color` в `tags` (если отсутствует в bootstrap-схеме)

## Non-цели

- Обязательные платежи, планируемые расходы — отдельные change'ы
- Аналитика, лимиты трат, уведомления — v2
- Auth / multi-user — опционально, вне scope
- S3/MinIO для файлов — локальный `uploads/` на v1
- Уведомления в хедере (🔔) — заглушка или v2

## Capabilities

### Новые capabilities

<!-- все три capability уже есть в openspec/specs/; реализуем через delta -->

### Изменяемые capabilities

- `transactions`: таблица, колонки, пагинация, фильтры (сервер + URL), drawer-форма, CRUD, дублирование, вложения, автодополнение, API
- `tags`: дерево с цветом, страница `/tags`, inline-создание в форме, API CRUD + usage
- `balance`: отображение в хедере, формула, редактирование стартовой суммы, API GET/PUT

## Влияние

- **finAns-backend** (`workspace/finAns-backend/`): `internal/{handler,service,repository}/` для transactions, tags, balance; `db/queries/*.sql`; миграция `000002_tags_color` (при необходимости); `testdata/fixtures/`; Swagger-аннотации
- **finAns-frontend** (`workspace/finAns-frontend/`): `src/features/transactions/`, `src/features/tags/`, `src/features/balance/`; обновление `AppLayout`, тема (dark fintech); `src/lib/api-client.ts` расширение
- **finAns-platform:** delta-спеки → `openspec/specs/{transactions,tags,balance}/` после archive
- **API:** `GET/POST/PUT/DELETE /api/v1/transactions`, `POST .../duplicate`, `GET .../suggestions`; `GET/POST/PUT/DELETE /api/v1/tags`, `GET .../usage`; `GET/PUT /api/v1/balance`; `POST/DELETE .../file`
