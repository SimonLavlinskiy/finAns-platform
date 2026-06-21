## Context

Bootstrap завершён: `finAns-backend` и `finAns-frontend` содержат каркас, схему БД (все таблицы MVP), health-check, placeholder-страницы. Канонические спеки `transactions`, `tags`, `balance` описывают поведение на уровне ТЗ; этот change детализирует реализацию v1 с тёмной финтех-темой и полным API.

Локальные клоны: `workspace/finAns-{backend,frontend}/`.

## Goals / Non-Goals

**Goals:**

- Полный CRUD транзакций с серверной фильтрацией, пагинацией, файлами, дублированием
- Дерево тегов с цветом, страница `/tags`, inline-создание в форме
- Баланс в хедере с API и мгновенным пересчётом
- Единые API-конвенции (копейки, пагинация, ошибки)
- Seed-фикстуры (12 транзакций, 12 тегов) для dev/тестов
- Покрытие: unit (service), integration (repository), HTTP (handler)
- Тёмная тема по умолчанию (референсы: Тинькофф, YNAB, Toshl, Монобанк)

**Non-Goals:**

- mandatory-payments, planned-expenses — отдельные change'ы
- Auth middleware
- S3 — только `uploads/` локально
- Уведомления (🔔) — заглушка
- Оптимистичные обновления для всех мутаций — только delete/update где указано в спеке

## Decisions

### D1: Суммы в копейках (int64)

**Решение:** `amount` — `BIGINT` в БД, `int64` в Go, число в JSON без дробной части. Frontend: ввод/отображение в рублях с форматированием, конвертация ×100 при отправке.

**Альтернатива:** decimal string `"1500.00"` — отклонена: int64 проще для агрегаций баланса и исключает float-ошибки.

### D2: API response envelope

**Решение:**

```json
// Single resource
{ "data": { ... } }

// List
{ "data": [...], "meta": { "page": 1, "per_page": 25, "total": 342, "total_pages": 14 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "amount": "must be positive" } } }
```

**HTTP codes:** 201 create, 204 delete, 422 validation, 404 not found.

### D3: Миграция `tags.color`

**Решение:** `000002_add_tag_color.up.sql`:

```sql
ALTER TABLE tags ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#94A3B8';
```

Если bootstrap уже содержит `color` — миграция no-op через `IF NOT EXISTS`.

### D4: Backend слои

```
internal/
  domain/
    transaction.go, tag.go, balance.go  # entities + repo interfaces
  dto/
    transaction.go, tag.go, balance.go    # request/response
  service/
    transaction_service.go, tag_service.go, balance_service.go
  repository/
    transaction_repo.go, tag_repo.go, balance_repo.go
    sqlc/  # generated queries
  handler/
    transaction_handler.go, tag_handler.go, balance_handler.go, file_handler.go
db/queries/
  transactions.sql, tags.sql, balance.sql
testdata/fixtures/
  tags.sql, transactions.sql, transactions.json
```

### D5: Фильтрация SQL

**Решение:** динамический WHERE в sqlc через отдельные запросы или pgx с именованными параметрами. Параметры: `search ILIKE`, `amount_min/max`, `date_from/to`, `tag_ids = ANY($1)`, `category`, `specificity`. Сортировка: `sort_by` whitelist (`date`, `amount`, `title`), `sort_order` asc/desc.

### D6: Файлы вложений

**Решение:** `POST /api/v1/transactions/:id/file` multipart; сохранение в `UPLOAD_DIR` (default `uploads/`); валидация MIME (jpg, png, webp, pdf, doc, docx) и размер ≤10MB. `DELETE` удаляет файл с диска и очищает поля в БД.

### D7: Frontend структура

```
src/features/
  transactions/
    pages/TransactionsPage.tsx
    components/TransactionsTable.tsx, TransactionFilters.tsx, TransactionFormSheet.tsx
    hooks/useTransactions.ts, useTransactionMutations.ts
    schemas/transactionSchema.ts  # Zod
  tags/
    pages/TagsPage.tsx
    components/TagTree.tsx, TagInlineForm.tsx, TagCombobox.tsx
  balance/
    components/BalanceHeader.tsx, EditBalanceDialog.tsx
    hooks/useBalance.ts
src/styles/
  theme.css  # dark fintech tokens
```

### D8: Тёмная тема (CSS variables)

```
--background: #0F1117
--card: #1C1F26
--border: #2A2D36
--accent: #6C63FF
--income: #22C55E
--expense: #EF4444
--required: #F59E0B
--foreground: #F1F5F9
--muted: #94A3B8
```

Шрифт: Inter (или Geist). Tailwind + shadcn CSS variables.

### D9: URL-sync фильтров

**Решение:** React Router `useSearchParams`; сериализация `tag_ids` как `1,5,12`. Debounce 300ms для `search` через `useDeferredValue` или lodash debounce.

### D10: TanStack Query keys

```
['transactions', filters]
['transaction', id]
['tags']
['tags', id, 'usage']
['balance']
['suggestions', q]
```

Invalidate `['transactions']` и `['balance']` после create/update/delete transaction.

### D11: Черновик формы

**Решение:** `localStorage` key `finans:transaction-draft`; JSON сериализация полей формы; очистка при успешном сохранении.

## Risks / Trade-offs

| Риск | Митигация |
|------|-----------|
| sqlc не поддерживает динамические фильтры | Отдельные sqlc-запросы или raw SQL в repository для list |
| Большие файлы на диске | Лимит 10MB, валидация MIME |
| Дерево тегов глубокое | Рекурсивный CTE в SQL или сборка дерева в Go |
| Node 20 vs pnpm | Использовать `npm` / `node scripts/` как в bootstrap |

## Migration Plan

1. `make migrate` — `000002_add_tag_color` (если нужно)
2. `make seed` — новый target: применить `testdata/fixtures/tags.sql` + `transactions.sql`
3. Deploy backend → frontend (frontend зависит от API)

## Open Questions

- **Дата начала учёта** (`accounting_start_date` в `user_balance`): включать в v1 или отложить? → Рекомендация: поле в миграции, UI опционально скрыт на v1
- **Детальная карточка транзакции** по клику на наименование: открывать drawer редактирования (проще) vs отдельный modal просмотра → drawer edit
