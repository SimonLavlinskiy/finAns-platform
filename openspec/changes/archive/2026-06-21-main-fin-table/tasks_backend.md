## 1. Миграции и фикстуры

<!-- spec: tags -->

- [x] 1.1 Миграция `000002_add_tag_color.up/down.sql` — колонка `color VARCHAR(7)` в `tags`; `workspace/finAns-backend/db/migrations/`
- [x] 1.2 Seed-скрипт `testdata/fixtures/tags.sql` (12 тегов из ТЗ); `make seed` target в Makefile
- [x] 1.3 Seed `testdata/fixtures/transactions.sql` (12 вариаций транзакций); JSON-дубль `transactions.json`

## 2. Domain и sqlc — теги

<!-- spec: tags -->

- [x] 2.1 `internal/domain/tag.go` — entity Tag, TagTree, TagRepository interface; `workspace/finAns-backend/`
- [x] 2.2 `db/queries/tags.sql` — ListTree, Create, Update, Delete, CountUsage; `make sqlc`
- [x] 2.3 `internal/repository/tag_repo.go` — реализация + сборка дерева из flat rows

## 3. Domain и sqlc — транзакции

<!-- spec: transactions -->

- [x] 3.1 `internal/domain/transaction.go` — entity, filters struct, TransactionRepository interface
- [x] 3.2 `db/queries/transactions.sql` — List (filtered+paginated), GetByID, Create, Update, Delete, Suggestions
- [x] 3.3 `internal/repository/transaction_repo.go` — фильтрация по всем query params из спеки

## 4. Domain и sqlc — баланс

<!-- spec: balance -->

- [x] 4.1 `internal/domain/balance.go` — BalanceSnapshot, BalanceRepository interface
- [x] 4.2 `db/queries/balance.sql` — GetSnapshot (initial + aggregates), UpsertInitialAmount
- [x] 4.3 `internal/repository/balance_repo.go`

## 5. Service layer

<!-- spec: transactions -->

- [x] 5.1 `internal/service/transaction_service.go` — Create, Update, Delete, List, Get, Duplicate, Suggestions; валидация amount>0, category, specificity, URL
- [x] 5.2 `internal/service/tag_service.go` — CRUD, GetUsage, cascade delete с предупреждением
- [x] 5.3 `internal/service/balance_service.go` — GetBalance, UpdateInitialAmount, формула current_balance
- [x] 5.4 `internal/service/file_service.go` — Upload (MIME, 10MB), Delete file from disk

## 6. DTO и handlers

<!-- spec: transactions -->

- [x] 6.1 `internal/dto/transaction.go`, `tag.go`, `balance.go` — request/response + envelope `{ data, meta }`
- [x] 6.2 `internal/handler/transaction_handler.go` — все endpoints transactions + duplicate + suggestions
- [x] 6.3 `internal/handler/tag_handler.go` — CRUD + usage
- [x] 6.4 `internal/handler/balance_handler.go` — GET/PUT balance
- [x] 6.5 `internal/handler/file_handler.go` — POST/DELETE file multipart
- [x] 6.6 Регистрация маршрутов в `cmd/app/main.go` под `/api/v1/`

## 7. Тесты backend

<!-- spec: transactions -->

- [x] 7.1 `internal/service/transaction_service_test.go` — unit-тесты из ТЗ (create, validation, filters, pagination, duplicate, delete)
- [x] 7.2 `internal/service/balance_service_test.go` — GetBalance_Calculation, UpdateBalance
- [x] 7.3 `internal/service/tag_service_test.go` — CRUD, usage count
- [x] 7.4 `internal/handler/transaction_handler_test.go` — httptest: POST 201, 422, GET filtered, DELETE 204, duplicate 201
- [x] 7.5 `internal/handler/balance_handler_test.go`, `tag_handler_test.go`
- [x] 7.6 `internal/repository/transaction_repository_integration_test.go` — testcontainers, фильтрация SQL
- [x] 7.7 `internal/repository/tag_repository_integration_test.go` — cascade delete

## 8. Swagger и CI

<!-- spec: transactions -->

- [x] 8.1 Swagger-аннотации на всех новых endpoints; `make swagger`
- [x] 8.2 Убедиться что CI проходит: lint → test -cover → build
- [x] 8.3 Commit + push `features/main-fin-table` в finAns-backend
