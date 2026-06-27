# finAns — Test Cases

Тест-кейсы для ручного тестирования и автоматизации через Playwright.

## Структура

| Файл | Раздел | Кол-во кейсов |
|------|--------|--------------|
| `01-auth.md` | Аутентификация и сессия | 11 |
| `02-transactions.md` | Транзакции | 12 |
| `03-balance.md` | Баланс | 8 |
| `04-tags.md` | Метки | 11 |
| `05-mandatory-payments.md` | Регулярные платежи | 13 |
| `06-import.md` | Импорт CSV | 10 |
| `07-analytics.md` | Аналитика / Календарь | 8 |
| `08-navigation.md` | Навигация и UX | 12 |
| `09-planned-expenses.md` | Хочу купить | 11 |
| `10-projects.md` | Проекты и мультипользователь | 10 |

**Итого:** 106 тест-кейсов

## Playwright Quickstart

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  baseURL: process.env.BASE_URL ?? 'https://finanns.space',
  use: {
    storageState: 'playwright/.auth/user.json', // saved auth state
  },
});
```

### Авторизация (глобальный setup)

```typescript
// tests/global-setup.ts
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Логин
  await page.goto('/login');
  await page.fill('[placeholder="Логин"]', process.env.SIMON_USERNAME ?? 'simon');
  await page.fill('[placeholder="Пароль"]', process.env.SIMON_PASSWORD!);
  await page.click('button:has-text("Войти")');

  // 2. Выбор проекта
  await page.waitForURL('**/projects');
  await page.click('text=Мои финансы');
  await page.waitForURL('**/transactions');

  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

## Полезные data-testid

| Элемент | data-testid |
|---------|-------------|
| Форма логина | `login-form` |
| Поле логина | `login-input` |
| Поле пароля | `password-input` |
| Кнопка входа | `login-submit` |
| Ошибка логина | `login-error` |
| Кнопка выхода | `btn-logout` |
| Навигация (sidebar) | `sidebar-nav` |
| Пункт навигации | `nav-{routeName}` (напр. `nav-transactions`) |
| Кнопка добавления транзакции | `btn-add-transaction` |
| Поиск транзакций | `tx-search-input` |
| Категория «Расход» | `btn-category-expense` |
| Категория «Доход» | `btn-category-income` |
| Поле названия (форма) | `tx-title-input` |
| Поле суммы (форма) | `tx-amount-input` |
| Поле даты (форма) | `tx-date-input` |
| Ошибка формы | `tx-form-error` |
| Кнопка «Сохранить» | `btn-save-transaction` |
| Кнопка «Сохранить и ещё» | `btn-save-and-more` |
| Сумма баланса | `balance-amount` |
| Кнопка редактирования баланса | `btn-edit-balance` |
| Поле ввода баланса | `balance-input` |
| Кнопка сохранения баланса | `btn-balance-save` |
| Кнопка отмены баланса | `btn-balance-cancel` |
| Кнопка добавления платежа | `btn-add-payment` |

## Соглашения

- Каждый тест независим: создаёт и удаляет свои данные
- Использовать `page.waitForResponse` для отслеживания API-запросов
- Для дат использовать `page.fill('input[type="date"]', '2026-06-22')` — формат ISO
- Таймауты debounce для поиска: `await page.waitForTimeout(400)`
