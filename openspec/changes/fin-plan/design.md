# Design: fin-plan — Раздел «План»

## Обзор решения

Раздел «План» реализует CRUD-экран обязательных регулярных платежей поверх существующей (но нереализованной) таблицы `mandatory_payments`. Ключевая операция — `PATCH /mark-paid`: атомарно пересчитывает `next_payment_date` в сервисном слое без отдельной таблицы статусов.

---

## Схема данных

### Миграция `000008_redesign_mandatory_payments`

**Проблема**: существующая схема `mandatory_payments` использует `due_day SMALLINT` (день месяца) и отдельную таблицу `mandatory_payment_statuses`. Эта модель не поддерживает ежедневную/еженедельную периодичность и не хранит точную дату следующего платежа.

**Решение**: заменяем `due_day` на `next_payment_date DATE`, дропаем `mandatory_payment_statuses`, расширяем enum `payment_recurrence`.

```sql
-- 000008_redesign_mandatory_payments.up.sql

-- Расширяем enum (добавляем новые значения, не переименовываем существующие)
ALTER TYPE payment_recurrence ADD VALUE IF NOT EXISTS 'daily';
ALTER TYPE payment_recurrence ADD VALUE IF NOT EXISTS 'weekly';
ALTER TYPE payment_recurrence ADD VALUE IF NOT EXISTS 'semi_annual';

-- Перестраиваем mandatory_payments
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

> `amount` в копейках (BIGINT), как в `transactions`. `mandatory_payment_statuses` удаляется — история оплат вне scope этого change.

---

## Backend: слои

### Domain (`internal/domain/mandatory_payment.go`)

```go
type MandatoryPayment struct {
    ID              int64
    Title           string
    Amount          int64
    TagID           int64
    Recurrence      string // daily|weekly|monthly|quarterly|semi_annual|yearly
    NextPaymentDate time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
}
```

### DTO (`internal/dto/mandatory_payment.go`)

```go
type MandatoryPaymentResponse struct {
    ID              int64              `json:"id"`
    Title           string             `json:"title"`
    Amount          int64              `json:"amount"`
    Tag             TransactionTag     `json:"tag"`
    Recurrence      string             `json:"recurrence"`
    NextPaymentDate string             `json:"next_payment_date"` // "YYYY-MM-DD"
    CreatedAt       string             `json:"created_at"`
    UpdatedAt       string             `json:"updated_at"`
}

type CreateMandatoryPaymentRequest struct {
    Title           string `json:"title"`
    Amount          int64  `json:"amount"`
    TagID           int64  `json:"tag_id"`
    Recurrence      string `json:"recurrence"`
    NextPaymentDate string `json:"next_payment_date"` // "YYYY-MM-DD"
}

type UpdateMandatoryPaymentRequest struct {
    Title           string `json:"title"`
    Amount          int64  `json:"amount"`
    TagID           int64  `json:"tag_id"`
    Recurrence      string `json:"recurrence"`
    NextPaymentDate string `json:"next_payment_date"`
}
```

### Repository (`internal/repository/mandatory_payment_repo.go`)

Методы:
- `List(ctx) ([]domain.MandatoryPayment, error)` — все платежи, ORDER BY next_payment_date ASC
- `GetByID(ctx, id) (domain.MandatoryPayment, error)`
- `Create(ctx, p) (domain.MandatoryPayment, error)`
- `Update(ctx, p) (domain.MandatoryPayment, error)`
- `Delete(ctx, id) error`
- `AdvanceDate(ctx, id, newDate) (domain.MandatoryPayment, error)` — UPDATE next_payment_date WHERE id

### Service (`internal/service/mandatory_payment_service.go`)

Бизнес-логика:
- `List`, `Get`, `Create`, `Update`, `Delete`, `Duplicate`
- `MarkPaid(ctx, id)`: получает запись → вычисляет `AdvanceDate(nextDate + recurrenceInterval)` → возвращает обновлённую запись

**Функция `advanceDate(date time.Time, recurrence string) time.Time`**:

| recurrence | интервал |
|---|---|
| daily | +1 день |
| weekly | +7 дней |
| monthly | +1 месяц |
| quarterly | +3 месяца |
| semi_annual | +6 месяцев |
| yearly | +1 год |

Используем `date.AddDate(years, months, days)` из stdlib.

Валидация в `validateAndBuild`:
- title не пустой
- amount > 0
- recurrence в допустимом множестве
- next_payment_date парсится как YYYY-MM-DD
- tag_id существует в БД

### Handler (`internal/handler/mandatory_payment_handler.go`)

```
GET    /api/v1/mandatory-payments          → List
GET    /api/v1/mandatory-payments/{id}     → Get
POST   /api/v1/mandatory-payments          → Create
PUT    /api/v1/mandatory-payments/{id}     → Update
DELETE /api/v1/mandatory-payments/{id}     → Delete
POST   /api/v1/mandatory-payments/{id}/duplicate  → Duplicate
POST   /api/v1/mandatory-payments/{id}/mark-paid  → MarkPaid
```

---

## Frontend: компоненты

### Страница `MandatoryPaymentsPage`

Заменяет заглушку в `src/features/mandatory-payments/pages/MandatoryPaymentsPage.tsx`.

**Структура**:
```
MandatoryPaymentsPage
├── page-title / page-subtitle
├── Кнопка «+ Добавить»
├── Таблица платежей (surface-card)
│   └── DataTable columns:
│       ├── Наименование
│       ├── Сумма (formatKopecks, цвет расхода)
│       ├── Категория (TagPills)
│       ├── Периодичность (бейдж/текст)
│       ├── Дата платежа (подсветка ≤3 дня)
│       ├── Чекбокс оплаты
│       └── Меню «…» (Редактировать / Дублировать / Удалить)
└── MandatoryPaymentSheet (создание / редактирование)
```

### Компонент `MandatoryPaymentSheet`

Sheet (боковая панель), аналогичный `TransactionFormSheet`.

Поля:
1. Наименование — `<Input placeholder="Наименование" />`
2. Сумма — `<Input placeholder="Сумма" />`
3. Категория — `<TagFormPicker>` (тот же компонент что в транзакциях)
4. Периодичность — `<Select>` (6 вариантов)
5. Дата платежа — `<Input type="date" />`

Кнопки футера: «Сохранить», «Сохранить и ещё» (только при создании).

### Логика подсветки даты

```typescript
function getDateHighlight(dateStr: string): "warn" | "normal" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays >= 0 && diffDays <= 3) return "warn";
  return "normal";
}
```

CSS: `warn` → `bg-amber-50 text-amber-700` (тёплый жёлтый, не ядовитый, хорошо читается на светлом фоне luxury-палитры).

### API-функции (`src/lib/api.ts`)

```typescript
fetchMandatoryPayments(): Promise<DataResponse<MandatoryPayment[]>>
createMandatoryPayment(body): Promise<DataResponse<MandatoryPayment>>
updateMandatoryPayment(id, body): Promise<DataResponse<MandatoryPayment>>
deleteMandatoryPayment(id): Promise<void>
duplicateMandatoryPayment(id): Promise<DataResponse<MandatoryPayment>>
markMandatoryPaymentPaid(id): Promise<DataResponse<MandatoryPayment>>
```

### Типы (`src/lib/types.ts`)

```typescript
type MandatoryPayment = {
  id: number;
  title: string;
  amount: number;
  tag: TransactionTag;
  recurrence: "daily"|"weekly"|"monthly"|"quarterly"|"semi_annual"|"yearly";
  next_payment_date: string; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
};
```

---

## Инвалидация кэша React Query

При `createMandatoryPayment`, `updateMandatoryPayment`, `deleteMandatoryPayment`, `duplicateMandatoryPayment`, `markMandatoryPaymentPaid`:
- `invalidateQueries(["mandatory-payments"])`

---

## Навигация

Пункт «Обязательные платежи» уже есть в `AppLayout.tsx` (ссылка на `/mandatory-payments`). Значок: `CalendarClock` (lucide-react).

---

## Тесты

### Backend
- Unit: `mandatory_payment_service_test.go` — `advanceDate` (все 6 рекуррентностей), валидация.
- Handler: `mandatory_payment_handler_test.go` — MarkPaid, Create с невалидными данными.

### Frontend
- `tests/mandatory-payments.test.ts` — `getDateHighlight` (граничные случаи: 0, 1, 3, 4 дня, прошедшая дата).
