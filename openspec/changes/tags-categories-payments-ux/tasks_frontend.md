## 1. TagFilterPicker — скролл и collapsed by default

<!-- spec: tags -->

- [x] 1.1 В `workspace/finAns-frontend/src/components/TagFilterPicker.tsx`: убрать `init[t.id] = true` из инициализатора `expanded` — начальное состояние `{}` (все свёрнуты)
- [x] 1.2 В `TagFilterPicker.tsx`: добавить `onWheel={(e) => { e.currentTarget.scrollTop += e.deltaY; }}` к portal-div с `overflow-y-auto`; добавить `{ passive: false }` если нужно

## 2. Переименование «Метки» → «Категории»

<!-- spec: tags -->

- [x] 2.1 В `TagFilterPicker.tsx`: заменить все строки «метку» / «метки» / «Все метки» / «Выберите метку» на «категорию» / «категории» / «Все категории» / «Выберите категорию»; переименовать `TagFormPicker` placeholder
- [x] 2.2 Глобальный поиск по `workspace/finAns-frontend/src` — заменить русские строки «Метки», «метку», «Добавить метку», «Новая метка», «Редактировать метку» и т.д. на эквиваленты с «Категории»
- [x] 2.3 В `workspace/finAns-frontend/src/app/router.tsx`: удалить роут `/tags` (или `TagsPage`)
- [x] 2.4 В `workspace/finAns-frontend/src/components/layout/AppLayout.tsx`: убрать навигационный пункт «Метки» / «Категории» из sidebar

## 3. Управление категориями в настройках проекта

<!-- spec: tags-per-project -->

- [x] 3.1 В `workspace/finAns-frontend/src/features/projects/pages/ProjectSettingsPage.tsx`: добавить секцию «Категории» с полным UI из `TagsPage` (список, кнопки добавить/редактировать/удалить)
- [x] 3.2 Удалить `workspace/finAns-frontend/src/features/tags/pages/TagsPage.tsx` (или оставить как re-export если что-то импортирует)
- [x] 3.3 В `workspace/finAns-frontend/src/lib/api.ts`: убедиться что `fetchTags`, `createTag` и т.д. работают без изменений (project_id берётся из сессии на бэке)

## 4. DataTable — пагинатор внизу

<!-- spec: ui-table -->

- [x] 4.1 В `workspace/finAns-frontend/src/components/DataTable.tsx`: добавить props `pageSize?: number`, `pageSizeOptions?: number[]`, `onPageSizeChange?: (n: number) => void`
- [x] 4.2 Добавить `<tfoot>` / нижнюю панель с `<select>` для выбора строк на страницу (варианты: 10, 25, 50, 100); отображать только если передан `onPageSizeChange`
- [x] 4.3 В `workspace/finAns-frontend/src/features/transactions/pages/TransactionsPage.tsx`: убрать верхний селект количества строк, передать `pageSize` и `onPageSizeChange` в `DataTable`
- [x] 4.4 Проверить и обновить аналогично остальные страницы с `DataTable` если у них есть per_page

## 5. MandatoryPayments — исправление статуса и UnmarkPaid

<!-- spec: mandatory-payments -->
<!-- spec: tag-cancel-payment -->

- [x] 5.1 В `workspace/finAns-frontend/src/lib/types.ts`: добавить `last_paid_at: string | null` в тип `MandatoryPayment`
- [x] 5.2 В `workspace/finAns-frontend/src/lib/mandatory-payments.ts`: заменить `isPaidThisPeriod(next_payment_date)` на проверку по `last_paid_at` — `isCurrentlyPaid(lastPaidAt: string | null): boolean` проверяет `lastPaidAt != null`
- [x] 5.3 В `workspace/finAns-frontend/src/lib/api.ts`: добавить `unmarkMandatoryPaymentPaid(id: number)` → `POST /mandatory-payments/:id/unmark-paid`
- [x] 5.4 В `workspace/finAns-frontend/src/features/mandatory-payments/pages/MandatoryPaymentsPage.tsx`: добавить `unmarkPaidMutation`; обновить колонку `paid` — показывать кнопку «Отменить» рядом с «✓ Оплачено»; вызывать `unmarkMandatoryPaymentPaid`; после success инвалидировать `transactions` и `balance`
- [x] 5.5 Обновить все места где вызывается `isPaidThisPeriod` — заменить на `isCurrentlyPaid(payment.last_paid_at)`, передавая `last_paid_at`
