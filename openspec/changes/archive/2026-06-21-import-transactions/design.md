## Context

Сейчас единственный способ добавить транзакцию — форма `+ Добавить` (один `POST /transactions` за раз). Пользователю нужно перенести историю операций из внешнего CSV-файла без ручного ввода каждой строки. В отличие от первой версии дизайна, парсинг и хранение черновиков строк происходит **на backend**: загруженный файл парсится сервером, строки сохраняются в новую таблицу `moderation_transactions` и живут там до явного согласования пользователем, после чего переносятся в `transactions`. Это даёт устойчивость к перезагрузке страницы и единый источник истины для статусов строк.

## Goals / Non-Goals

**Goals:**
- Парсинг и валидация CSV — обязанность backend; фронт только показывает результат и шлёт правки.
- Строки импорта хранятся в БД (`moderation_transactions`) до принятия — переживают reload страницы.
- Принятие строки атомарно переносит её в `transactions` и убирает/помечает в `moderation_transactions`.

**Non-Goals:**
- Хранение исходного файла CSV (бинарь/raw-текст) — сохраняются только распарсенные структурированные строки.
- Автосоздание новых тегов при импорте — тег должен существовать в дереве тегов до загрузки файла.
- Параллельные активные импорты — в любой момент у пользователя один открытый (`open`) `import_batch`; новая загрузка либо продолжает старый незавершённый батч, либо явно завершает/отбрасывает его (см. Decisions).

## Decisions

### Схема БД

```sql
CREATE TYPE import_batch_status AS ENUM ('open', 'closed');

CREATE TABLE import_batches (
    id           BIGSERIAL PRIMARY KEY,
    file_name    VARCHAR(255) NOT NULL,
    total_rows   INTEGER NOT NULL,
    status       import_batch_status NOT NULL DEFAULT 'open',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at    TIMESTAMPTZ
);

CREATE TYPE moderation_row_status AS ENUM ('pending', 'ready', 'error');

CREATE TABLE moderation_transactions (
    id            BIGSERIAL PRIMARY KEY,
    batch_id      BIGINT NOT NULL REFERENCES import_batches (id) ON DELETE CASCADE,
    row_number    INTEGER NOT NULL,
    title         VARCHAR(500),
    amount        NUMERIC(15, 2),
    date          DATE,
    tag_id        BIGINT REFERENCES tags (id),
    category      transaction_category,
    specificity   transaction_specificity,
    comment       TEXT,
    url           TEXT,
    status        moderation_row_status NOT NULL DEFAULT 'pending',
    field_errors  JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_transactions_batch_id ON moderation_transactions (batch_id);
```

`amount`/`category`/`specificity`/`tag_id` — nullable, в отличие от `transactions`, потому что строка с ошибкой парсинга может не иметь валидного значения. `field_errors` хранит карту `{поле: сообщение}` для отображения красной рамки + tooltip без повторного парсинга на фронте.

Статус `Перенесено` **не хранится** в `moderation_transactions` — при принятии строка переносится в `transactions` и физически удаляется из `moderation_transactions` (см. «Принятие строки» ниже). `import_batches.total_rows` фиксирует исходное количество строк батча; счётчик «Перенесено» на фронте вычисляется как `total_rows - count(оставшихся строк батча)`.

### Эндпоинты backend

- `POST /import/batches` (multipart, поле `file`) — парсит CSV, создаёт `import_batches` + строки `moderation_transactions`, возвращает батч со строками и списком ошибок парсинга.
- `GET /import/batches/active` — возвращает текущий незакрытый батч пользователя со всеми строками (для восстановления состояния после reload страницы `/import`).
- `PATCH /import/rows/{id}` — обновляет одно поле строки, сервер пересчитывает `status`/`field_errors`, возвращает обновлённую строку.
- `POST /import/rows/{id}/accept` — одиночное принятие: в одной транзакции БД создаёт запись в `transactions` из строки и удаляет строку из `moderation_transactions`.
- `POST /import/batches/{id}/accept` (`{row_ids: [...]}`) — массовое принятие выбранных строк (только `status = ready`): в одной транзакции БД создаёт `transactions` для каждой строки и удаляет принятые строки из `moderation_transactions`.
- `POST /import/batches/{id}/close` — закрывает батч (используется кнопкой «Загрузить новый файл»); незакрытый батч с одинаковым `file_name` повторно не создаётся — открывается новый.

### Парсинг и валидация — на сервере

CSV читается Go-обработчиком (`encoding/csv`), построчно валидируется тем же набором правил, что в спеке (обязательные поля, формат суммы/даты, допустимые `category`, резолюция `tag` по пути `parent/child` через уже загруженное дерево тегов). Валидация инкапсулируется в `internal/service/import_service.go`, переиспользуется и при первичном парсинге, и при пересчёте статуса после `PATCH`.

### Принятие строки = перенос с удалением из модерации

При принятии (`accept`) сервис в одной транзакции БД: создаёт запись в `transactions` (через существующий `TransactionRepository.Create`) и **удаляет** строку из `moderation_transactions`. Строка не остаётся в таблице модерации в статусе `transferred` — после успешного переноса она исчезает из источника данных, а не просто помечается. Завершение импорта определяется как «в батче не осталось строк со статусом `pending`/`ready`» (оставшиеся — только `error`, которые пользователь либо исправит, либо так и оставит).

### Фронтенд — тонкий клиент над API

Страница `/import` при монтировании дёргает `GET /import/batches/active`; если батч есть — сразу показывает таблицу модерации (восстановление после reload). Загрузка нового файла — `POST /import/batches` (multipart). Любое inline-редактирование ячейки — `PATCH /import/rows/{id}` с оптимистичным обновлением UI и откатом при ошибке. Принятие — `POST /import/rows/{id}/accept` или `POST /import/batches/{id}/accept`; после успешного ответа строка на фронте на 1–2 секунды визуально помечается «Перенесено» (локальное состояние, не из API), затем убирается из списка — таким образом и сервер не хранит лишний статус, и сохраняется плавная анимация исчезновения. Счётчик «Перенесено» вычисляется на фронте как `batch.total_rows - rows.length` (текущее количество строк, оставшихся в ответе API). Поле «Тег» переиспользует существующий `TagFormPicker` (`src/components/TagFilterPicker.tsx`) с деревом из `fetchTags()`.

## Risks / Trade-offs

- Доп. таблицы и эндпоинты увеличивают объём backend-работы по сравнению с чисто клиентским парсингом, но дают надёжность (переживает reload, единая валидация на сервере).
- Удаление строки из `moderation_transactions` при принятии означает отсутствие отдельного аудит-следа «какая строка модерации породила какую транзакцию» — принято как осознанный trade-off ради простоты схемы; при необходимости аудита это легко добавить позже отдельным полем.
- `field_errors` как `JSONB` без строгой схемы — гибко для добавления новых правил валидации, но требует дисциплины в сервисном слое, чтобы ключи совпадали с фронтовыми ожиданиями (фиксируются в спеке/тестах).
- Один открытый батч на пользователя — если пользователь хочет одновременно держать два разных файла в модерации, это не поддерживается (осознанное ограничение v1).

## Migration Plan

Миграция `NNNNNN_add_import_moderation.up.sql` добавляет типы `import_batch_status`, `moderation_row_status`, таблицы `import_batches`, `moderation_transactions`, индекс по `batch_id`. `down.sql` — обратное удаление (DROP TABLE/TYPE). Существующие таблицы (`transactions`, `tags`) не меняются.

## Open Questions

- Нужен ли лимит на размер/количество строк CSV (например, >2000 строк) за один батч — на старте ограничение не вводим, может потребоваться после первого использования с реальными выгрузками.
- Нужна ли возможность вручную закрыть/отбросить батч без принятия ни одной строки (например, кнопка «Отмена импорта») — пока покрыто только косвенно через «Загрузить новый файл» → `close`.
