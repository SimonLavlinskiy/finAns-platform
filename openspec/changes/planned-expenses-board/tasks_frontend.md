## 1. Типы и API-клиент

<!-- spec: planned-expenses -->

- [ ] 1.1 Добавить в `workspace/finAns-frontend/src/lib/types.ts`: `PlannedExpenseCategory{id, name, color, sort_order}`, `PlannedExpense{id, category_id, title, cost_kopecks: number | null, due_date: string | null, url: string | null, priority: "low"|"medium"|"high", effective_priority: "low"|"medium"|"high", is_due_soon: boolean, status: "active"|"archived"}`, `PlannedExpenseCategoryWithItems extends PlannedExpenseCategory { items: PlannedExpense[] }`
- [ ] 1.2 Добавить в `src/lib/api.ts`: `fetchPlannedExpenseCategories()`, `reorderPlannedExpenseCategories(ids: number[])`, `createPlannedExpense(payload)`, `updatePlannedExpense(id, payload)`, `deletePlannedExpense(id)`, `completePlannedExpense(id)`, `fetchArchivedPlannedExpenses()`
- [ ] 1.3 Добавить `CATEGORY_COLORS` (фиксированная палитра свотчей, согласованная с backend `colorutil.CategoryColorPalette`) в `src/lib/palette.ts`

## 2. Утилиты приоритета и контраста

<!-- spec: planned-expenses -->

- [ ] 2.1 Добавить `src/lib/planned-expenses.ts`: `getEffectivePriority(item)` (фронтовый дубликат серверной логики для оптимистичного обновления UI без перезапроса), `PRIORITY_DOT_COLORS` (зелёный/жёлтый/красный), `PRIORITY_SORT_WEIGHT`
- [ ] 2.2 Добавить `sortItemsByPriority(items: PlannedExpense[])`: сортировка по `effective_priority DESC`, затем по `created_at ASC`/порядку в массиве
- [ ] 2.3 Убедиться, что `contrastText()` в `src/lib/palette.ts` принимает произвольный hex (не только 4 цвета тегов) — расширить при необходимости для работы с `CATEGORY_COLORS`

## 3. Drag-and-drop зависимость

<!-- spec: planned-expenses -->

- [ ] 3.1 Установить `@dnd-kit/core` и `@dnd-kit/sortable` (`pnpm add` в `workspace/finAns-frontend/`)

## 4. Форма товара (Sheet)

<!-- spec: planned-expenses -->

- [ ] 4.1 Создать `src/features/planned-expenses/components/PlannedExpenseSheet.tsx` на основе паттерна `MandatoryPaymentSheet` (`open`, `onOpenChange`, `item`, `categories`, `onSaved`) с использованием существующего `Sheet`/`SheetContent`/`SheetHeader`
- [ ] 4.2 Реализовать поля формы через React Hook Form + Zod: Наименование (required), Стоимость (optional number), Дата (optional, calendar picker — переиспользовать существующий date-picker компонент, если есть, иначе добавить на базе `react-day-picker`), Ссылка (optional URL), Приоритет (select: Низкий/Средний/Высокий)
- [ ] 4.3 Реализовать поле «Категория» как combobox с двумя режимами: выбор из списка существующих категорий, либо ввод нового названия → показ `CategoryColorSwatchPicker` под полем
- [ ] 4.4 Создать `src/features/planned-expenses/components/CategoryColorSwatchPicker.tsx`: рендерит свотчи из `CATEGORY_COLORS`, управляемый `value`/`onChange`
- [ ] 4.5 Реализовать кнопки «Сохранить» (сохраняет, закрывает панель) и «Сохранить и ещё» (сохраняет, очищает форму, не закрывает панель)
- [ ] 4.6 Добавить мутации `useMutation` для create/update с инвалидацией `["planned-expense-categories"]`

## 5. Карточки категорий

<!-- spec: planned-expenses -->

- [ ] 5.1 Создать `src/features/planned-expenses/components/CategoryCard.tsx`: фон = `category.color`, авто-контраст текста через `contrastText()`, заголовок — название категории, список товаров через `PlannedExpenseRow`, текстовая подсказка при пустом списке
- [ ] 5.2 Создать `src/features/planned-expenses/components/PlannedExpenseRow.tsx`: точка приоритета (по `effective_priority`, цвет из `PRIORITY_DOT_COLORS`) — рендерится всегда; стоимость и дата — рендерятся только если значение присутствует, без плейсхолдеров
- [ ] 5.3 В `PlannedExpenseRow` реализовать подсветку даты тёплым жёлтым при `item.is_due_soon === true` (CSS-класс с нерезким жёлтым фоном/текстом, проверить читаемость на каждом цвете `CATEGORY_COLORS`)
- [ ] 5.4 Реализовать кликабельное наименование при наличии `url`: обёртка `<a>` с `target="_blank" rel="noreferrer"`, отдельный класс цвета текста (видимый без hover) + hover-эффект (подчёркивание/изменение оттенка) + `cursor-pointer`
- [ ] 5.5 Реализовать hover-only меню действий (иконка `MoreHorizontal`/`Pencil`, `opacity-0 group-hover:opacity-100`, не влияет на layout строки): пункты «Выполнено», «Редактировать», «Удалить» через `DropdownMenu` (как в `MandatoryPaymentsPage`)
- [ ] 5.6 «Удалить» — с подтверждением (`confirm`, аналогично `MandatoryPaymentsPage`), мутация `deletePlannedExpense` + инвалидация
- [ ] 5.7 «Выполнено» — мутация `completePlannedExpense` + инвалидация активного списка и (если открыт) архива
- [ ] 5.8 «Редактировать» — открывает `PlannedExpenseSheet` с предзаполненными данными товара

## 6. Сетка категорий и drag-and-drop

<!-- spec: planned-expenses -->

- [ ] 6.1 Создать `src/features/planned-expenses/components/CategoryGrid.tsx`: CSS grid с `auto-fit`/`minmax` для 1/2/3 колонок по ширине контейнера, `align-items: stretch` для равной высоты карточек в строке
- [ ] 6.2 Обернуть `CategoryGrid` в `DndContext` + `SortableContext` (`@dnd-kit/sortable`), каждую `CategoryCard` — в `useSortable`
- [ ] 6.3 Реализовать `onDragEnd`: вычислить новый порядок ID, оптимистично обновить локальный кэш `["planned-expense-categories"]`, вызвать `reorderPlannedExpenseCategories`, откат при ошибке

## 7. Страница и архив

<!-- spec: planned-expenses -->

- [ ] 7.1 Заменить placeholder в `src/features/planned-expenses/pages/PlannedExpensesPage.tsx`: кнопка «+ Добавить» (тёмная, скруглённая, иконка `Plus` слева, `data-testid="btn-add-planned-expense"`) открывает `PlannedExpenseSheet`, ниже — `CategoryGrid`
- [ ] 7.2 Добавить переключатель вкладок «Активные» / «Архив» на странице; вкладка «Архив» рендерит плоский список через `fetchArchivedPlannedExpenses` (без карточек категорий, без drag-and-drop — простой `DataTable` или список, переиспользуя `PlannedExpenseRow` в режиме без меню действий)
- [ ] 7.3 Состояния загрузки/ошибки/пустого списка — по аналогии с `MandatoryPaymentsPage.tsx`

## 8. Frontend-тесты

<!-- spec: planned-expenses -->

- [ ] 8.1 Unit-тест `getEffectivePriority`/`sortItemsByPriority` (`src/lib/planned-expenses.test.ts`): дата ≤3 дня → high, дата в прошлом → не влияет, сортировка групп приоритета с сохранением порядка добавления
- [ ] 8.2 Unit-тест `contrastText()` на наборе `CATEGORY_COLORS` — для каждого цвета проверить ожидаемый (тёмный/светлый) результат
- [ ] 8.3 Компонентный тест `PlannedExpenseRow`: рендер без стоимости/даты не создаёт лишних DOM-узлов под эти поля; рендер с `url` оборачивает название в `<a>` с `target="_blank"`
