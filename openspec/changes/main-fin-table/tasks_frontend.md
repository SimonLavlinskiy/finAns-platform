## 1. Тема и layout

<!-- spec: transactions -->

- [x] 1.1 Тёмная финтех-тема: CSS variables в `src/styles/theme.css`, подключить в `index.css`; `workspace/finAns-frontend/`
- [x] 1.2 Обновить `AppLayout`: шрифт Inter, фон `#0F1117`, hover строк таблицы
- [x] 1.3 Компонент `BalanceHeader` в хедере — placeholder заменить на реальные данные (после API)

## 2. API client и типы

<!-- spec: transactions -->

- [x] 2.1 `src/lib/types.ts` — Transaction, Tag, Balance, PaginatedResponse, ApiError
- [x] 2.2 Расширить `src/lib/api-client.ts` — parse error, envelope `{ data, meta }`, helpers для query string
- [x] 2.3 `src/lib/format.ts` — formatKopecks (234500 → `2 345,00 ₽`), formatDate, relativeDate

## 3. Баланс

<!-- spec: balance -->

- [x] 3.1 `src/features/balance/hooks/useBalance.ts` — useQuery GET /api/v1/balance
- [x] 3.2 `src/features/balance/components/EditBalanceDialog.tsx` — попап редактирования initial_amount
- [x] 3.3 Интеграция в Header: цвет зелёный/красный, invalidate после мутаций транзакций

## 4. Теги — страница и combobox

<!-- spec: tags -->

- [x] 4.1 `src/features/tags/hooks/useTags.ts` — useQuery GET /api/v1/tags (дерево)
- [x] 4.2 `src/features/tags/pages/TagsPage.tsx` — дерево с `TagTree`, инлайн CRUD
- [x] 4.3 `src/features/tags/components/TagCombobox.tsx` — tree select + inline create для формы транзакции
- [x] 4.4 Мутации: create/update/delete tag + confirm dialogs для usage/cascade

## 5. Таблица транзакций

<!-- spec: transactions -->

- [x] 5.1 `src/features/transactions/hooks/useTransactions.ts` — useQuery с filters из URL searchParams
- [x] 5.2 `src/features/transactions/components/TransactionFilters.tsx` — сворачиваемая панель, чипы, debounce search, presets дат
- [x] 5.3 `src/features/transactions/components/TransactionsTable.tsx` — TanStack Table: все колонки из спеки, сортировка даты, пагинация 25/50/100
- [x] 5.4 `src/features/transactions/pages/TransactionsPage.tsx` — сборка: filters + table + FAB «+ Добавить» + empty state
- [x] 5.5 Skeleton loader при `isLoading`; toast при ошибках API

## 6. Форма транзакции (drawer)

<!-- spec: transactions -->

- [x] 6.1 `src/features/transactions/schemas/transactionSchema.ts` — Zod: title, amount, date, tag_id, category, specificity, comment, url
- [x] 6.2 `src/features/transactions/components/TransactionFormSheet.tsx` — Sheet 480px, переключатель Расход/Доход, все поля из ТЗ
- [x] 6.3 Кнопки: Сохранить, Сохранить и добавить ещё, Отмена с confirm dialog
- [x] 6.4 localStorage черновик: save on close, restore prompt on open
- [x] 6.5 File upload zone (drag&drop, progress), URL input, autocomplete title via suggestions API
- [x] 6.6 `useTransactionMutations.ts` — create, update, delete, duplicate; invalidate transactions + balance

## 7. Действия в таблице

<!-- spec: transactions -->

- [x] 7.1 Dropdown «⋯»: Редактировать (open sheet), Дублировать (API + open sheet), Удалить (confirm modal)
- [x] 7.2 Клик по тегу → set filter tag_ids в URL
- [x] 7.3 Иконки вложения: скрепка (file download link), ссылка (external URL)

## 8. Роутинг и качество

<!-- spec: transactions -->

- [x] 8.1 Обновить `src/app/router.tsx` — `/transactions` default, `/tags` → TagsPage
- [x] 8.2 `npm run lint`, `typecheck`, `build` — без ошибок
- [x] 8.3 CI workflow проходит
- [x] 8.4 Commit + push `features/main-fin-table` в finAns-frontend
