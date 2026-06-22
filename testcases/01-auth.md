# TC-01 · Аутентификация

**Базовый URL:** `https://finanns.space`  
**Playwright Hint:** все тесты используют `page.goto(BASE_URL + path)` и `data-testid` атрибуты.

---

## TC-01-01 · Успешный вход

**Предусловия:**
- Сервер запущен и доступен
- Существует пользователь с логином `admin` и паролем `secret`

**Шаги:**
1. Открыть `GET /login`
2. В поле `[data-testid="login-input"]` ввести `admin`
3. В поле `[data-testid="password-input"]` ввести `secret`
4. Нажать `[data-testid="login-submit"]`

**Ожидаемый результат:**
- Перенаправление на `/transactions`
- В сайдбаре отображается имя пользователя `admin`
- Кнопка выхода `[data-testid="btn-logout"]` видна

**Playwright Hint:**
```typescript
await page.fill('[data-testid="login-input"]', 'admin');
await page.fill('[data-testid="password-input"]', 'secret');
await page.click('[data-testid="login-submit"]');
await expect(page).toHaveURL(/\/transactions/);
```

---

## TC-01-02 · Неверный пароль

**Предусловия:**
- Сервер запущен

**Шаги:**
1. Открыть `/login`
2. Ввести логин `admin`, пароль `wrong`
3. Нажать кнопку входа

**Ожидаемый результат:**
- Остаётся на `/login`
- Появляется `[data-testid="login-error"]` с текстом об ошибке
- Кнопка входа снова активна

**Playwright Hint:**
```typescript
await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
```

---

## TC-01-03 · Пустые поля

**Предусловия:** нет

**Шаги:**
1. Открыть `/login`
2. Не заполнять поля
3. Кнопка войти должна быть неактивна

**Ожидаемый результат:**
- `[data-testid="login-submit"]` имеет атрибут `disabled`

**Playwright Hint:**
```typescript
await expect(page.locator('[data-testid="login-submit"]')).toBeDisabled();
```

---

## TC-01-04 · Выход из аккаунта

**Предусловия:**
- Пользователь авторизован

**Шаги:**
1. Нажать `[data-testid="btn-logout"]`

**Ожидаемый результат:**
- Перенаправление на `/login`
- Повторный переход на `/transactions` → редирект обратно на `/login`

**Playwright Hint:**
```typescript
await page.click('[data-testid="btn-logout"]');
await expect(page).toHaveURL(/\/login/);
```

---

## TC-01-05 · Защита маршрутов без авторизации

**Предусловия:**
- Пользователь не авторизован

**Шаги:**
1. Перейти напрямую на `/transactions`

**Ожидаемый результат:**
- Перенаправление на `/login`
- Параметр `from` в state содержит исходный путь

**Playwright Hint:**
```typescript
await page.goto(BASE_URL + '/transactions');
await expect(page).toHaveURL(/\/login/);
```

---

## TC-01-06 · Повторный вход после редиректа

**Предусловия:**
- Пользователь не авторизован
- Попытался открыть `/tags`

**Шаги:**
1. Перейти на `/tags` → редирект на `/login`
2. Войти с корректными данными

**Ожидаемый результат:**
- После входа — перенаправление обратно на `/tags`
