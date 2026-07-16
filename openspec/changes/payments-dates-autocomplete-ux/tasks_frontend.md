## 1. MandatoryPayments — перенос кнопки отмены в меню

<!-- spec: mandatory-payments -->

- [x] 1.1 В `workspace/finAns-frontend/src/lib/types.ts` добавлено `is_paid_current_period: boolean` в тип `MandatoryPayment`
- [x] 1.2 В `MandatoryPaymentsPage.tsx`: кнопка «Отменить» убрана из колонки `paid`, статус «✓ Оплачено» / «Оплатить» использует `row.original.is_paid_current_period`
- [x] 1.3 Добавлен `DropdownMenuItem` «Отменить оплату» (деструктивный стиль, с `DropdownMenuSeparator`) в колонку `actions`, условно рендерится при `row.original.is_paid_current_period`, вызывает `unmarkPaidMutation.mutate(row.original.id)`
- [x] 1.4 Удалена неиспользуемая `isCurrentlyPaid` из `mandatory-payments.ts`; `getRowClassName` тоже переведён на `row.is_paid_current_period`. Попутно найден и убран мёртвый тест `tests/mandatory-payments.test.ts` на несуществующую `isPaidThisPeriod` (заготовка под похожую логику, оставленная незаконченной в прошлой сессии, падала независимо от этого change) — эта логика теперь целиком на бэкенде (`is_paid_current_period`)
- [x] 1.5 Колонка `next_payment_date` обёрнута в `formatDate()`

## 2. Date-picker — общий компонент и зависимости

<!-- spec: date-picker -->

- [x] 2.1 Добавлены зависимости `react-day-picker`, `date-fns`, `@radix-ui/react-popover`
- [x] 2.2 Создан `workspace/finAns-frontend/src/components/ui/popover.tsx`
- [x] 2.3 Создан `workspace/finAns-frontend/src/components/ui/calendar.tsx` (обёртка над `react-day-picker` v10, локаль `ru` из `react-day-picker/locale`)
- [x] 2.4 Создан `workspace/finAns-frontend/src/components/ui/date-picker.tsx`: `DatePicker({ value, onChange })`, контракт `yyyy-MM-dd` сохранён; триггер показывает `format(date, "dd.MM.yyyy", { locale: ru })` (из `date-fns/locale`)
- [x] 2.5 Заменены все 5 `type="date"` на `<DatePicker />` (`ProjectCreateSheet.tsx` и `PlannedExpenseSheet.tsx` — с `clearable`, т.к. поля необязательные); добавлен опциональный `clearable`/`data-testid` в сам компонент
- [x] 2.6 Аудит нашёл ещё 2 места с сырым выводом даты: `ProjectsPage.tsx` (`p.started_at`) и `PlannedExpenseRow.tsx` (`item.due_date`) — обёрнуты в `formatDate()`

## 3. Калькулятор в поле суммы транзакции

<!-- spec: transaction-calculator -->

- [x] 3.1 Добавлен `evaluateAmountExpression(input: string): number | null` в `format.ts` — recursive-descent парсер (числа, `+ - * /`, скобки, `,`/`.`), без `eval`/`new Function`
- [x] 3.2 `TransactionFormSheet.tsx`: `onBlur` на поле суммы вычисляет выражение и заменяет значение при успехе; при неудаче — без изменений (сработает обычная валидация)
- [x] 3.3 Тесты добавлены в существующий `tests/format.test.ts` (тесты в этом репо лежат в `tests/`, не `src/`): сложение, приоритет операций, скобки, запятая как разделитель, число без оператора → `null`, пустая строка, висящий оператор, деление на ноль, нечисловой ввод. Заодно удалён устаревший `describe("relativeDateLabel", ...)` — функция была удалена в прошлой сессии, но тест на неё остался и падал независимо от этого change

## 4. Увеличенное окно выбора категории

<!-- spec: transactions -->

- [x] 4.1 `MAX_MENU_HEIGHT` увеличена с `288` до `420` в `TagFilterPicker.tsx`

## 5. Автодополнение наименования транзакции

<!-- spec: transactions -->

- [x] 5.1 `api.ts` `fetchSuggestions` обновлён под `TransactionSuggestion[]` (новый тип в `types.ts`)
- [x] 5.2 Вынесен `workspace/finAns-frontend/src/lib/use-dropdown-position.ts`; `TagFilterPicker.tsx` переведён на него без изменения поведения
- [x] 5.3 Создан `workspace/finAns-frontend/src/components/TitleAutocomplete.tsx` (debounce 250мс, дропдаун на хуке из 5.2)
- [x] 5.4 `TransactionFormSheet.tsx`: наименование теперь через `TitleAutocomplete`, выбор подсказки заполняет `amount`/`tagId`/`specificity`/`category`
- [x] 5.5 Проверено вживую: поднят локальный стек (Postgres + `go run ./cmd/app` + `npm run dev`), в БД добавлены тестовые транзакции («Такси» ×3 по 300₽ + ×2 по 500₽, «Сливки»/«Мороженое из сливок»/«Варенье из слив», «Автобус»), Playwright-скрипт (временный, в scratchpad → `finAns-e2e/`, удалён после прогона) подтвердил: дедуп (1 подсказка «Такси»), автоподстановка по самой частой комбинации (300₽), word-start поиск («слив» → 3 подсказки), отсутствие мэтча по середине слова («обус» не находит «Автобус» — подтверждает, что word-split+ILIKE подход из 2.1 работает корректно на реальном Postgres), календарь-пикер (скриншот: 16.07.2026, русская локаль), калькулятор (378+567+844 → 1789). По ходу обнаружены и убиты 3 осиротевших `go run` процесса с прошлых сессий, державших порт 8082 с устаревшим кодом — из-за них первая попытка проверки ложно проходила против старой версии бэкенда

## 6. Палитра столбцов календаря расходов

<!-- spec: expenses-calendar -->

- [x] 6.1 Добавлены CSS-переменные `--bar-past`, `--bar-past-hover`, `--bar-today`, `--bar-today-hover`, `--bar-planned-bg`, `--bar-planned-border`, `--bar-planned-hover-bg`, `--bar-planned-hover-border` в `index.css`
- [x] 6.2 Добавлена `getBarState(item, level, now)` в `ExpensesCalendar.tsx`: переиспользует уже вычисленный на бэкенде `is_current` для «today», сравнивает `item.key` (день) или год+месяц (месяц) с сегодняшней датой для past/planned
- [x] 6.3 Классы заливки заменены на `bg-[var(--bar-past)] hover:bg-[var(--bar-past-hover)]` и т.д.; для `planned` — `bg-[var(--bar-planned-bg)] border-[1.5px] border-dashed border-[var(--bar-planned-border)]` + hover-варианты
- [x] 6.4 Визуально проверено на локальном стеке (Postgres + backend + `npm run dev`, скриншоты Playwright): прошедший день с данными — серо-голубой `#C3C9D5`; сегодня — золотистый `#E0C68F`; будущие дни — бледная заливка с пунктирным контуром; `rounded-md` и фиксированная высота 6px для пустых дней сохранены во всех трёх состояниях
