---
owner: simon
reviewers: [simon]
target_release: v1.1
status: draft
created: 2026-06-22
---

# fin-plan — Раздел «План»: обязательные платежи с периодичностью

## Зачем

В finAns нет экрана для управления регулярными обязательными платежами (аренда, подписки, коммунальные услуги). Схема БД (`mandatory_payments`) существует, но API и UI не реализованы, а модель `due_day` не соответствует желаемой UX — нужен `next_payment_date` с автосдвигом по нажатию чекбокса.

## Что меняется

- Новый экран «План» в навигации приложения.
- **BREAKING**: Перепроектирование таблицы `mandatory_payments`: убираем `due_day` и `mandatory_payment_statuses`, добавляем `next_payment_date DATE` и расширяем enum `payment_recurrence` (добавляем `daily`, `weekly`, `semi_annual`).
- Полное REST API для обязательных платежей: CRUD + PATCH `/mark-paid`.
- Frontend: таблица платежей с подсветкой дат, чекбоксом оплаты, sheet-формой добавления/редактирования.

## Non-цели

- `planned_expenses` (одноразовые расходы) — вне этого change.
- Привязка платежа к транзакции при отметке оплаты — вне этого change.
- Уведомления о приближающихся платежах — v2.
- Статистика и история оплат — вне этого change.

## Capabilities

### Новые capabilities
- `mandatory-payments`: Таблица обязательных регулярных платежей с периодичностью и автосдвигом даты — создаёт `specs/mandatory-payments/spec.md`.

### Изменяемые capabilities
<!-- нет существующих capabilities с изменёнными требованиями -->

## Влияние

- `workspace/finAns-backend/`: новая миграция `000008`, domain, dto, repository, service, handler для `mandatory_payments`; расширение enum `payment_recurrence`.
- `workspace/finAns-frontend/`: `MandatoryPaymentsPage` (сейчас заглушка), новые API-функции, типы, компоненты таблицы и sheet-формы.
- Нет влияния на `transactions`, `tags`, `balance`, `analytics`, `import`.
