## 1. Миграция БД

<!-- spec: import-transactions -->

- [x] 1.1 Добавить миграцию `NNNNNN_add_import_moderation.up.sql`/`.down.sql`: типы `import_batch_status` (`open`/`closed`), `moderation_row_status` (`pending`/`ready`/`error`), таблицы `import_batches` (id, file_name, total_rows, status, created_at, closed_at) и `moderation_transactions` (id, batch_id FK, row_number, title, amount NUMERIC(15,2), date, tag_id FK, category, specificity, comment, url, status, field_errors JSONB, created_at, updated_at) + индекс по `batch_id` (workspace/finAns-backend/db/migrations/)

## 2. Доменный слой и репозиторий импорта

<!-- spec: import-transactions -->

- [x] 2.1 Добавить `domain.ImportBatch`, `domain.ModerationRow`, `domain.FieldErrors` и интерфейс `ImportRepository` (Create/GetActiveBatch/ListRows/UpdateRow/DeleteRow/Close) в workspace/finAns-backend/internal/domain/import.go
- [x] 2.2 Реализовать `ImportRepository` на pgx/sqlc в workspace/finAns-backend/internal/repository/import_repo.go (CRUD по `import_batches`/`moderation_transactions`)

## 3. Сервис парсинга и валидации CSV

<!-- spec: import-transactions -->

- [x] 3.1 Реализовать парсер CSV (`encoding/csv`, UTF-8, заголовки) в workspace/finAns-backend/internal/service/import_service.go: маппинг колонок `title,amount,date,tag,category,specificity,comment,url` в `ModerationRow`
- [x] 3.2 Реализовать валидацию строки (обязательные поля `title`/`amount`/`date`, числовой `amount`, формат даты `YYYY-MM-DD`, `category` ∈ {expense, income}) с заполнением `field_errors` по правилам из specs/import-transactions/spec.md
- [x] 3.3 Реализовать резолюцию `tag` по пути `parent/child` (split по `/`, точное совпадение цепочки имён с учётом `parent_id` в таблице `tags`, нормализация `trim`+`lower` при сравнении)
- [x] 3.4 Реализовать пересчёт `status` строки (`pending`/`ready`/`error`) по правилам: наличие `field_errors` → `error`; отсутствие ошибок но незаполненные `tag_id`/`category`/`specificity` → `pending`; всё заполнено → `ready`
- [x] 3.5 Реализовать метод принятия строки: в одной DB-транзакции создать запись в `transactions` (через существующий `TransactionRepository.Create`) и удалить строку из `moderation_transactions`
- [x] 3.6 Реализовать метод массового принятия батча строк (`row_ids`): фильтрация только `status = ready`, перенос каждой в `transactions`, удаление всех принятых строк за одну DB-транзакцию

## 4. HTTP-хендлеры и роутинг

<!-- spec: import-transactions -->

- [x] 4.1 Добавить `ImportHandler` в workspace/finAns-backend/internal/handler/import_handler.go: `UploadBatch` (multipart `POST /import/batches`), `GetActiveBatch` (`GET /import/batches/active`)
- [x] 4.2 Добавить в `ImportHandler`: `UpdateRow` (`PATCH /import/rows/{id}`), `AcceptRow` (`POST /import/rows/{id}/accept`), `AcceptBatch` (`POST /import/batches/{id}/accept`), `CloseBatch` (`POST /import/batches/{id}/close`)
- [x] 4.3 Зарегистрировать маршруты `/import/...` в workspace/finAns-backend/internal/handler/router.go под `protected`
- [x] 4.4 Добавить swagger-аннотации для новых эндпоинтов (по конвенции остальных хендлеров проекта)

## 5. Тесты сервисного слоя

<!-- spec: import-transactions -->

- [x] 5.1 Unit-тесты валидации строки (testify): нечисловой `amount`, неверный формат `date`, недопустимый `category`, ненайденный `tag` по пути — каждый кейс даёт ожидаемый `field_errors`/`status`
- [x] 5.2 Тест резолюции тега по иерархии (`Еда/Кафе`) на фикстурах дерева тегов
- [x] 5.3 Интеграционный тест (testcontainers-go) на одиночное и массовое принятие: строка(и) удаляются из `moderation_transactions`, появляются в `transactions`
