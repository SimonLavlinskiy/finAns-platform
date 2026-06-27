## Context

Приложение finAns работает в режиме «одиночный набор данных» — нет понятия пользователя или проекта. Вводится двухуровневая модель: пользователь (`users`) и проект (`projects`), все существующие сущности получают `project_id`. Это breaking change, затрагивающий каждый эндпоинт и каждую таблицу.

## Goals / Non-Goals

**Goals:**
- Ввести таблицы `users`, `projects`, `project_members`
- Добавить `project_id` во все таблицы данных (транзакции, теги, лимиты, обязательные платежи, плановые расходы, баланс)
- Middleware извлечения активного проекта из заголовка `X-Project-ID` с проверкой членства
- Административная форма создания пользователей в UI (не seed-скрипт)
- Вход без пароля: выбор из списка / ввод `@username`; `activeUserId` в `localStorage`
- Переключатель проекта в хедере; `activeProjectId` в `localStorage`, передаётся через `X-Project-ID`
- Экран создания проекта при первом входе; настройки проекта с управлением участниками
- Data-migration: создать дефолтного пользователя `@simon` + дефолтный проект; два существующих пользователя добавляются как участники; все записи привязываются к дефолтному проекту

**Non-Goals:**
- Полноценная аутентификация (пароль, JWT, OAuth)
- Подтверждение приглашения приглашённым
- Тонкие роли (только `owner` / `member`)
- Audit log, передача владения

## Decisions

1. **Контекст проекта через заголовок `X-Project-ID`, не path-сегмент.**
   `/api/v1/projects/{id}/transactions` усложняет роутинг и ломает все существующие фронтовые вызовы. Заголовок `X-Project-ID` — неразрушающее добавление: middleware парсит его, проверяет членство пользователя, прокидывает `projectID` в контекст Go. Все существующие пути остаются неизменными.

2. **`activeUserId` и `activeProjectId` — в `localStorage` фронтенда.**
   Полноценной сессии нет. `localStorage` — прагматичное решение для v1. При появлении JWT в v2 — токен вытеснит `localStorage` без изменения серверного API.

3. **Создание пользователей — административная форма в UI, не CLI/seed.**
   Seed неудобен при необходимости добавить пользователя после деплоя. Форма в UI (отдельная страница `/admin/users`) позволяет создавать пользователей без доступа к серверу. На этом этапе страница не защищена паролем (нет auth).

4. **Пользователь `X-User-ID` тоже передаётся в заголовке.**
   Вместо хранения пользователя в сессии (которой нет), фронтенд передаёт `X-User-ID` из `localStorage`. Middleware записывает его в контекст запроса. В v2 этот заголовок заменяется JWT.

5. **Data-migration: один SQL-файл с транзакцией.**
   Миграция `000010` в одной транзакции: создаёт таблицы → вставляет пользователей `@simon` и второго существующего пользователя → создаёт дефолтный проект → добавляет оба `project_members` → `UPDATE ... SET project_id = <default>` для всех существующих таблиц. Откат — `down.sql` дропает колонки и таблицы.

6. **`user_balance` становится per-project: переименовывается в контексте проекта.**
   Текущая таблица `user_balance` имеет единственную строку. После добавления `project_id` таблица хранит баланс для каждого проекта отдельно. `initial_amount` переносится в `projects.initial_balance_kopecks`.

7. **Участник добавляется мгновенно, без подтверждения.**
   Подтверждение требует уведомлений, которых нет. Для приватного инструмента с ручным созданием пользователей это допустимо в v1.

## Risks / Trade-offs

- **Breaking change каждого эндпоинта**: все фронтовые запросы должны начать передавать `X-Project-ID` одновременно — нет пути постепенной миграции. Приложение будет в нерабочем состоянии между деплоем backend и frontend.
- **`localStorage` — не безопасное хранилище для auth**: злоумышленник с доступом к браузеру может подменить `X-User-ID`. Приемлемо для персонального инструмента в v1; устраняется в v2 при добавлении JWT.
- **Один `owner` не может покинуть проект**: проект становится «осиротевшим» если owner хочет уйти. Решение: запрещаем выход последнего owner (ошибка `CANNOT_LEAVE_SOLE_OWNER`); удаление осиротевшего проекта — вне scope v1.

## Migration Plan

1. `workspace/finAns-backend/db/migrations/000010_add_users_and_projects.up.sql`:
   - Создать `users(id BIGSERIAL PK, username VARCHAR(20) UNIQUE NOT NULL, display_name VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ)`
   - Создать `projects(id BIGSERIAL PK, name VARCHAR(200) NOT NULL, initial_balance_kopecks BIGINT NOT NULL DEFAULT 0, started_at DATE, created_at TIMESTAMPTZ)`
   - Создать `project_members(project_id BIGINT REFERENCES projects, user_id BIGINT REFERENCES users, role VARCHAR(10) NOT NULL DEFAULT 'member', PRIMARY KEY(project_id, user_id))`
   - `ALTER TABLE` для всех таблиц данных: добавить `project_id BIGINT REFERENCES projects(id)` (сначала nullable)
   - Вставить пользователей: `@simon` (`display_name='Simon'`) и второй существующий
   - Вставить дефолтный проект `«Мои финансы»`
   - Вставить `project_members` для обоих пользователей (один — `owner`)
   - `UPDATE ... SET project_id = <default_project_id>` для всех таблиц
   - `ALTER TABLE ... ALTER COLUMN project_id SET NOT NULL` для всех таблиц
2. `000010_add_users_and_projects.down.sql`: дроп `project_id` из всех таблиц, дроп `project_members`, `projects`, `users`
3. Деплой: сначала backend с новой миграцией, затем frontend; краткое окно недоступности

## Open Questions

- Какой второй пользователь добавляется в дефолтный проект — нужно указать `username` при data-migration
- `username` второго пользователя для дефолтного проекта: нужно уточнить при реализации
