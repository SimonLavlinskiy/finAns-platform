## 1. Миграция

<!-- spec: expenses-calendar -->

- [x] 1.1 `db/migrations/000006_add_transactions_date_index.up.sql` — `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`; `workspace/finAns-backend/`
- [x] 1.2 `db/migrations/000006_add_transactions_date_index.down.sql` — `DROP INDEX IF EXISTS idx_transactions_date;`

## 2. Domain и repository — агрегация

<!-- spec: expenses-calendar -->

- [x] 2.1 `internal/domain/analytics.go` — `CalendarLevel` (`day`/`month`), `CalendarItem` (key, amount, hasData, isCurrent, breakdown, transactions), `CalendarResult` (level, period, total, hasPrevious, items)
- [x] 2.2 `db/queries/analytics.sql` — `SumByDayInMonth`, `SumByMonthInYear` (GROUP BY `date_trunc`), `ExistsBefore` (для `hasPrevious`); `make sqlc`
- [x] 2.3 `db/queries/analytics.sql` — `ListTransactionsInMonth` (id, title, amount, date, tag_id) для разбивки по дням
- [x] 2.4 `internal/repository/analytics_repo.go` — реализация `AnalyticsRepository` на сгенерированных sqlc-запросах

## 3. Service layer — агрегация и свёртка тегов

<!-- spec: expenses-calendar -->

- [x] 3.1 `internal/service/analytics_service.go` — `GetExpensesCalendar(ctx, level, year, month)`: валидация `level`/`year`/`month`, вызов repository, сборка `items` за весь период (включая дни/месяцы без данных)
- [x] 3.2 В `analytics_service.go` — построение map `tagID → rootTagID` через существующее дерево тегов (`tag_service`/`TagRepository.List`), свёртка `breakdownByTag` для `level=day` до верхнеуровневого тега с расчётом `percent`
- [x] 3.3 В `analytics_service.go` — расчёт `isCurrent` (сравнение `key` с текущей датой по конвенции `transaction_service`) и `hasPrevious` через `ExistsBefore`
- [x] 3.4 Валидация: `level` только `day`/`month`; `month` обязателен и `1..12` при `level=day`; иначе `*apperrors.ValidationError` → `422`

## 4. DTO и handler

<!-- spec: expenses-calendar -->

- [x] 4.1 `internal/dto/analytics.go` — `CalendarItemResponse`, `TagBreakdownResponse`, `TransactionBriefResponse`, `CalendarResponse`; конвертация из domain
- [x] 4.2 `internal/handler/analytics_handler.go` — `GetExpensesCalendar`: парсинг query params (`level`, `year`, `month`), вызов service, envelope `{ "data": ... }`
- [x] 4.3 Регистрация `GET /api/v1/analytics/expenses-calendar` в защищённой группе роутов (`middleware.RequireAuth`) в `internal/handler/router.go`

## 5. Тесты backend

<!-- spec: expenses-calendar -->

- [x] 5.1 `internal/service/analytics_service_test.go` — агрегация по дням/месяцам, свёртка подтега к корню, placeholder для дней без расходов, `isCurrent`, `hasPrevious`
- [x] 5.2 `internal/handler/analytics_handler_test.go` — httptest: `200` для `level=day`/`level=month`, `422` для невалидного `level`/`month`, `401` без сессии
- [x] 5.3 `internal/repository/analytics_repository_integration_test.go` — testcontainers: проверка `GROUP BY date_trunc`, `ExistsBefore` на реальных данных
