## 1. Каркас страницы аналитики

<!-- spec: analytics-page -->

- [x] 1.1 Добавить зависимость `recharts` в `workspace/finAns-frontend/package.json`
- [x] 1.2 Создать `workspace/finAns-frontend/src/features/analytics/pages/AnalyticsPage.tsx`: layout из виджетов сверху вниз — лента инсайтов, (индекс свободы + коэффициент жёсткости бюджета) и прогноз баланса в верхнем ряду, Sankey на всю ширину, календарь по «настроению» трат, прогноз накопления на вишлист, сравнение периодов, панель лимитов; общий `year`/`month` state для Sankey и mood-календаря (оба — новые компоненты этого change)
- [x] 1.3 Добавить роут `{ path: "analytics", element: <AnalyticsPage /> }` в `workspace/finAns-frontend/src/app/router.tsx`, подключить `AnalyticsPage` через `React.lazy` (новая зависимость `recharts` не должна попадать в основной бандл)
- [x] 1.4 Добавить пункт `{ to: "/analytics", label: "Аналитика", icon: BarChart3 }` в `navItems` в `workspace/finAns-frontend/src/components/layout/AppLayout.tsx`

## 2. Индекс свободы

<!-- spec: freedom-index -->

- [x] 2.1 Добавить `fetchFreedomIndex(months?: number)` в `workspace/finAns-frontend/src/lib/api.ts` → `GET /api/v1/analytics/freedom-index`
- [x] 2.2 Добавить тип `FreedomIndexPoint { month: string; simple_amount: number; total_expense: number; share: number | null }` в `workspace/finAns-frontend/src/lib/types.ts`
- [x] 2.3 Создать `workspace/finAns-frontend/src/features/analytics/components/FreedomIndexChart.tsx`: `recharts` `<LineChart>` с `connectNulls={false}` (разрыв на месяцах с `share=null`), ось Y в процентах, заголовок-подпись текущего значения крупным шрифтом (флагманский виджет — самый заметный элемент на странице)
- [x] 2.4 Подключить `FreedomIndexChart` на `AnalyticsPage.tsx`, `useQuery(["analytics","freedom-index"])`
- [x] 2.5 Добавить слайдер-симулятор «что если» внутри `FreedomIndexChart.tsx`: `useState` для целевой доли, чистый клиентский расчёт `(current_simple_amount − target_simple_amount) × 12` на данных последнего месяца из уже загруженного ответа (без нового запроса); если целевая доля выше текущей — показывать как перерасход/пояснение, не как экономию

## 3. Sankey доход → категория → подтег → остаток

<!-- spec: income-expense-sankey -->

- [x] 3.1 Добавить `fetchIncomeExpenseSankey(level, year, month?)` в `api.ts` → `GET /api/v1/analytics/income-expense-sankey`
- [x] 3.2 Добавить типы `SankeyNode { id: string; label: string }`, `SankeyFlow { from: string; to: string; amount: number }` в `types.ts`
- [x] 3.3 Создать `workspace/finAns-frontend/src/features/analytics/components/IncomeExpenseSankey.tsx`: `recharts` `<Sankey>`, цвета узлов по `--income`/`--expense`/`--primary`; если бэкенд не вернул узел «Остаток» (дефицит периода) — показать текстовое предупреждение над диаграммой
- [x] 3.4 Подключить на `AnalyticsPage.tsx`, синхронизировать `year`/`month` с состоянием календаря (общий period-selector)

## 4. Прогноз баланса

<!-- spec: balance-forecast -->

- [x] 4.1 Добавить `fetchBalanceForecast(days: 30 | 60 | 90)` в `api.ts` → `GET /api/v1/analytics/balance-forecast`
- [x] 4.2 Добавить тип `BalanceForecastResponse { current_balance: number; history: BalancePoint[]; forecast: BalancePoint[]; zero_crossing_date: string | null }` в `types.ts`
- [x] 4.3 Создать `workspace/finAns-frontend/src/features/analytics/components/BalanceForecastChart.tsx`: `recharts` `<LineChart>` с двумя `<Line>` (сплошная факт, пунктирная `strokeDasharray` прогноз), переключатель горизонта 30/60/90 дней (pill-selector, как в `ExpensesCalendar`), предупреждение при наличии `zero_crossing_date`
- [x] 4.4 Подключить на `AnalyticsPage.tsx`

## 5. Лимиты трат

<!-- spec: spending-limits -->

- [x] 5.1 Добавить `fetchSpendingLimits`, `createSpendingLimit`, `updateSpendingLimit`, `deleteSpendingLimit` в `api.ts` → `/api/v1/spending-limits`
- [x] 5.2 Добавить тип `SpendingLimit { id: number; tag_id: number; tag: {...}; amount: number; spent: number; period_type: "month"|"week"|"custom"; period_start: string|null; period_end: string|null }`, `CreateSpendingLimitInput` в `types.ts`
- [x] 5.3 Создать `workspace/finAns-frontend/src/features/analytics/components/SpendingLimitsPanel.tsx`: список лимитов с прогресс-барами (`spent/amount`, красная подсветка при `spent > amount` — переиспользовать паттерн подсветки просрочки из `mandatory-payments.ts`), кнопка «+ Лимит»
- [x] 5.4 Создать `workspace/finAns-frontend/src/features/analytics/components/SpendingLimitSheet.tsx`: форма создания/редактирования (тег через `TagFormPicker`, сумма, тип периода `Select`, `DatePicker` для `period_start`/`period_end` при `custom`)
- [x] 5.5 Подключить `SpendingLimitsPanel` на `AnalyticsPage.tsx`

## 7. Коэффициент «жёсткости» бюджета

<!-- spec: fixed-cost-ratio -->

- [x] 7.1 Добавить `fetchFixedCostRatio(year, month)` в `api.ts` → `GET /api/v1/analytics/fixed-cost-ratio`
- [x] 7.2 Добавить тип `FixedCostRatio { income: number; mandatory_total: number; ratio: number | null }` в `types.ts`
- [x] 7.3 Создать `workspace/finAns-frontend/src/features/analytics/components/FixedCostRatioBadge.tsx`: компактный индикатор (не отдельный большой график) — цифра % + мини прогресс-бар, размещается рядом с `FreedomIndexChart`
- [x] 7.4 Подключить на `AnalyticsPage.tsx`

## 8. Прогноз накопления на товары вишлиста

<!-- spec: savings-goal-forecast -->

- [x] 8.1 Добавить `fetchSavingsGoals()` в `api.ts` → `GET /api/v1/analytics/savings-goals`
- [x] 8.2 Добавить тип `SavingsGoal { planned_expense_id: number; title: string; cost: number; projected_date: string | null }` в `types.ts`
- [x] 8.3 Создать `workspace/finAns-frontend/src/features/analytics/components/SavingsGoalsPanel.tsx`: список товаров с прогнозируемой датой (или «неизвестно», если `projected_date === null`); клик по товару ведёт на `/planned-expenses` (только просмотр, без редактирования на самой странице аналитики)
- [x] 8.4 Подключить на `AnalyticsPage.tsx`

## 9. Календарь по «настроению» трат

<!-- spec: spending-mood-calendar -->

- [x] 9.1 Добавить `fetchSpendingMoodCalendar(year, month)` в `api.ts` → `GET /api/v1/analytics/spending-mood-calendar`
- [x] 9.2 Добавить тип `MoodDay { day: number; simple_amount: number; total_expense: number; share: number | null }` в `types.ts`
- [x] 9.3 Создать новый `workspace/finAns-frontend/src/features/analytics/components/SpendingMoodCalendar.tsx` (не модифицировать `ExpensesCalendar.tsx`): упрощённая сетка дней месяца, цвет через `hsl`-интерполяцию между `--income` и `--expense` по значению `share`, дни без расходов — `--muted`
- [x] 9.4 Подключить `SpendingMoodCalendar` на `AnalyticsPage.tsx`, использующий общий `year`/`month` state страницы (см. 1.2)

## 10. Умная лента инсайтов

<!-- spec: spending-insights -->

- [x] 10.1 Добавить `fetchInsights()` в `api.ts` → `GET /api/v1/analytics/insights`
- [x] 10.2 Добавить тип `Insight { type: string; text: string }` в `types.ts`
- [x] 10.3 Создать `workspace/finAns-frontend/src/features/analytics/components/InsightsFeed.tsx`: список карточек с текстом инсайтов; ничего не рендерит, если массив пустой (не показывать заглушку)
- [x] 10.4 Разместить `InsightsFeed` в самом верху `AnalyticsPage.tsx` (первое, что видит пользователь)

## 11. Сравнение периодов

<!-- spec: period-comparison -->

- [x] 11.1 Добавить `fetchPeriodComparison(mode: "prev_month" | "prev_year")` в `api.ts` → `GET /api/v1/analytics/period-comparison`
- [x] 11.2 Добавить тип `PeriodComparisonEntry { tag_id: number; name: string; current_amount: number; comparison_amount: number }` в `types.ts`
- [x] 11.3 Создать `workspace/finAns-frontend/src/features/analytics/components/PeriodComparisonChart.tsx`: `recharts` `<BarChart>` с двумя сериями (текущий/сравниваемый период) по топ-5 тегам, переключатель режима `prev_month`/`prev_year`
- [x] 11.4 Подключить на `AnalyticsPage.tsx`

## 12. Тесты

<!-- spec: analytics-page -->

- [x] 12.1 Добавлен `tests/spending-mood-calendar.test.ts` для `moodColor` (экспортирована из `SpendingMoodCalendar.tsx`) — проверяет оба конца интерполяции (`--income`/`--expense`) и середину. Симулятор индекса свободы и выбор цвета прогресс-бара лимита — тривиальная inline-логика в JSX, не выносилась в отдельные функции; покрыта живой проверкой в 12.2
- [x] 12.2 Проверено вживую на локальном стеке (Postgres + backend + `npm run dev`, 4 месяца сгенерированных данных): индекс свободы рисует разрыв на месяцах без расходов (2025-08…2026-03 — видимый пропуск перед скачком в июле); симулятор пересчитывается без сетевых запросов (чистый `useMemo`); Sankey показывает узлы/подписи и предупреждение «Расходы превысили доходы на 8 000 ₽» при дефиците; прогноз баланса — предупреждение «уйдёт в минус около 18.07.2026» при принудительно отрицательном балансе; прогноз накопления — «уже доступно» и дата (напр. «к 05.09.2027») для двух разных по цене товаров; mood-календарь красит дни зелёным/красным по факту (Аренда/Продукты → зелёный, Кофе/Ноутбук → красный); лента инсайтов показала 2 из 3 правил (рост категории не сработал на тестовых данных — сумма считается по точному tag_id без сворачивания подтегов, как и в period-comparison, см. design.md Decision 13); переключатель периода `vs год назад`/`vs прошлый месяц` работает; лимит «Еда» подсвечен красным при превышении (33 000/30 000 ₽). По ходу проверки найдены и исправлены 2 реальных бага: (1) Sankey не рисовал текстовые подписи узлов вообще — recharts не делает этого по умолчанию, добавлен кастомный `node`-рендер; (2) `BalanceForecastChart`/`PeriodComparisonChart` показывали сырые копейки на оси Y вместо рублей — добавлен `tickFormatter`
- [x] 12.3 Проверено (`git status`): вне `features/analytics/` изменены только `app/router.tsx` (роут), `components/layout/AppLayout.tsx` (пункт навигации), `lib/api.ts`/`lib/types.ts` (общая инфраструктура — новые API-функции и типы, ожидаемо для любой фичи) и `package.json`/`package-lock.json` (зависимость `recharts`). Ни один файл, принадлежащий другой фиче (`TransactionsPage.tsx`, `ExpensesCalendar.tsx`, `PlannedExpensesPage.tsx`, `MandatoryPaymentsPage.tsx` и т.д.), не тронут
