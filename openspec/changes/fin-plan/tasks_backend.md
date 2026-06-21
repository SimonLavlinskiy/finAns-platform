# Backend tasks: fin-plan

<!-- spec: mandatory-payments -->

## 1. Миграция БД

### 1.1 Создать `000008_redesign_mandatory_payments.up.sql`
```sql
ALTER TYPE payment_recurrence ADD VALUE IF NOT EXISTS 'daily';
ALTER TYPE payment_recurrence ADD VALUE IF NOT EXISTS 'weekly';
ALTER TYPE payment_recurrence ADD VALUE IF NOT EXISTS 'semi_annual';

DROP TABLE IF EXISTS mandatory_payment_statuses;
DROP TABLE IF EXISTS mandatory_payments;

CREATE TABLE mandatory_payments (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(500)       NOT NULL,
    amount             BIGINT             NOT NULL CHECK (amount > 0),
    tag_id             BIGINT             NOT NULL REFERENCES tags (id),
    recurrence         payment_recurrence NOT NULL,
    next_payment_date  DATE               NOT NULL,
    created_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX ON mandatory_payments (next_payment_date);
```

### 1.2 Создать `000008_redesign_mandatory_payments.down.sql`
Восстановить исходные `mandatory_payments` (due_day) и `mandatory_payment_statuses`. Удалить добавленные значения enum нельзя в PostgreSQL — оставить как no-op для enum, но восстановить таблицы.

---

## 2. Domain

### 2.1 `internal/domain/mandatory_payment.go`
```go
package domain

import "time"

type MandatoryPayment struct {
    ID              int64
    Title           string
    Amount          int64
    TagID           int64
    Recurrence      string
    NextPaymentDate time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
}
```

---

## 3. DTO

### 3.1 `internal/dto/mandatory_payment.go`
Добавить:
- `MandatoryPaymentResponse` (id, title, amount, tag TransactionTag, recurrence, next_payment_date string, created_at, updated_at)
- `CreateMandatoryPaymentRequest` (title, amount int64, tag_id int64, recurrence, next_payment_date string)
- `UpdateMandatoryPaymentRequest` (те же поля)

---

## 4. Repository

### 4.1 `internal/repository/mandatory_payment_repo.go`

Реализовать:
- `List(ctx) ([]domain.MandatoryPayment, error)` — `SELECT ... ORDER BY next_payment_date ASC`
- `GetByID(ctx, id) (domain.MandatoryPayment, error)`
- `Create(ctx, p domain.MandatoryPayment) (domain.MandatoryPayment, error)`
- `Update(ctx, p domain.MandatoryPayment) (domain.MandatoryPayment, error)`
- `Delete(ctx, id) error`
- `AdvanceDate(ctx, id int64, newDate time.Time) (domain.MandatoryPayment, error)` — `UPDATE ... SET next_payment_date=$2, updated_at=NOW() WHERE id=$1 RETURNING ...`

Scan-хелпер `scanMandatoryPayment(row)` — аналогично `scanTransaction`.

---

## 5. Service

### 5.1 `internal/service/mandatory_payment_service.go`

```go
type MandatoryPaymentService struct {
    repo    *repository.MandatoryPaymentRepository
    tagRepo *repository.TagRepository
    tagSvc  *TagService
}
```

Методы:
- `List(ctx) ([]dto.MandatoryPaymentResponse, error)` — List + toResponse для каждого
- `Get(ctx, id) (dto.MandatoryPaymentResponse, error)`
- `Create(ctx, req dto.CreateMandatoryPaymentRequest) (dto.MandatoryPaymentResponse, error)`
- `Update(ctx, id, req dto.UpdateMandatoryPaymentRequest) (dto.MandatoryPaymentResponse, error)`
- `Delete(ctx, id) error`
- `Duplicate(ctx, id) (dto.MandatoryPaymentResponse, error)` — копия с next_payment_date = today
- `MarkPaid(ctx, id) (dto.MandatoryPaymentResponse, error)` — вычислить новую дату через `advanceDate`, вызвать `repo.AdvanceDate`

**Приватная функция `advanceDate`**:
```go
func advanceDate(t time.Time, recurrence string) time.Time {
    switch recurrence {
    case "daily":      return t.AddDate(0, 0, 1)
    case "weekly":     return t.AddDate(0, 0, 7)
    case "monthly":    return t.AddDate(0, 1, 0)
    case "quarterly":  return t.AddDate(0, 3, 0)
    case "semi_annual":return t.AddDate(0, 6, 0)
    case "yearly":     return t.AddDate(1, 0, 0)
    default:           return t.AddDate(0, 1, 0)
    }
}
```

**Валидация `validateAndBuild`**:
- title не пустой
- amount > 0
- recurrence ∈ {daily, weekly, monthly, quarterly, semi_annual, yearly}
- next_payment_date парсится как "2006-01-02"
- tag_id существует (через `ValidateTagExists`)

**`toResponse`**: аналогично `TransactionService.toResponse` — вызывает `tagSvc.TagWithParent`.

### 5.2 Зарегистрировать сервис в `cmd/app/main.go`
```go
mpRepo := repository.NewMandatoryPaymentRepository(pool)
mpSvc  := service.NewMandatoryPaymentService(mpRepo, tagRepo, tagSvc)
```

---

## 6. Handler

### 6.1 `internal/handler/mandatory_payment_handler.go`

```go
type MandatoryPaymentHandler struct {
    svc *service.MandatoryPaymentService
}
```

Эндпоинты:
- `GET  /api/v1/mandatory-payments`            → `List`
- `GET  /api/v1/mandatory-payments/{id}`       → `Get`
- `POST /api/v1/mandatory-payments`            → `Create`
- `PUT  /api/v1/mandatory-payments/{id}`       → `Update`
- `DELETE /api/v1/mandatory-payments/{id}`     → `Delete`
- `POST /api/v1/mandatory-payments/{id}/duplicate` → `Duplicate`
- `POST /api/v1/mandatory-payments/{id}/mark-paid` → `MarkPaid`

Использовать `writeServiceError` для маппинга ошибок (аналогично другим хендлерам).

### 6.2 Зарегистрировать роуты в `internal/handler/router.go`

Добавить `MandatoryPaymentHandler` в `RouterDeps` и смонтировать маршруты под `/api/v1/mandatory-payments`.

---

## 7. Тесты

### 7.1 `internal/service/mandatory_payment_service_test.go`
- `TestAdvanceDate` — 6 кейсов (по одному на каждую рекуррентность), граничный случай: конец месяца (31 янв + 1 месяц = 28 или 29 фев).
- `TestMandatoryPaymentValidation` — невалидный recurrence, amount=0, пустой title, плохая дата.

### 7.2 `internal/handler/mandatory_payment_handler_test.go`
- `TestMarkPaid_OK` — stub-сервис, проверить HTTP 200 + новая дата в ответе.
- `TestCreate_ValidationError` — передать пустой title, ожидать 422 + fields.
