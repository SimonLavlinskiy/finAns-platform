## Context

Источник требований — `TZ-analytics-finAnns.md` v1.2 (22.10.2026, все вопросы закрыты) и прототип
`analytics-prototype.html` (https://claude.ai/artifact/QbbLau2nZqGYuTfKpfhRTh). Где ТЗ и прототип расходятся,
верно ТЗ. Прототип задаёт раскладку, тексты и поведение, но не данные, шрифты и цвета.

Текущее состояние кода:

- **Backend** (`workspace/finAns-backend/`, Go + chi + pgx, слои handler → service → repository):
  - `tags(id, parent_id, name, color, project_id, created_at)` — удаление жёсткое (`DELETE FROM tags`), с переназначением
    или удалением операций (`TagService.Delete`, `ReassignTransactions`). Порядка и признака дохода у тега нет,
    `List` сортирует по `name`.
  - `transactions.category` — enum `income|expense`; `specificity` — `required|simple` («Обязательный»/«Простой»).
    Доход и расход определяются по `category` операции, а не по тегу.
  - `spending_limits(tag_id, amount BIGINT коп., period_type month|week|custom, period_start, period_end, project_id)`.
    CRUD по `id` есть (`SpendingLimitHandler`), уникальности на категорию нет.
  - `mandatory_payments(title, amount, tag_id, recurrence daily|weekly|monthly|quarterly|semi_annual|yearly, next_payment_date, ...)`.
    В `mandatory_payment_service.go` есть `advanceDate`.
  - `AnalyticsHandler` обслуживает 9 старых эндпоинтов (`/analytics/*`), их не трогаем.
  - Миграции лежат в `db/migrations/`, последняя — `000014_spending_limits_amount_kopecks`.
- **Frontend** (`workspace/finAns-frontend/`, React 18 + TS + Vite + TanStack Query + Tailwind/shadcn):
  - `src/features/analytics/pages/AnalyticsPage.tsx` собирает старые виджеты из `components/`.
  - `src/lib/format.ts` (`formatRubles`, `parseRublesInput`, `evaluateAmountExpression`) и
    `src/lib/use-dropdown-position.ts` (позиционирование выпадающих меню).
  - `src/index.css`: шрифты Comfortaa (заголовки) и Nunito (текст), токены `--income`, `--expense`, `--bar-planned-bg`, ...
  - API-клиент `src/lib/api-client.ts` ставит заголовки `X-User-ID` и `X-Project-ID`. Кэш TanStack Query с ключами
    `["analytics", ...]`, `["transactions"]`, `["mandatory-payments"]` и т.д.

## Goals / Non-Goals

**Goals:**
- Заменить содержимое `/analytics` на «Обзор месяца» (блоки 1–3) и «Планирование» строго по ТЗ.
- Брать все категории, цвета, суммы, лимиты и платежи из данных проекта и пересчитывать их без перезагрузки.
- Ввести мягкое удаление категорий и правило видимости «категория существовала в месяце».
- Хранить один месячный лимит на категорию и одно общее планирование на проект на сервере.
- Переиспользовать один компонент полосы (`BudgetBar`) в блоке 1 и в «Что останется».

**Non-Goals:**
- Удалять старые виджеты и эндпоинты аналитики: они остаются в коде, но не импортируются новой страницей.
- Менять другие страницы, кроме синхронизации (мягкое удаление и цвет в настройках, инвалидация кэша).
- Реалтайм между участниками (websocket). Достаточно `refetchOnWindowFocus` и правила «последний записавший побеждает».
- Лимиты по месяцам и недельные лимиты в новом UI.

## Decisions

### 1. Агрегация на сервере: `month`, `year`, `range`

ТЗ допускает расчёт на клиенте, но мы считаем на сервере: операций может быть тысячи, а агрегация в SQL дешевле
передачи всех строк. Новые методы `AnalyticsRepository`:

```sql
-- MonthSummary: суммы по тегу операции за месяц + признак «все обязательные»
SELECT t.tag_id, t.category,
       SUM(t.amount)                         AS amount,
       BOOL_AND(t.specificity = 'required')  AS all_mandatory
FROM transactions t
WHERE t.project_id = $1 AND t.date >= $2 AND t.date < $3
GROUP BY t.tag_id, t.category;
```

Свёртка подтега к корневой категории делается в Go по карте `tag_id → parent_id` (паттерн `TagWithParent`),
включая удалённые теги. Подкатегория `null` — это операции, привязанные к самому корневому тегу.

- `YearSummary`: `GROUP BY date_trunc('month', date), category` за год; месяцы без операций не возвращаются.
- `Range`: `SELECT MIN(date) FROM transactions WHERE project_id=$1`. Отдаёт `firstMonth` и `currentMonth`.
- «Сегодня» берётся из `time.Now()` в TZ сервера, внедрённого через `Clock`-интерфейс, чтобы тесты фиксировали дату.

Сравнение месяцев — это два вызова `month`, без отдельного `/compare`: данные уже в кэше от блока 1 и таблицы.
«В среднем за 3 месяца» считается на клиенте из трёх запросов `month` за предыдущие завершённые месяцы.
Запросы ленивые и идут только при открытии редактора лимита.

*Альтернатива:* считать всё на клиенте из `/transactions`. Отклонена: нужна пагинация, а на больших проектах это медленно.

### 2. Мягкое удаление тегов

Миграция `000015_analytics_redesign`:

```sql
ALTER TABLE tags ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE tags ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','income'));
ALTER TABLE tags ADD COLUMN sort_order INT NOT NULL DEFAULT 0;
-- backfill kind: корневой тег, у поддерева которого есть операции и ВСЕ они income → 'income'
-- backfill sort_order: ROW_NUMBER() OVER (PARTITION BY project_id, parent_id ORDER BY name)
CREATE INDEX idx_tags_project_alive ON tags(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_project_date ON transactions(project_id, date);
```

- `TagRepository.List(ctx, projectID, includeDeleted bool)` по умолчанию фильтрует `deleted_at IS NULL`.
  Все прочие выборки, которые должны видеть только живые теги (suggestions, формы), идут через него.
- `TagService.Delete` больше не удаляет и не переназначает операции: внутри транзакции он проставляет
  `deleted_at = now()` тегу и его поддереву и удаляет `spending_limits` по этим `tag_id`. Проверка
  «у корневого тега есть операции — заблокировать» снимается, потому что данные больше не теряются.
  Регулярные платежи с удалённой категорией остаются, но в «Планировании» её строки нет (её «Минимум» не показывается).
- Новые теги наследуют `kind` родителя. Корневым тегам `kind` задаётся при создании (по умолчанию `expense`).
  В настройках проекта появляется переключатель «Доходная категория».
- Видимость в месяце M: `createdAt ≤ конец M && (deletedAt == null || deletedAt ≥ начало M)`. Правило реализуется
  одной функцией `isCategoryVisibleInMonth` на фронтенде. Сервер отдаёт суммы по всем тегам, а фильтрует клиент:
  так правило живёт в одном месте и одинаково работает для блоков 1, 2 и сравнения.

*Почему не `kind` по `transactions.category`:* одна категория могла получать операции обоих типов, а ТЗ
явно требует хранить `kind` у категории. Доход и расход месяца всё равно считаются по `transactions.category`
(решение заказчика: возвраты — доход), а `kind` нужен только для исключения «Дохода» из расходных списков.

### 3. Лимиты: upsert по категории

- Новые роуты `PUT/DELETE /api/v1/spending-limits/by-category/{categoryId}`. Путь из ТЗ `/{categoryId}` конфликтует
  с существующим `PUT /{id}`, поэтому добавлен префикс `by-category` (имена в ТЗ ориентировочные).
- Частичный уникальный индекс: `CREATE UNIQUE INDEX ux_spending_limits_month ON spending_limits(project_id, tag_id) WHERE period_type='month';`.
  Перед ним миграция дедуплицирует существующие месячные лимиты и оставляет самый свежий по `created_at`.
- `SpendingLimitService.UpsertForCategory` проверяет, что тег корневой, живой, принадлежит проекту и `kind=expense`,
  а затем выполняет `INSERT ... ON CONFLICT (project_id, tag_id) WHERE period_type='month' DO UPDATE SET amount=EXCLUDED.amount`.
- В ответ `GET /spending-limits` добавляется `categoryId` (alias `tag_id`). Недельные и custom-лимиты в новом UI не показываются.

### 4. Планирование: одна строка JSONB на проект

```sql
CREATE TABLE planners (
  project_id  BIGINT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  updated_by  BIGINT REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `GET /planner` возвращает `data`, а если строки нет — значения по умолчанию.
- `PUT /planner` проверяет данные (суммы ≥ 0 в копейках, `days` — `null` или 1..31, имена ≤ 255 символов,
  не больше 50 строк дохода) и делает `INSERT ... ON CONFLICT (project_id) DO UPDATE` по правилу «последний победил».
- `days = null` означает «авто»: клиент подставляет число дней следующего месяца. Так значение по умолчанию
  само меняется с наступлением нового месяца, а ручное значение сохраняется.
- Ключи `paymentOverrides` и `plans` — строковые id. Неизвестные (удалённые платежи и категории) клиент игнорирует,
  а при следующем сохранении вычищает.
- JSONB, а не нормализованные таблицы: это песочница без отчётности по полям, структура целиком читается и пишется
  одним запросом, а миграции схемы данных не нужны.
- Клиент: локальное состояние + debounce 600 мс → `PUT` (оптимистично). `refetchOnWindowFocus: true` подтягивает
  чужие изменения при возврате на вкладку, но только если нет несохранённых локальных правок.

### 5. Регулярные платежи следующего месяца

Используются данные `GET /mandatory-payments`. Чистая функция на клиенте `isDueInMonth(payment, year, month)`
шагает от `next_payment_date` по `recurrence` (та же логика, что `advanceDate` в Go: month +1, quarterly +3,
semi_annual +6, yearly +12, weekly/daily по дням) и проверяет, попадает ли хотя бы одна дата в месяц M,
где M — следующий месяц после текущего. Если `next_payment_date` позже M, платёж в M не попадает. Перенос
на сервер не нужен: список платежей уже есть в кэше, а функция покрывается unit-тестами.

«Минимум» категории — это сумма полей платежей, у которых корневая категория `tag_id` совпадает с ней
(подтег платежа сворачивается к корню).

### 6. Структура фронтенда

```
src/features/analytics/
  pages/AnalyticsPage.tsx             ← переписан: шапка + вкладки
  overview/  MonthSwitcher, IncomeExpenseNow, CategoryLimitsCard, LimitEditorRow, SummaryTiles
  dynamics/  DynamicsCard, YearPill, MonthsTable, MonthComparison
  planner/   PlannerTab, PlannedIncomeCard, RegularPaymentsCard, PlannedCategoriesCard, LeftoverCard
  shared/    BudgetBar, LimitFillBar, Dropdown (listbox), SignedPill, CardState (skeleton/error)
  lib/       calc.ts (чистые формулы раздела 8), visibility.ts, recurrence.ts, plural.ts
  api.ts     хуки useMonthSummary/useYearSummary/useAnalyticsRange/usePlanner/useSavePlanner/useUpsertLimit
```

- Старые компоненты в `components/` не удаляются и просто не импортируются. Это проверяется отсутствием их запросов
  в сети на странице.
- `BudgetBar` получает `{income, segments:[{id,color,label,amount}]}` и считает геометрию чистой функцией
  `computeBarLayout` (три состояния, обрезка граничной категории, черта 3 px как отдельный элемент внутри полосы).
  Её покрывают unit-тесты.
- `Dropdown` — свой listbox поверх `useDropdownPosition`. Его нужно доработать: выбирать сторону, где места больше,
  с зазором 8 px и `maxHeight = min(440, доступное)`, а фокус ставить с `preventScroll: true`, чтобы открытие
  не прокручивало страницу.
- Вкладка запоминается в `localStorage` под ключом `analytics.tab.{userId}`. Это «для пользователя» в рамках браузера,
  и серверное хранение настроек UI для одной вкладки избыточно.
- Выбранный месяц хранится в URL (`?month=2026-09`) по стандарту «фильтры в URL», а вкладка — в `?tab=planner`
  с приоритетом над `localStorage`.
- Ключи запросов: `["analytics","month",pid,m]`, `["analytics","year",pid,y]`, `["analytics","range",pid]`,
  `["planner",pid]`, `["spending-limits",pid]`, `["tags",pid,{includeDeleted}]`. Хелпер
  `invalidateFinanceData(qc)` вызывается в `onSuccess` мутаций операций, тегов, лимитов, регулярных платежей и импорта.

### 7. Формат денег и стиль

- Новая функция `formatMoney(kopecks, {sign?: 'auto'|'always'})` в `src/lib/format.ts` округляет до рубля и
  разделяет разряды и «₽» через U+00A0, а минус выводит как U+2212. Существующая `formatRubles` не меняется,
  чтобы не задеть другие страницы.
- `plural(n, ['категория','категории','категорий'])` хранится в `src/lib/plural.ts`.
- Токен `--over: #e3191c` добавляется в `:root`, потому что текущий `--expense` (hsl 0 72% 58%) приглушённый
  и не годится для «ярко-красного». Светлые подложки (зелёная, красная, жёлтая) строятся через существующие
  `--income`/`--expense` с альфой и `--bar-planned-bg`.

## Risks / Trade-offs

- [Мягкое удаление меняет семантику удаления тегов на других страницах] → селекторы и списки уже ходят через
  `TagRepository.List`, а фильтр по умолчанию `deleted_at IS NULL` сохраняет их поведение. Нужен регресс-тест
  страницы операций с удалённым тегом: операция должна показывать название тега. Для этого `GET /transactions`
  отдаёт тег без фильтра `deleted_at`.
- [Backfill `kind` может ошибиться на смешанных категориях] → в настройках есть ручной переключатель, и правило
  консервативное: `income` только если 100 % операций доходные.
- [Дедупликация лимитов при миграции теряет старые дубли] → в проде их нет (UI не позволял создавать дубли по месяцу),
  а перед деплоем удалённые строки логируются выборкой в `down`-совместимую временную таблицу `spending_limits_dedup_backup`.
- [Last-write-wins в «Планировании» может затереть чужие правки] → это принятое решение заказчика. Debounce
  и refetch при фокусе уменьшают окно конфликта.
- [Часовой пояс «сегодня»] → сервер и клиент считают по `Europe/Moscow`. Конфиг `APP_TZ` задаётся на backend,
  а клиент берёт `isCurrent` и `today` из ответа `month` и не считает их по своим часам.
- [Нагрузка] → индекс `transactions(project_id, date)`. Год — один запрос с `GROUP BY`.

## Migration Plan

1. Backend: миграция `000015_analytics_redesign` (up: колонки `tags`, backfill, индексы, дедуп и уникальный
   индекс лимитов, таблица `planners`; down: в обратном порядке — `DROP TABLE planners`, `DROP INDEX`, `DROP COLUMN`).
   Мягко удалённые теги при откате становятся видимыми — это задокументировано в down-файле.
2. Деплой backend: новые эндпоинты аддитивны, а старые продолжают работать, поэтому старый фронтенд не ломается.
3. Деплой frontend с новой страницей.
4. Откат: сначала frontend на предыдущий тег образа, затем при необходимости migrate down и backend.
5. Деплой: SSH + Docker Compose на сервере finanns.space (как обычно).

## Open Questions

Открытых вопросов по ТЗ нет: все решения заказчика собраны в разделе 13. Технические допущения, которые
нужно подтвердить на spec-review:
- путь `/spending-limits/by-category/{categoryId}` вместо `/spending-limits/{categoryId}` из ТЗ;
- запоминание вкладки в `localStorage` (на браузер), а не на сервере;
- правило backfill `kind=income`.
