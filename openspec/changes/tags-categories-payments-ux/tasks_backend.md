## 1. Миграции БД

<!-- spec: tags-per-project -->

- [x] 1.1 Создать миграцию `workspace/finAns-backend/db/migrations/NNNN_add_project_id_to_tags.sql`: `ALTER TABLE tags ADD COLUMN project_id BIGINT NOT NULL DEFAULT 1`
- [x] 1.2 Создать миграцию `workspace/finAns-backend/db/migrations/NNNN_add_last_paid_at_to_mandatory_payments.sql`: `ALTER TABLE mandatory_payments ADD COLUMN last_paid_at TIMESTAMPTZ`

## 2. Tags — привязка к проекту

<!-- spec: tags-per-project -->

- [x] 2.1 Обновить `workspace/finAns-backend/internal/domain/tag.go`: добавить поле `ProjectID int64`
- [x] 2.2 Обновить `workspace/finAns-backend/internal/repository/tag_repo.go`: в `List` добавить `WHERE project_id = $1`; в `Create` передавать `project_id`
- [x] 2.3 Обновить `workspace/finAns-backend/internal/service/tag_service.go`: передавать `projectID` из контекста сессии в `List` и `Create`
- [x] 2.4 Обновить `workspace/finAns-backend/internal/handler/tag_handler.go`: читать `projectID` из middleware и передавать в сервис

## 3. MandatoryPayments — поле last_paid_at

<!-- spec: mandatory-payments -->

- [x] 3.1 Обновить `workspace/finAns-backend/internal/domain/mandatory_payment.go`: добавить поле `LastPaidAt *time.Time`
- [x] 3.2 Обновить `workspace/finAns-backend/internal/repository/mandatory_payment_repo.go`: добавить `last_paid_at` в `mpColumns`; `scanMandatoryPayment` читает nullable `*time.Time`; `MarkPaid` устанавливает `last_paid_at = NOW()`
- [x] 3.3 Обновить `workspace/finAns-backend/internal/dto/mandatory_payment.go`: добавить `LastPaidAt *string` в `MandatoryPaymentResponse` (ISO8601 или null)
- [x] 3.4 Обновить `workspace/finAns-backend/internal/service/mandatory_payment_service.go`: в `toResponse` маппить `LastPaidAt`

## 4. MandatoryPayments — UnmarkPaid

<!-- spec: tag-cancel-payment -->

- [x] 4.1 Добавить метод `UnmarkPaid(ctx, id, projectID)` в `workspace/finAns-backend/internal/service/mandatory_payment_service.go`:
  - загрузить платёж; проверить `last_paid_at != nil` (иначе 409)
  - найти транзакцию: `tag_id=payment.TagID, specificity=required, date=prevPeriodDate`
  - удалить транзакцию (если найдена)
  - сдвинуть `next_payment_date` назад (`reverseDate(p.NextPaymentDate, p.Recurrence)`)
  - обновить `last_paid_at = NULL`
- [x] 4.2 Добавить функцию `reverseDate(t time.Time, recurrence string) time.Time` в `mandatory_payment_service.go` — обратная к `advanceDate`
- [x] 4.3 Добавить метод `UnmarkPaid` в `workspace/finAns-backend/internal/repository/mandatory_payment_repo.go`: SQL UPDATE сбрасывает `last_paid_at = NULL` и `next_payment_date`
- [x] 4.4 Добавить эндпоинт `POST /api/v1/mandatory-payments/:id/unmark-paid` в `workspace/finAns-backend/internal/handler/mandatory_payment_handler.go`
- [x] 4.5 Зарегистрировать роут в `workspace/finAns-backend/internal/handler/router.go`
