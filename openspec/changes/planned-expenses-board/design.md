## Context

Capability `planned-expenses` существует только как спека (плоская таблица, тег, прямая конвертация в транзакцию) и как заброшенная таблица `planned_expenses` (`tag_id`, `amount NUMERIC`, без приоритета/статуса) — backend-код для неё не написан, фронтенд-страница `PlannedExpensesPage.tsx` — нереализованный placeholder. Функциональное ТЗ заказчика описывает другую модель: карточки категорий со своим цветом, приоритет с авто-эскалацией по сроку, архив вместо конвертации в транзакцию, drag-and-drop карточек. Этот документ фиксирует, как старая таблица/спека заменяются новой моделью.

## Goals / Non-Goals

**Goals:**
- Собственная сущность «категория» (название + цвет + порядок), не завязанная на дерево `tags` транзакций.
- Приоритет товара с авто-эскалацией до «Высокий» при сроке ≤3 дней, без хранения производного значения в БД.
- Архивация вместо удаления/конвертации в транзакцию, с сохранением всех полей.
- Drag-and-drop порядок карточек категорий, персистентный между сессиями.
- Адаптивная сетка карточек равной высоты в строке + авто-контраст текста на цветном фоне.

**Non-Goals:**
- Лимиты трат по категориям (capability `spending-limits`, будущий v2).
- Push/email-уведомления о горящих сроках — только визуальная подсветка.
- Редактирование/удаление категории отдельным UI (только инлайн-создание из формы товара; см. Open Questions).
- Реюз `tags`: категории планируемых расходов — отдельная таблица, не модифицируем `tags`/`spending_limits`.

## Decisions

1. **Категория — отдельная таблица `planned_expense_categories`, не `tags`.**
   `tags` — общее дерево для транзакций/обязательных платежей (иерархия, фиксированная палитра из 4 корневых цветов, миграция `000003_normalize_tag_palette`). Категории планируемых расходов — плоский список, всегда со своим цветом, нужен персистентный `sort_order` для drag-and-drop. Совмещение усложнило бы обе модели и затронуло бы несвязанные фичи. Альтернатива (реюз `tags.color`) отклонена.

2. **Свотч-палитра для категорий — фиксированный набор, не произвольный hex-пикер.**
   ТЗ говорит «выбор цвета… палитра свотчей», не color-picker. Фиксированный список (8–10 заранее подобранных hex, аналогично `TAG_COLORS` в `src/lib/palette.ts`, но отдельная константа `CATEGORY_COLORS`) гарантирует читаемый контраст текста и единый стиль карточек. Backend валидирует цвет по allow-list при создании категории.

3. **«Эффективный приоритет» и подсветка даты вычисляются на чтении, не хранятся.**
   Хранится только вручную заданный `priority`. При каждом GET сервисный слой сравнивает `due_date` с текущей датой (`due_date >= today AND due_date <= today+3`) и возвращает в DTO дополнительные поля `effective_priority` и `is_due_soon`; сортировка внутри карточки строится по `effective_priority`. Это устраняет необходимость в cron-задаче, которая бы день в день обновляла приоритет «протухших» сроков.

4. **Сортировка товаров — вычисляемая, без отдельного поля позиции.**
   Порядок = `effective_priority DESC, created_at ASC`. Новый товар естественным образом попадает на нужную позицию при следующем рендере — отдельное поле «позиция в списке» не нужно (в отличие от категорий, где порядок произвольный и должен сохраняться явно).

5. **Drag-and-drop — `@dnd-kit/core` + `@dnd-kit/sortable`.**
   В `finAns-frontend` сейчas нет DnD-библиотеки. `react-beautiful-dnd` не поддерживается с 2022 года; `dnd-kit` активно поддерживается, легче, совместим с React 18 в strict mode. Добавляется как новая зависимость.

6. **Архив — фильтр статуса на той же странице, без нового пункта меню.**
   ТЗ не требует отдельной страницы архива. На `PlannedExpensesPage` добавляется переключатель «Активные / Архив» (как вкладки), а не новый элемент в `AppLayout` nav — минимальное изменение навигации.

7. **Деньги — `cost_kopecks BIGINT`, опционально.**
   По аналогии с `transactions.amount`/`mandatory_payments` (копейки, не `NUMERIC`), для единообразия округления и форматирования (`formatKopecks`). Поле nullable — стоимость в товаре опциональна по ТЗ.

## Risks / Trade-offs

- Вычисление `effective_priority` на каждом GET — незаметно по нагрузке (счёт товаров на пользователя — десятки), но любая будущая массовая выгрузка/экспорт должна использовать ту же функцию, а не сырое поле `priority`, иначе данные разойдутся. Логика инкапсулируется в одной функции сервисного слоя.
- Фиксированная палитра свотчей может не дать пользователю «любимый» цвет — приемлемо для v1, расширяется добавлением свотчей в константу без миграции.
- `@dnd-kit` — новая зависимость и новый паттерн на фронтенде; ограничено одним компонентом (`CategoryGrid`), не размазывается по кодовой базе.

## Migration Plan

1. Новая миграция (порядковый номер — следующий свободный, например `00000X_redesign_planned_expenses.up.sql`):
   - `DROP TABLE planned_expenses;` (старая, без данных в проде — таблица никогда не использовалась кодом).
   - `CREATE TYPE planned_expense_priority AS ENUM ('low', 'medium', 'high');`
   - `CREATE TYPE planned_expense_status AS ENUM ('active', 'archived');`
   - `CREATE TABLE planned_expense_categories (id BIGSERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, color VARCHAR(7) NOT NULL, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`
   - `CREATE TABLE planned_expenses (id BIGSERIAL PRIMARY KEY, category_id BIGINT NOT NULL REFERENCES planned_expense_categories(id) ON DELETE CASCADE, title VARCHAR(500) NOT NULL, cost_kopecks BIGINT CHECK (cost_kopecks >= 0), due_date DATE, url TEXT, priority planned_expense_priority NOT NULL DEFAULT 'medium', status planned_expense_status NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), archived_at TIMESTAMPTZ);`
   - `down.sql` восстанавливает старую таблицу `planned_expenses (tag_id...)` и дропает новые типы/таблицы.
2. Backend: новые `domain.PlannedExpense`, `domain.PlannedExpenseCategory`; репозитории/сервисы/хендлеры по образцу `mandatory_payment_*`; роуты в `internal/handler/router.go`.
3. Frontend: типы `PlannedExpense`, `PlannedExpenseCategory` в `src/lib/types.ts`, API-клиенты в `src/lib/api.ts`, замена `PlannedExpensesPage.tsx`, новый `PlannedExpenseSheet`, `CategoryCard`, `CategoryGrid` (dnd-kit), утилита подсветки срока.
4. Деплой: т.к. старая таблица не используется production-кодом, миграция безопасна без бэкфилла данных.

## Open Questions

- Нужно ли отдельное редактирование/удаление категории (не только инлайн-создание)? ТЗ явно не описывает — оставлено вне scope этого change, фиксируется как кандидат на будущий change.
- Нужен ли явный UI для удаления товаров из архива (полная очистка)? ТЗ говорит только про сохранение полей при архивации — удаление из архива не описано, не реализуется в этом change.
