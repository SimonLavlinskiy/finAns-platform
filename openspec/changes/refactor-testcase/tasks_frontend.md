# Frontend tasks: refactor-testcase

## 1. Аудит и фиксы — проводить в ходе apply

### 1.1 `src/lib/`
- [ ] Убрать все `console.log` из production-кода
- [ ] Заменить `any` типы на конкретные там где возможно
- [ ] Убедиться что `api-client.ts` корректно обрабатывает network errors (нет интернета)

### 1.2 `src/features/transactions/`
- [ ] `TransactionFormSheet` — проверить dependency array в `useEffect`
- [ ] `TransactionsPage` — убедиться что пагинация сбрасывается при изменении фильтров

### 1.3 `src/features/import/`
- [ ] `ImportPage` — убедиться что `fadingIds` очищаются после анимации (память)
- [ ] `ModerationTable` — убедиться что `onBlur` handlers дебаунсятся или не вызывают лишние запросы

### 1.4 `src/features/mandatory-payments/`
- [ ] `MandatoryPaymentsPage` — убедиться что после `markPaid` checkbox визуально сбрасывается (controlled)
- [ ] `MandatoryPaymentSheet` — убедиться что форма сбрасывается при закрытии

### 1.5 `src/features/analytics/`
- [ ] Проверить что popup закрывается при клике вне него (click outside handler)

### 1.6 `src/features/tags/`
- [ ] Убедиться что удаление тега с транзакциями показывает понятную ошибку пользователю

### 1.7 `src/components/`
- [ ] `DataTable` — проверить что при пустых данных рендерится empty state
- [ ] `TagFilterPicker` — убедиться что portal закрывается при Escape

## 2. Тесты

- [ ] `tests/api-client.test.ts` — TestApiError parsing, TestNetworkError handling
- [ ] `tests/mandatory-payments.test.ts` — уже есть
- [ ] `tests/format.test.ts` — уже есть  
- [ ] `tests/palette.test.ts` — уже есть

## 3. data-testid атрибуты

Добавить `data-testid` к ключевым элементам для Playwright:
- [ ] Кнопка «+ Добавить» на каждой странице: `data-testid="add-button"`
- [ ] Форма/sheet: `data-testid="payment-form"`, `data-testid="transaction-form"`
- [ ] Строки таблицы: `data-testid="table-row-{id}"`
- [ ] Кнопка «Принять» в модерации: `data-testid="accept-row-{id}"`
- [ ] Навигационные ссылки: `data-testid="nav-{section}"`
- [ ] Поле баланса: `data-testid="balance-value"`
- [ ] Поле логина/пароля: `data-testid="login-input"`, `data-testid="password-input"`
