## 1. Подсветка регулярного платежа в календаре

<!-- spec: mandatory-payment-calendar-highlight -->

- [x] 1.1 `ExpensesCalendar.tsx` дозагружает регулярные платежи через `useQuery(["mandatory-payments"], ...)` — тот же query key, что на `MandatoryPaymentsPage.tsx`, переиспользует кэш
- [x] 1.2 `mandatoryPaymentsByDate: Map<string, MandatoryPayment[]>` строится через `useMemo` по `next_payment_date`
- [x] 1.3 `dayMandatoryPayments = level === "day" && barState === "planned" ? mandatoryPaymentsByDate.get(item.key) : undefined` — вычисляется на каждый день, `undefined` в годовом виде
- [x] 1.4 Визуальное состояние: `border-solid border-[hsl(var(--primary))]` вместо `border-dashed border-[var(--bar-planned-border)]` для дней с `dayMandatoryPayments`
- [x] 1.5 `onMouseEnter` теперь открывает попап при `item.has_data || dayMandatoryPayments`
- [x] 1.6 Создан отдельный `MandatoryPaymentDayPopup.tsx` (не расширение `CalendarDayPopup` — разные формы данных: список платежей вместо разбивки по тегам/транзакциям)
- [x] 1.7 Проверено вживую: день с оплатой сегодня (`next_payment_date` = сегодня) не показывает подсветку/попап — `barState` для сегодняшнего дня всегда `"today"`, никогда `"planned"`, so `dayMandatoryPayments` естественно `undefined`

## 2. Попап подтверждения оплаты регулярного платежа

<!-- spec: mandatory-payments -->

- [x] 2.1 `markMandatoryPaymentPaid(id: number, payload?: { amount?: number })` в `src/lib/api.ts` — payload передан инлайн-типом (без отдельного именованного типа в `types.ts`, не оправдано ради одного разового поля)
- [x] 2.2 Создан `MarkPaidConfirmSheet.tsx`: наименование + тег read-only, поле суммы (`Input` + `parseRublesInput`, предзаполнено `payment.amount / 100`), пояснение про дату, кнопки «Оплатить»/«Отмена»
- [x] 2.3 Клик «Оплатить» на `MandatoryPaymentsPage.tsx` теперь открывает попап (`setMarkPaidTarget(row.original)`) вместо прямого вызова мутации; мутация и её `onSuccess`/`onError` перенесены внутрь `MarkPaidConfirmSheet`
- [x] 2.4 После успеха — инвалидация `["mandatory-payments"]` (через `setQueryData`, как раньше), `["transactions"]`, `["balance"]`, плюс `["analytics"]` (индекс свободы/прогноз баланса тоже зависят от новых транзакций), закрытие попапа. Проверено вживую: изменённая сумма (30000→32000) сохранена в транзакции, дата транзакции = сегодня, `next_payment_date` продвинулась от исходной даты (10.07→10.08), а не от даты подтверждения

## 3. Локальные шрифты

<!-- spec: local-fonts -->

- [x] 3.1 Скопированы 3 вариативных файла (`Comfortaa-VariableFont_wght.ttf`, `Nunito-VariableFont_wght.ttf`, `Nunito-Italic-VariableFont_wght.ttf`) в новую `workspace/finAns-frontend/src/assets/fonts/`
- [x] 3.2 Добавлены 3 `@font-face` (Comfortaa `300 700`, Nunito normal `200 1000`, Nunito italic `200 1000` — фактические диапазоны осей вариативных шрифтов) в `src/index.css`, `font-display: swap`, формат `truetype-variations`
- [x] 3.3 Убраны оба `preconnect` и `<link rel="stylesheet">` на `fonts.googleapis.com` из `index.html`
- [x] 3.4 Проверено — `font-family: "Comfortaa"`/`"Nunito"` на `h1..h6`/`body` не менялись, продолжают работать с новыми `@font-face`
- [x] 3.5 Проверено сборкой (`npm run build`): в `dist/assets/` попадают только 3 скопированных файла с хешированными именами; исходная `fonts/` (вне `src/`, ~20+ статичных файлов + `.DS_Store`) не участвует в сборке и не коммитится (остаётся untracked)
