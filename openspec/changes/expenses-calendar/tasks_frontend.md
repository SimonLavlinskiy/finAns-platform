## 1. Типы и API client

<!-- spec: expenses-calendar -->

- [x] 1.1 `src/lib/types.ts` — `CalendarLevel`, `CalendarTagBreakdown`, `CalendarTransactionBrief`, `CalendarItem`, `CalendarResponse`; `workspace/finAns-frontend/`
- [x] 1.2 `src/lib/api.ts` — `fetchExpensesCalendar(level, year, month?)` → `GET /api/v1/analytics/expenses-calendar`

## 2. Hook данных

<!-- spec: expenses-calendar -->

- [x] 2.1 `src/features/analytics/hooks/useExpensesCalendar.ts` — `useQuery(['analytics','expenses-calendar', level, year, month])`
- [x] 2.2 Добавить инвалидацию `['analytics']` в существующий `useTransactionMutations.ts` (create/update/delete) — иначе календарь не обновится после правки транзакции

## 3. Компонент календаря — каркас и навигация

<!-- spec: expenses-calendar -->

- [x] 3.1 `src/features/analytics/components/ExpensesCalendar.tsx` — состояние `level`/`year`/`month`, рендер столбиков (высота = `% от max(amount)` в текущем наборе `items`), плейсхолдер 4px для `hasData=false`
- [x] 3.2 Подсветка `isCurrent` (синий) vs остальные (серый) столбики
- [x] 3.3 Футер: название периода + сумма (`formatKopecks`), кнопки навигации «← / →»; кнопка «←» скрыта при `hasPrevious=false`
- [x] 3.4 Клик на столбец месяца в годовом виде → `setLevel('day')` + `setMonth(...)`

## 4. Hover-попап

<!-- spec: expenses-calendar -->

- [x] 4.1 `src/features/analytics/components/CalendarDayPopup.tsx` — позиционирование `position: absolute` относительно контейнера календаря (паттерн из `TagFilterPicker`, без `createPortal` — попап не вложен в `Sheet`/`Dialog`)
- [x] 4.2 Переключатель «По Расходам» / «По Статьям» (локальный `useState`, persist не нужен)
- [x] 4.3 Режим «По Статьям»: стек-бар (цвета из `tag.color`) + список тегов с суммой и `percent`
- [x] 4.4 Режим «По Расходам»: список `transactions` (название + сумма)
- [x] 4.5 Открытие попапа только при `hasData=true`; показ/скрытие по hover (desktop) и tap (mobile, закрытие по клику вне попапа)

## 5. Переход в таблицу транзакций

<!-- spec: expenses-calendar -->

- [x] 5.1 Клик по столбцу дня (вне попапа) → `navigate('/transactions?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD')`, используя существующий URL-sync фильтров

## 6. Страница и роутинг

<!-- spec: expenses-calendar -->

- [x] 6.1 `src/features/analytics/pages/AnalyticsPage.tsx` — сборка `ExpensesCalendar` + skeleton при `isLoading`
- [x] 6.2 `src/app/router.tsx` — маршрут `/analytics` (под `RequireAuth`)
- [x] 6.3 `AppLayout` — пункт меню «Аналитика» (`BarChart3` из `lucide-react`) между «Метки» и «План», desktop sidebar + mobile header

## 7. Качество

<!-- spec: expenses-calendar -->

- [x] 7.1 `npm run lint`, `tsc --noEmit`, `npm run build` — без ошибок
- [x] 7.2 Ручная проверка в браузере пользователем на production — обнаружены и исправлены 2 бага: (1) hover-попап позиционировался `position:absolute` относительно колонки дня вместо контейнера графика и улетал за пределы viewport — попап вынесен на уровень `chartRef`, клэмп считается от `window.innerWidth`; (2) навигация по месяцам/годам только пошаговыми кнопками ←/→ была неудобной — добавлен прямой пикер месяца/года и кнопка «Сегодня»
