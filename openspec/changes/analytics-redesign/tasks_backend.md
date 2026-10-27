## 1. Миграция `000015_analytics_redesign`

<!-- spec: tags -->

- [x] 1.1 `workspace/finAns-backend/db/migrations/000015_analytics_redesign.up.sql`: `tags.deleted_at`, `tags.kind` (CHECK expense|income), `tags.sort_order`; backfill `sort_order` (ROW_NUMBER по `project_id, parent_id ORDER BY name`) и `kind=income` для корневых тегов, у поддерева которых 100 % операций `category='income'`; подтеги наследуют `kind`
- [x] 1.2 В той же миграции: индексы `idx_tags_project_alive` (partial `deleted_at IS NULL`) и `idx_transactions_project_date`
- [x] 1.3 В той же миграции: бэкап дублей месячных лимитов в `spending_limits_dedup_backup`, дедупликация (оставить самый свежий) и `CREATE UNIQUE INDEX ux_spending_limits_month ON spending_limits(project_id, tag_id) WHERE period_type='month'`
- [x] 1.4 В той же миграции: таблица `planners(project_id PK, data JSONB, updated_by, updated_at)`
- [x] 1.5 `000015_analytics_redesign.down.sql` в обратном порядке; комментарий, что мягко удалённые теги при откате становятся видимыми. Прогнать up → down → up на testcontainers

## 2. Мягкое удаление и вид категорий

<!-- spec: tags -->

- [x] 2.1 `internal/domain/tag.go`: поля `Kind`, `Order`, `DeletedAt`; `TagRepository.List(ctx, projectID, includeDeleted)`, сортировка `sort_order, name`
- [x] 2.2 `internal/repository/tag_repo.go`: фильтр `deleted_at IS NULL` по умолчанию; `SoftDeleteSubtree(ctx, id)` (проставляет `deleted_at` тегу и потомкам и удаляет их `spending_limits` в одной транзакции); `Create` с `kind` (подтег наследует от родителя); `Update` с `kind` и `order`
- [x] 2.3 `internal/service/tag_service.go`: `Delete` → мягкое удаление без переназначения и удаления операций; убрать блокировку «root tag has transactions»
- [x] 2.4 `internal/handler/tag_handler.go` + `internal/dto`: в ответе `kind`, `order`, `createdAt`, `deletedAt`; query `include_deleted=true`; `kind`/`order` в create/update; swagger
- [x] 2.5 Проверить, что `GET /transactions` и suggestions отдают название удалённого тега у старых операций (join без фильтра `deleted_at`), а формы получают только живые теги
- [x] 2.6 Тесты: unit `TagService.Delete` (мягкое, каскад, лимит удаляется); интеграционные `tag_repo` (`include_deleted`, порядок, наследование `kind`); handler-тесты обновить под новое поведение удаления

## 3. Лимиты по категории

<!-- spec: spending-limits -->

- [x] 3.1 `internal/repository/spending_limit_repo.go`: `UpsertMonthlyForTag` (`INSERT ... ON CONFLICT (project_id, tag_id) WHERE period_type='month' DO UPDATE`) и `DeleteMonthlyForTag`
- [x] 3.2 `internal/service/spending_limit_service.go`: `UpsertForCategory`/`DeleteForCategory`; валидация — тег корневой, живой, принадлежит проекту, `kind=expense`, `amount > 0`; `Create` с `period_type=month` по существующей категории заменяет лимит
- [x] 3.3 `internal/handler/spending_limit_handler.go` + роуты `PUT/DELETE /spending-limits/by-category/{categoryId}` в `router.go`; `categoryId` в DTO ответа `GET`; `DELETE` идемпотентен (204); swagger
- [x] 3.4 Тесты: unit-сервис (валидация, upsert, `income` → 400, удалённая → 404); handler-тесты новых роутов; интеграционный тест уникального индекса

## 4. API аналитики `month` / `year` / `range`

<!-- spec: analytics-month-overview -->

- [x] 4.1 `internal/service/clock.go`: интерфейс `Clock` + реализация с TZ из конфига `APP_TZ` (default `Europe/Moscow`); `internal/config` — новое поле
- [x] 4.2 `internal/repository/analytics_repo.go`: `SumByTagInMonth(ctx, projectID, from, to)` → `tag_id, category, amount, all_mandatory`
- [x] 4.3 `internal/service/analytics_service.go`: `MonthSummary(ctx, projectID, month)` — свёртка подтегов к корню по карте тегов, включая удалённые; `income`/`expense` по `transactions.category`; `isCurrent`, `today`, `daysInMonth`; будущий месяц → `ValidationError`
- [x] 4.4 `internal/handler/analytics_handler.go` + `dto/analytics.go`: `GET /analytics/month?month=YYYY-MM` (формат по контракту `MonthSummary` из спеки); роут; swagger
- [x] 4.5 Тесты: unit `MonthSummary` (свёртка, `null`-подкатегория, `allMandatory`, удалённая категория, будущий месяц); интеграционный тест repo на фикстурах

<!-- spec: analytics-dynamics -->

- [x] 4.6 `analytics_repo.go`: `SumByMonthInYearByCategory(ctx, projectID, year)` (`GROUP BY date_trunc('month', date), category`) и `FirstTransactionDate(ctx, projectID)`
- [x] 4.7 `analytics_service.go` + handler: `GET /analytics/year?year=YYYY` (только месяцы с операциями до текущего, `isCurrent`) и `GET /analytics/range` (`firstMonth|null`, `currentMonth`); роуты; swagger
- [x] 4.8 Тесты: unit и интеграционные для `year` (обрезка будущего, пустые месяцы) и `range` (пустой проект)

## 5. Планирование

<!-- spec: budget-planner -->

- [x] 5.1 `internal/domain/planner.go` (`Planner{Days *int, Incomes, PaymentOverrides, Plans, UpdatedAt}`) + `internal/repository/planner_repo.go` (`Get`, `Upsert` по `project_id`)
- [x] 5.2 `internal/service/planner_service.go`: значения по умолчанию при отсутствии строки; валидация (суммы ≥ 0, `days` null|1..31, имя ≤ 255, ≤ 50 доходов); last-write-wins, `updated_by` из контекста пользователя
- [x] 5.3 `internal/handler/planner_handler.go` + `dto/planner.go` + роуты `GET/PUT /planner` в группе проекта; DI в `RouterDeps` и `main`; swagger
- [x] 5.4 Тесты: unit-сервис (default, валидация); handler (400 на невалидные данные, проектная изоляция); интеграционный repo (upsert, два пользователя одного проекта видят одни данные)

## 6. Регрессия и выпуск

<!-- spec: analytics-layout -->

- [x] 6.1 Smoke-тест: старые эндпоинты `/analytics/insights|freedom-index|balance-forecast|savings-goals|period-comparison` отвечают 200 после миграции
- [x] 6.2 `golangci-lint` + покрытие сервисного слоя ≥ 70 % (`analytics`, `planner`, `spending_limit`, `tag`) — в изменённых файлах 0 замечаний (17 старых замечаний в других файлах); покрытие 87–89 %
