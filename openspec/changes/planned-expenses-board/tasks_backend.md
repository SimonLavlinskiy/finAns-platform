## 1. Миграция БД

<!-- spec: planned-expenses -->

- [ ] 1.1 Создать `workspace/finAns-backend/db/migrations/000007_redesign_planned_expenses.up.sql`: `DROP TABLE planned_expenses;`, `CREATE TYPE planned_expense_priority AS ENUM ('low','medium','high');`, `CREATE TYPE planned_expense_status AS ENUM ('active','archived');`
- [ ] 1.2 В той же миграции создать `planned_expense_categories (id BIGSERIAL PK, name VARCHAR(200) NOT NULL, color VARCHAR(7) NOT NULL, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
- [ ] 1.3 В той же миграции создать `planned_expenses (id BIGSERIAL PK, category_id BIGINT NOT NULL REFERENCES planned_expense_categories(id) ON DELETE CASCADE, title VARCHAR(500) NOT NULL, cost_kopecks BIGINT CHECK (cost_kopecks >= 0), due_date DATE, url TEXT, priority planned_expense_priority NOT NULL DEFAULT 'medium', status planned_expense_status NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), archived_at TIMESTAMPTZ)`
- [ ] 1.4 Написать `000007_redesign_planned_expenses.down.sql`: дроп новых таблиц/типов, восстановление старой `planned_expenses (tag_id, amount NUMERIC, planned_date, comment)` из `000001_init_schema.up.sql`
- [ ] 1.5 Прогнать `migrate up`/`migrate down`/`migrate up` локально, убедиться что обе миграции применяются без ошибок

## 2. Domain и DTO

<!-- spec: planned-expenses -->

- [ ] 2.1 Добавить `internal/domain/planned_expense_category.go`: структура `PlannedExpenseCategory{ID, Name, Color, SortOrder, CreatedAt}`
- [ ] 2.2 Добавить `internal/domain/planned_expense.go`: структура `PlannedExpense{ID, CategoryID, Title, CostKopecks *int64, DueDate *time.Time, URL *string, Priority, Status, CreatedAt, ArchivedAt *time.Time}` + константы `PlannedExpensePriorityLow/Medium/High`, `PlannedExpenseStatusActive/Archived`
- [ ] 2.3 Добавить `internal/dto/planned_expense.go`: `CreatePlannedExpenseCategoryRequest{Name, Color}`, `CreatePlannedExpenseRequest{Title, CostKopecks *int64, DueDate *string, URL *string, Priority string, CategoryID *int64, NewCategory *CreatePlannedExpenseCategoryRequest}`, `UpdatePlannedExpenseRequest` (аналогичные опциональные поля), `ReorderCategoriesRequest{IDs []int64}`
- [ ] 2.4 Добавить `dto.PlannedExpenseResponse` с вычисляемыми полями `EffectivePriority string` и `IsDueSoon bool`, `dto.PlannedExpenseCategoryResponse{..., Items []PlannedExpenseResponse}`

## 3. Палитра цветов категорий

<!-- spec: planned-expenses -->

- [ ] 3.1 Добавить `pkg/colorutil/category_palette.go`: константа `CategoryColorPalette` — фиксированный список 8–10 hex-значений (согласовать с фронтовой `CATEGORY_COLORS`)
- [ ] 3.2 Добавить функцию `colorutil.IsValidCategoryColor(hex string) bool` — проверка вхождения в палитру

## 4. Repository

<!-- spec: planned-expenses -->

- [ ] 4.1 Создать `internal/repository/planned_expense_category_repo.go`: `Create`, `List` (по `sort_order ASC`), `Reorder(ctx, ids []int64)` (транзакционно переписывает `sort_order` по позиции в списке), `Exists`
- [ ] 4.2 Создать `internal/repository/planned_expense_repo.go`: `Create`, `Get`, `Update`, `Delete`, `ListByStatus(ctx, status)` (с join на категорию), `Archive(ctx, id)` (устанавливает `status='archived', archived_at=NOW()`)
- [ ] 4.3 Покрыть оба репозитория тестами на testcontainers-go по аналогии с `internal/repository/import_repo_test.go` (если есть) или существующим паттерном репозиторных тестов

## 5. Service

<!-- spec: planned-expenses -->

- [ ] 5.1 Создать `internal/service/planned_expense_category_service.go`: `Create` (валидирует цвет через `colorutil.IsValidCategoryColor`), `List`, `Reorder` (валидирует, что переданный набор ID — это перестановка существующих категорий, без пропусков/дублей)
- [ ] 5.2 Создать `internal/service/planned_expense_service.go`: `Create` (если передан `NewCategory` — сначала создаёт категорию через `PlannedExpenseCategoryService.Create`, затем товар), `Update`, `Delete`, `Complete` (архивация), `ListActive` (по категориям, с сортировкой `effective_priority DESC, created_at ASC` внутри категории), `ListArchived`
- [ ] 5.3 Реализовать вычисление `effective_priority`/`is_due_soon` как чистую функцию `computeEffectivePriority(priority string, dueDate *time.Time, now time.Time) (string, bool)`: `is_due_soon = dueDate != nil && !dueDate.Before(today) && !dueDate.After(today+3d)`; при `is_due_soon == true` `effective_priority = "high"`, иначе `effective_priority = priority`
- [ ] 5.4 Написать unit-тесты на `computeEffectivePriority`: дата в прошлом, дата сегодня, дата через 3 дня, дата через 4 дня, дата отсутствует, приоритет уже high
- [ ] 5.5 Написать unit-тесты сервисов (мок репозиториев): создание товара с инлайн-категорией, ошибка при недопустимом цвете, архивация сохраняет все поля, сортировка списка по эффективному приоритету

## 6. Handler и роутинг

<!-- spec: planned-expenses -->

- [ ] 6.1 Создать `internal/handler/planned_expense_category_handler.go`: `Create (POST /planned-expense-categories)`, `List (GET /planned-expense-categories)`, `Reorder (PATCH /planned-expense-categories/reorder)`
- [ ] 6.2 Создать `internal/handler/planned_expense_handler.go`: `Create (POST /planned-expenses)`, `Update (PATCH /planned-expenses/{id})`, `Delete (DELETE /planned-expenses/{id})`, `Complete (POST /planned-expenses/{id}/complete)`, `ListActive (GET /planned-expenses?status=active)`, `ListArchived (GET /planned-expenses?status=archived)`
- [ ] 6.3 Использовать общий `parseID` хелпер (`internal/handler/transaction_handler.go`) для всех путевых параметров `{id}`
- [ ] 6.4 Зарегистрировать новые роуты в `internal/handler/router.go`
- [ ] 6.5 Написать handler-тесты по образцу `internal/handler/mandatory_payment_handler_test.go` (если существует) или `tag_handler_test.go`: happy path + 404/400 для каждого эндпоинта

## 7. Swagger

<!-- spec: planned-expenses -->

- [ ] 7.1 Добавить swaggo-аннотации к новым хендлерам, перегенерировать `docs/` (`swag init`)
