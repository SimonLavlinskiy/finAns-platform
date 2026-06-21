## 1. API-клиент импорта

<!-- spec: import-transactions -->

- [x] 1.1 Добавить типы `ImportBatch`, `ModerationRow`, `RowStatus` в src/lib/types.ts (поля по ответу backend: id, batch_id, row_number, title, amount, date, tag_id, category, specificity, comment, url, status, field_errors)
- [x] 1.2 Добавить функции в src/lib/api.ts: `uploadImportBatch(file: File)` (multipart `POST /api/v1/import/batches`), `fetchActiveImportBatch()` (`GET /api/v1/import/batches/active`), `updateModerationRow(id, patch)` (`PATCH /api/v1/import/rows/{id}`), `acceptModerationRow(id)` (`POST /api/v1/import/rows/{id}/accept`), `acceptModerationBatch(batchId, rowIds)` (`POST /api/v1/import/batches/{id}/accept`), `closeImportBatch(batchId)` (`POST /api/v1/import/batches/{id}/close`)

## 2. Страница и роутинг

<!-- spec: import-transactions -->

- [x] 2.1 Создать src/features/import/pages/ImportPage.tsx: при монтировании вызывает `fetchActiveImportBatch()` (TanStack Query) для восстановления незакрытого батча
- [x] 2.2 Зарегистрировать маршрут `{ path: "import", element: <ImportPage /> }` в src/app/router.tsx и пункт навигации в layout (по аналогии с существующими пунктами меню)

## 3. Зона загрузки

<!-- spec: import-transactions -->

- [x] 3.1 Создать src/features/import/components/ImportDropzone.tsx: drag-and-drop + кнопка «Выбрать файл», фильтр на `.csv`, вызывает `uploadImportBatch`, показывает имя файла и количество строк после ответа сервера
- [x] 3.2 Отображение состояния загрузки/ошибки сети при `uploadImportBatch` (спиннер, тост об ошибке)
- [x] 3.3 Создать src/features/import/components/ImportFormatHelp.tsx: иконка-вопрос (lucide `HelpCircle`) рядом с кнопкой «Выбрать файл», открывающая `Dialog` (src/components/ui/dialog.tsx) со списком обязательных колонок (`title`, `amount`, `date`), необязательных (`tag`, `category`, `specificity`, `comment`, `url`), требованиями к формату (UTF-8, разделитель — запятая, дата `YYYY-MM-DD`, сумма с точкой, `category` ∈ {expense, income}, `specificity` ∈ {required, simple}, тег — путь через `/`) и примером строки CSV

## 4. Таблица модерации

<!-- spec: import-transactions -->

- [x] 4.1 Создать src/features/import/components/ModerationTable.tsx со столбцами: чекбокс, Название, Сумма, Дата, Тег, Категория, Специфика, Комментарий, Ссылка, Статус, Действие
- [x] 4.2 Реализовать inline-редактирование ячеек (input/select), отправку `updateModerationRow` при сохранении, оптимистичное обновление с откатом при ошибке
- [x] 4.3 Поле «Тег» — переиспользовать `TagFormPicker` (src/components/TagFilterPicker.tsx) с деревом из `fetchTags()`; поддержать inline-создание нового тега через существующий флоу
- [x] 4.4 Подсветка красной рамкой + tooltip для ячеек с `field_errors` от сервера; жёлтая рамка для незаполненных `tag`/`category`/`specificity` при отсутствии ошибок
- [x] 4.5 Запрет очистки `title`/`amount`/`date` до пустого значения на уровне input (валидация перед отправкой PATCH)
- [x] 4.6 Список ошибок парсинга над таблицей («Строка N: поле "X" ... — "Y"») на основе `field_errors` строк со статусом `error`

## 5. Панель управления и принятие строк

<!-- spec: import-transactions -->

- [x] 5.1 Создать src/features/import/components/ModerationToolbar.tsx: чекбокс «Выбрать все готовые» (только статус `ready`), счётчики «Всего / Готово / Ошибок / Перенесено» (Перенесено = total_rows − текущее количество строк), кнопка «Принять выбранные (N)»
- [x] 5.2 Кнопка «Принять» в строке: disabled при `pending`/`error` с tooltip «Заполните: …», активна при `ready`, вызывает `acceptModerationRow`
- [x] 5.3 Массовое принятие: confirm-диалог «Добавить N транзакций в таблицу расходов?» → `acceptModerationBatch`
- [x] 5.4 После успешного accept — локальная пометка строки как «Перенесено» на 1–2 секунды (CSS fade-out), затем удаление из локального списка; инвалидация баланса в хедере (`queryClient.invalidateQueries(["balance"])`)

## 6. Завершение импорта

<!-- spec: import-transactions -->

- [x] 6.1 Баннер завершения, когда нет строк со статусом `pending`/`ready`: «Импорт завершён: M транзакций добавлено, K строк с ошибками»
- [x] 6.2 Кнопка «Перейти к транзакциям» → `navigate("/transactions")`
- [x] 6.3 Кнопка «Загрузить новый файл» → `closeImportBatch`, сброс локального состояния страницы, очистка query-кэша активного батча
