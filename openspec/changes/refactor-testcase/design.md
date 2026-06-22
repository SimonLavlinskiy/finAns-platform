# Design: refactor-testcase

## Часть 1: Подход к рефакторингу

### Backend

Аудит ведётся по слоям в порядке: `pkg` → `domain` → `repository` → `service` → `handler` → `middleware` → `cmd`.

Паттерны которые надо проверить:
- Все ошибки из `rows.Scan` и `rows.Close` обработаны
- `defer rows.Close()` всегда после проверки err от `Query`
- Нет `_ =` на возвращаемых ошибках в production-коде
- `context.Context` передаётся везде, нет `context.Background()` в middleware
- HTTP-статусы соответствуют семантике (201 для создания, 204 для удаления, 422 для валидации)
- Нет дублирования логики между хендлерами (decodeJSON, writeServiceError, parseID)
- Валидация входных данных есть на уровне сервиса (не только хендлера)
- Тесты покрывают happy path + error path для каждого публичного метода сервиса

### Frontend

Паттерны которые надо проверить:
- Все `useQuery` имеют `isError` обработку
- Все мутации имеют `onError` с пользовательским сообщением
- Нет `console.log` в production коде
- Нет `any` типов без комментария-объяснения
- Все `useEffect` имеют правильные dependency arrays
- Формы валидируются на клиенте перед отправкой
- Деструктивные операции (delete) требуют подтверждения
- Нет дублирования логики между страницами

## Часть 2: Структура тест-кейсов

```
testcases/
├── README.md                    — инструкция по запуску Playwright
├── 01-auth.md                   — авторизация
├── 02-balance.md                — баланс
├── 03-transactions.md           — операции (CRUD, фильтры, пагинация)
├── 04-tags.md                   — метки
├── 05-import.md                 — импорт CSV
├── 06-mandatory-payments.md     — план / обязательные платежи
├── 07-analytics.md              — аналитика
└── 08-navigation.md             — навигация и layout
```

### Формат каждого тест-кейса

```
## TC-XXX: <название>

**Preconditions**: <что должно быть в системе>
**Steps**:
1. <шаг>
2. <шаг>
**Expected**: <что должно произойти>
**Playwright hint**: <selector / action hint>
```

### Playwright-специфика

- Все селекторы через `data-testid` (там где они будут добавлены) или семантические роли
- Base URL: `https://finanns.space`
- Auth: логин перед каждым тестом (или через `storageState`)
- Каждый тест изолирован (cleanup через API или фикстуры)
