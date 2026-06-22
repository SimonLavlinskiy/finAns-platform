# Test Cases tasks: refactor-testcase

## Создать файлы в `testcases/`

- [ ] `testcases/README.md` — Playwright setup, base URL, auth, conventions
- [ ] `testcases/01-auth.md` — TC-001..TC-010: login, logout, session, wrong password
- [ ] `testcases/02-balance.md` — TC-011..TC-020: display, edit inline, validation
- [ ] `testcases/03-transactions.md` — TC-021..TC-060: CRUD, filters, pagination, file upload, duplicate
- [ ] `testcases/04-tags.md` — TC-061..TC-080: CRUD, subtags, colors, delete with transactions
- [ ] `testcases/05-import.md` — TC-081..TC-100: CSV upload, moderation, field editing, accept, batch accept, close
- [ ] `testcases/06-mandatory-payments.md` — TC-101..TC-120: CRUD, mark-paid, date highlight, duplicate
- [ ] `testcases/07-analytics.md` — TC-121..TC-130: calendar, month/day toggle, tag breakdown popup
- [ ] `testcases/08-navigation.md` — TC-131..TC-140: routing, sidebar active state, unauthorized redirect

## Требования к каждому тест-кейсу

Формат строгий — Playwright-совместимый:
```
## TC-XXX: <название>

**Preconditions**: <состояние БД / авторизация>
**URL**: <путь>
**Steps**:
1. <шаг с конкретным selector/action>
**Expected**: <что видит пользователь>
**Playwright hint**: page.click('[data-testid="..."]')
```
