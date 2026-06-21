## ADDED Requirements

### Requirement: Блок баланса в хедере

Хедер SHALL постоянно отображать `Баланс: {сумма} ₽` с кнопкой `✏ Изменить`; цвет суммы — зелёный при `> 0`, красный при `< 0`.

#### Scenario: Формула баланса
- **WHEN** `initial_amount=15000000`, доходы `15000000`, расходы `234500`
- **THEN** в хедере отображается `Баланс: 29 765,50 ₽` (или эквивалент в копейках с форматированием)

#### Scenario: Мгновенный пересчёт после удаления
- **WHEN** пользователь удаляет транзакцию из таблицы
- **THEN** баланс в хедере обновляется без перезагрузки страницы

### Requirement: Редактирование стартовой суммы

Кнопка `✏ Изменить` SHALL открывать попап/инлайн-форму с полем «Начальная сумма (стартовый капитал)» и кнопками Сохранить/Отмена.

#### Scenario: Upsert user_balance
- **WHEN** пользователь сохраняет начальную сумму
- **THEN** выполняется upsert в `user_balance.initial_amount`, баланс пересчитывается мгновенно

#### Scenario: Опциональная дата начала учёта
- **WHEN** задана дата начала учёта
- **THEN** в расчёт баланса попадают только транзакции с `date >= accounting_start_date`

### Requirement: REST API баланса

Backend SHALL предоставлять `GET /api/v1/balance` → `{ initial_amount, total_income, total_expense, current_balance }` и `PUT /api/v1/balance` → `{ initial_amount }`.

#### Scenario: GET balance
- **WHEN** клиент запрашивает `GET /api/v1/balance`
- **THEN** ответ `200` с корректными агрегатами в копейках

#### Scenario: PUT initial_amount
- **WHEN** клиент отправляет `PUT /api/v1/balance` с `{ "initial_amount": 15000000 }`
- **THEN** ответ `200`, `current_balance` пересчитан
