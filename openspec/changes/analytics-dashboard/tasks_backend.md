## 1. Миграция — spending_limits.amount → BIGINT (копейки)

<!-- spec: spending-limits -->

- [x] 1.1 Создать `workspace/finAns-backend/db/migrations/000014_spending_limits_amount_kopecks.up.sql`: `ALTER TABLE spending_limits ADD COLUMN amount_kopecks BIGINT; UPDATE spending_limits SET amount_kopecks = (amount * 100)::BIGINT; ALTER TABLE spending_limits ALTER COLUMN amount_kopecks SET NOT NULL; ALTER TABLE spending_limits DROP COLUMN amount; ALTER TABLE spending_limits RENAME COLUMN amount_kopecks TO amount; ALTER TABLE spending_limits ADD CONSTRAINT spending_limits_amount_check CHECK (amount > 0);`
- [x] 1.2 Создать `000014_spending_limits_amount_kopecks.down.sql` (обратная конвертация: `BIGINT` → `NUMERIC(15,2)`, `/100.0`)

## 2. Индекс свободы

<!-- spec: freedom-index -->

- [x] 2.1 Добавить `domain.FreedomIndexPoint{Month time.Time, SimpleAmount int64, TotalExpense int64}` в `workspace/finAns-backend/internal/domain/analytics.go`
- [x] 2.2 Добавить `AnalyticsRepository.FreedomIndexByMonth(ctx, monthsBack int, projectID int64) ([]domain.FreedomIndexPoint, error)` в `internal/repository/analytics_repo.go`: `GROUP BY date_trunc('month', date)` по `transactions WHERE category='expense'`, `SUM(amount) FILTER (WHERE specificity='simple')` и `SUM(amount)`, за последние N месяцев
- [x] 2.3 Добавить `AnalyticsService.GetFreedomIndex(ctx, months int, projectID int64) ([]dto.FreedomIndexPointResponse, error)` в `internal/service/analytics_service.go`: вычисляет `share = simple/total` (`nil`, если `total=0`), включая месяцы без расходов как точки с `share=null` (не пропускать — фронтенд должен нарисовать разрыв)
- [x] 2.4 Добавить `dto.FreedomIndexPointResponse{Month string, SimpleAmount int64, TotalExpense int64, Share *float64}` в `internal/dto/analytics.go`
- [x] 2.5 Добавить `AnalyticsHandler.GetFreedomIndex` в `internal/handler/analytics_handler.go`, параметр `months` (по умолчанию 12)
- [x] 2.6 Зарегистрировать `GET /api/v1/analytics/freedom-index` в `internal/handler/router.go`
- [x] 2.7 Unit-тест в `internal/service/analytics_service_test.go`: месяц без расходов → `share = nil`; месяц с 30000 simple из 100000 total → `share = 0.3`

## 3. Sankey доход → категория → подтег → остаток

<!-- spec: income-expense-sankey -->

- [x] 3.1 Добавить `domain.SankeyNode{ID string, Label string}`, `domain.SankeyFlow{From, To string, Amount int64}`, `domain.SankeyResult{Nodes []SankeyNode, Flows []SankeyFlow}` в `internal/domain/analytics.go`
- [x] 3.2 Добавить `AnalyticsRepository.SumByTagInPeriod(ctx, from, to time.Time, category string, projectID int64) ([]domain.TransactionBrief, error)` в `internal/repository/analytics_repo.go` (переиспользовать структуру `TransactionBrief`, фильтр по `category` вместо жёстко зашитого `'expense'`, как в `ListExpenseTransactionsInMonth`)
- [x] 3.3 Добавить `AnalyticsService.GetIncomeExpenseSankey(ctx, level string, year, month int, projectID int64) (domain.SankeyResult, error)` в `internal/service/analytics_service.go`: получить доходы и расходы за период, свернуть расходы по подтегам через уже существующий `tagRootMap`/`tagInfo`, построить узлы `Доходы → [топ-теги дохода]`, `[топ-теги расхода] → [подтеги]`, и узел `Остаток` (только если `income > expense`)
- [x] 3.4 Добавить `dto.SankeyResponse` + маппер в `internal/dto/analytics.go`
- [x] 3.5 Добавить `AnalyticsHandler.GetIncomeExpenseSankey` в `internal/handler/analytics_handler.go`, параметры `level`, `year`, `month` (как у `GetExpensesCalendar`)
- [x] 3.6 Зарегистрировать `GET /api/v1/analytics/income-expense-sankey` в `internal/handler/router.go`
- [x] 3.7 Unit-тест: доход 100000, расход по «Еда/Кафе» 5000 → узел «Еда» получает поток 5000 из «Доходы», узел «Кафе» получает поток 5000 из «Еда»; тест на дефицит (расход > доход) → узла «Остаток» нет

## 4. Прогноз баланса

<!-- spec: balance-forecast -->

- [x] 4.1 Добавить `domain.BalanceForecastPoint{Date time.Time, Balance int64}` в `internal/domain/analytics.go`
- [x] 4.2 Добавить `AnalyticsRepository.DailyIncomeExpenseTrend(ctx, sinceDays int, projectID int64) (income, discretionaryExpense int64, err error)` в `internal/repository/analytics_repo.go`: средние дневные суммы дохода и `specificity='simple'` расхода за последние N (90) дней
- [x] 4.3 Добавить `AnalyticsRepository.HistoricalDailyBalance(ctx, sinceDays int, projectID int64) ([]domain.BalanceForecastPoint, error)` — фактический баланс по дням за последние 90 дней (кумулятивная сумма транзакций от `initial_amount`)
- [x] 4.4 Добавить `AnalyticsService.GetBalanceForecast(ctx, days int, projectID int64) (dto.BalanceForecastResponse, error)` в `internal/service/analytics_service.go`: берёт текущий баланс (`BalanceRepository.GetSnapshot`), проецирует `mandatory_payments` вперёд на `days` (переиспользовать `advanceDate` из `mandatory_payment_service.go` — тот же пакет `service`), прибавляет/вычитает дневной тренд дохода/расхода из 4.2, помечает первую дату пересечения нуля
- [x] 4.5 Добавить `dto.BalanceForecastResponse{CurrentBalance int64, History []BalancePointResponse, Forecast []BalancePointResponse, ZeroCrossingDate *string}` в `internal/dto/analytics.go`
- [x] 4.6 Добавить `AnalyticsHandler.GetBalanceForecast` в `internal/handler/analytics_handler.go`, параметр `days` (30/60/90, по умолчанию 30)
- [x] 4.7 Зарегистрировать `GET /api/v1/analytics/balance-forecast` в `internal/handler/router.go`
- [x] 4.8 Unit-тест: регулярный платёж 5000 через 10 дней снижает прогноз на 5000 начиная с этой даты; тест на `ZeroCrossingDate` при отрицательном балансе внутри горизонта

## 5. Лимиты трат — CRUD с нуля

<!-- spec: spending-limits -->

- [x] 5.1 Добавить `domain.SpendingLimit{ID, TagID int64, Amount int64, PeriodType string, PeriodStart, PeriodEnd *time.Time, ProjectID int64}` в новый `internal/domain/spending_limit.go`
- [x] 5.2 Создать `internal/repository/spending_limit_repo.go`: `List`, `Create`, `Update`, `Delete` (по аналогии с `mandatory_payment_repo.go`) + `SumSpentInPeriod(ctx, tagID int64, periodType string, periodStart, periodEnd *time.Time, projectID int64) (int64, error)` — сумма `transactions WHERE category='expense'` по тегу и его подтегам (через `tagRootMap`-подобный join) в пределах периода (текущий месяц/неделя, вычисленных от `NOW()`, либо явный `period_start`/`period_end`)
- [x] 5.3 Создать `internal/service/spending_limit_service.go`: `List` (возвращает лимит + `spent` через `SumSpentInPeriod`), `Create`, `Update`, `Delete`, валидация (`tag_id` обязателен, `amount > 0`, `period_type IN (month,week,custom)`, при `custom` — `period_start`/`period_end` обязательны)
- [x] 5.4 Добавить `dto.SpendingLimitResponse{ID, TagID int64, Tag TransactionTag, Amount, Spent int64, PeriodType string, PeriodStart, PeriodEnd *string}`, `CreateSpendingLimitRequest`, `UpdateSpendingLimitRequest` в новый `internal/dto/spending_limit.go`
- [x] 5.5 Создать `internal/handler/spending_limit_handler.go`: `List`, `Create`, `Update`, `Delete` (по аналогии с `mandatory_payment_handler.go`)
- [x] 5.6 Зарегистрировать `GET/POST/PUT/DELETE /api/v1/spending-limits[/{id}]` в `internal/handler/router.go`, собрать `SpendingLimitRepository`/`SpendingLimitService`/`SpendingLimitHandler` в `cmd/app/main.go` (там же, где собираются `MandatoryPaymentHandler` и остальные)
- [x] 5.7 Unit-тесты сервиса: превышение лимита (`spent > amount`), расход по подтегу учитывается в лимите родительского тега, валидация `custom` без `period_start`

## 6. Коэффициент «жёсткости» бюджета

<!-- spec: fixed-cost-ratio -->

- [x] 6.1 Добавить `AnalyticsRepository.MonthlyIncome(ctx, year, month int, projectID int64) (int64, error)` в `internal/repository/analytics_repo.go`: `SUM(amount) WHERE category='income'` за месяц
- [x] 6.2 Добавить `AnalyticsService.GetFixedCostRatio(ctx, year, month int, projectID int64) (dto.FixedCostRatioResponse, error)`: сумма дохода из 6.1 + сумма `mandatory_payments.amount` из уже существующего `MandatoryPaymentRepository.List` (без нового SQL), `ratio = mandatory_total / income` (`nil`, если `income = 0`)
- [x] 6.3 Добавить `dto.FixedCostRatioResponse{Income, MandatoryTotal int64, Ratio *float64}` в `internal/dto/analytics.go`
- [x] 6.4 Добавить `AnalyticsHandler.GetFixedCostRatio`, зарегистрировать `GET /api/v1/analytics/fixed-cost-ratio` в `internal/handler/router.go`
- [x] 6.5 Unit-тест: доход 0 → `ratio = nil`; доход 100000, mandatory 40000 → `ratio = 0.4`

## 7. Прогноз накопления на товары вишлиста

<!-- spec: savings-goal-forecast -->

- [x] 7.1 Вынести расчёт дневной ставки накопления (`income_trend − discretionary_trend − mandatory_payments_projected`) из задачи 4.4 в переиспользуемую приватную функцию `dailySavingsRate` в `internal/service/analytics_service.go`, чтобы использовать её и в `GetBalanceForecast`, и здесь (избегаем дублирования формулы)
- [x] 7.2 Добавить `AnalyticsService.GetSavingsGoals(ctx, projectID int64) ([]dto.SavingsGoalResponse, error)`: читает активные товары через `PlannedExpenseRepository.ListByStatus(ctx, "active", projectID)` (существующий метод, не менять), фильтрует `cost_kopecks != nil`, для каждого — `days_needed = ceil((cost - balance) / rate)` при `rate > 0`, иначе `projected_date = nil`
- [x] 7.3 Добавить `dto.SavingsGoalResponse{PlannedExpenseID int64, Title string, Cost int64, ProjectedDate *string}` в `internal/dto/analytics.go`
- [x] 7.4 Добавить `AnalyticsHandler.GetSavingsGoals`, зарегистрировать `GET /api/v1/analytics/savings-goals` в `internal/handler/router.go`
- [x] 7.5 Unit-тест: цена ≤ текущий баланс → `projected_date` = сегодня/null-с-пометкой «уже достаточно» (см. dto на выбор реализации); `rate <= 0` → `projected_date = nil`; положительный `rate` → корректная дата

## 8. Календарь по «настроению» трат

<!-- spec: spending-mood-calendar -->

- [x] 8.1 Добавить `AnalyticsRepository.SpendingMoodByDay(ctx, year, month int, projectID int64) ([]domain.DailyMoodPoint, error)` в `internal/repository/analytics_repo.go`: `GROUP BY day` (по аналогии с `SumByDayInMonth`), с `SUM(amount) FILTER (WHERE specificity='simple')` и `SUM(amount)` на день
- [x] 8.2 Добавить `AnalyticsService.GetSpendingMoodCalendar(ctx, year, month int, projectID int64) ([]dto.MoodDayResponse, error)`: по одному элементу на каждый день месяца, `share = null` для дней без расходов
- [x] 8.3 Добавить `dto.MoodDayResponse{Day int, SimpleAmount, TotalExpense int64, Share *float64}` в `internal/dto/analytics.go`
- [x] 8.4 Добавить `AnalyticsHandler.GetSpendingMoodCalendar`, зарегистрировать `GET /api/v1/analytics/spending-mood-calendar` в `internal/handler/router.go`
- [x] 8.5 Unit-тест: день с 5000 simple из 5000 total → `share = 1.0`; день без расходов → `share = nil`

## 9. Умная лента инсайтов

<!-- spec: spending-insights -->

- [x] 9.1 Добавить `domain.Insight{Type string, Text string}` в `internal/domain/analytics.go`
- [x] 9.2 Добавить `AnalyticsRepository.TagDeltaVsAverage(ctx, projectID int64) ([]domain.TagDelta, error)` — сумма по тегу за текущий месяц vs средняя сумма за предыдущие 3 месяца (одним SQL с `GROUP BY tag_id`, используя `date_trunc`)
- [x] 9.3 Реализовать 3 правила как отдельные методы `AnalyticsService`: `insightTopCategoryGrowth` (дельта >20% и >1000₽, использует 9.2), `insightBiggestTransaction` (`MAX(amount)` за месяц среди расходов), `insightNewTag` (тег с расходами в этом месяце, но без расходов в предыдущих 3) — каждый возвращает `*domain.Insight` (`nil`, если правило не сработало), готовый русский текст формируется на бэкенде
- [x] 9.4 Добавить `AnalyticsService.GetInsights(ctx, projectID int64) ([]dto.InsightResponse, error)`, вызывающий все 3 правила, собирающий непустые результаты (0-3 элемента)
- [x] 9.5 Добавить `dto.InsightResponse{Type, Text string}` в `internal/dto/analytics.go`
- [x] 9.6 Добавить `AnalyticsHandler.GetInsights`, зарегистрировать `GET /api/v1/analytics/insights` в `internal/handler/router.go`
- [x] 9.7 Unit-тесты на каждое правило: рост 25%/500₽ → не срабатывает (дельта меньше 1000₽); рост 25%/2000₽ → срабатывает; новый тег корректно определяется по отсутствию расходов в предыдущих 3 месяцах

## 10. Сравнение периодов

<!-- spec: period-comparison -->

- [x] 10.1 Добавить `AnalyticsRepository.SumByTagForTwoPeriods(ctx, periodAFrom, periodATo, periodBFrom, periodBTo time.Time, projectID int64) (map[int64]domain.PeriodComparisonAmounts, error)` в `internal/repository/analytics_repo.go`: один запрos с `CASE WHEN date BETWEEN $2 AND $3 THEN 'a' ELSE 'b' END AS period, SUM(amount) GROUP BY tag_id, period`
- [x] 10.2 `AnalyticsService.GetPeriodComparison(ctx, mode string, projectID int64) ([]dto.PeriodComparisonResponse, error)`: `mode=prev_month` → период A = текущий месяц, B = предыдущий; `mode=prev_year` → B = тот же месяц год назад; топ-5 по `MAX(amountA, amountB)` (`topNByMax`). Без свёртки подтегов — ни `specs/period-comparison/spec.md`, ни `design.md` (Decision 13) её не требуют, а показ подтегов отдельной строкой даёт больше информации в сравнении «что изменилось», чем агрегат по родителю
- [x] 10.3 Добавить `dto.PeriodComparisonResponse{TagID int64, Name string, CurrentAmount, ComparisonAmount int64}` в `internal/dto/analytics.go`
- [x] 10.4 Добавить `AnalyticsHandler.GetPeriodComparison`, зарегистрировать `GET /api/v1/analytics/period-comparison` в `internal/handler/router.go`
- [x] 10.5 Unit-тест: тег без расходов в периоде сравнения → `comparison_amount = 0`, тег всё равно попадает в топ-5, если входит по текущему периоду
