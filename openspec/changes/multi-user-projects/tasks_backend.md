## 1. Миграция БД

<!-- spec: projects -->

- [x] 1.1 Создать `workspace/finAns-backend/db/migrations/000010_add_users_and_projects.up.sql`: таблицы `users(id BIGSERIAL PK, username VARCHAR(20) UNIQUE NOT NULL, display_name VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`, `projects(id BIGSERIAL PK, name VARCHAR(200) NOT NULL, initial_balance_kopecks BIGINT NOT NULL DEFAULT 0, started_at DATE, created_at TIMESTAMPTZ DEFAULT NOW())`, `project_members(project_id BIGINT REFERENCES projects, user_id BIGINT REFERENCES users, role VARCHAR(10) NOT NULL DEFAULT 'member', PRIMARY KEY(project_id, user_id))`
- [x] 1.2 В той же миграции добавить `project_id BIGINT REFERENCES projects(id)` (nullable) во все существующие таблицы: `tags`, `transactions`, `spending_limits`, `mandatory_payments`, `mandatory_payment_statuses`, `planned_expense_categories`, `planned_expenses`, `user_balance`
- [x] 1.3 В той же миграции: вставить пользователя `@simon` + второго пользователя, вставить проект `«Мои финансы»`, добавить обоих в `project_members` (`@simon` как `owner`), выполнить `UPDATE ... SET project_id = <id>` для всех таблиц, затем `ALTER COLUMN project_id SET NOT NULL`
- [x] 1.4 Создать `000010_add_users_and_projects.down.sql`: `ALTER TABLE ... DROP COLUMN project_id`, дроп `project_members`, `projects`, `users`
- [ ] 1.5 Прогнать `migrate up`/`migrate down`/`migrate up` локально, убедиться что данные не теряются

## 2. Domain и DTO

<!-- spec: user-accounts -->

- [x] 2.1 Добавить `workspace/finAns-backend/internal/domain/user.go`: структура `User{ID, Username, DisplayName, CreatedAt}`
- [x] 2.2 Добавить `workspace/finAns-backend/internal/domain/project.go`: структура `Project{ID, Name, InitialBalanceKopecks, StartedAt *time.Time, CreatedAt}`, `ProjectMember{ProjectID, UserID, Role}`, константы `RoleOwner`, `RoleMember`
- [x] 2.3 Добавить `workspace/finAns-backend/internal/dto/user.go`: `CreateUserRequest{Username, DisplayName}`, `UserResponse{ID, Username, DisplayName}`
- [x] 2.4 Добавить `workspace/finAns-backend/internal/dto/project.go`: `CreateProjectRequest{Name, InitialBalanceKopecks *int64, StartedAt *string}`, `ProjectResponse{ID, Name, InitialBalanceKopecks, StartedAt, CreatedAt}`, `ProjectMemberResponse{UserID, Username, DisplayName, Role}`, `AddMemberRequest{Username}`, `ProjectWithMembersResponse{ProjectResponse, Members []ProjectMemberResponse}`

## 3. Repository

<!-- spec: user-accounts -->

- [x] 3.1 Создать `workspace/finAns-backend/internal/repository/user_repo.go`: `Create(ctx, username, displayName)`, `GetByUsername(ctx, username)`, `List(ctx)`, `Exists(ctx, username) bool`
- [x] 3.2 Создать `workspace/finAns-backend/internal/repository/project_repo.go`: `Create(ctx, name, initialBalance, startedAt)`, `Get(ctx, id)`, `ListByUser(ctx, userID)`, `AddMember(ctx, projectID, userID, role)`, `RemoveMember(ctx, projectID, userID)`, `GetMember(ctx, projectID, userID)`, `ListMembers(ctx, projectID)`
- [ ] 3.3 Покрыть оба репозитория integration-тестами с testcontainers-go по образцу `internal/repository/planned_expense_repo_integration_test.go`

## 4. Middleware

<!-- spec: projects -->

- [x] 4.1 Создать `workspace/finAns-backend/internal/middleware/auth.go`: middleware `UserContextMiddleware` — читает заголовок `X-User-ID`, загружает пользователя из репозитория, прокидывает в `context.Context`; если заголовок отсутствует или пользователь не найден → `401 UNAUTHORIZED`
- [x] 4.2 Создать `workspace/finAns-backend/internal/middleware/project.go`: middleware `ProjectContextMiddleware` — читает `X-Project-ID`, проверяет членство текущего пользователя через `project_repo.GetMember`; если заголовок отсутствует → `400 PROJECT_ID_REQUIRED`; если не член → `403 FORBIDDEN`; прокидывает `projectID` в контекст
- [x] 4.3 Добавить хелперы `middleware.UserFromContext(ctx)` и `middleware.ProjectIDFromContext(ctx)` для использования в хендлерах и сервисах

## 5. Service

<!-- spec: user-accounts -->

- [x] 5.1 Создать `workspace/finAns-backend/internal/service/user_service.go`: `Create(ctx, req)` (валидация username: `^[a-zA-Z0-9_]{3,20}$`, уникальность → ошибка `USERNAME_TAKEN`), `List(ctx)`, `GetByUsername(ctx, username)`
- [x] 5.2 Создать `workspace/finAns-backend/internal/service/project_service.go`: `Create(ctx, userID, req)` (создаёт проект + запись `owner` в `project_members`), `ListForUser(ctx, userID)`, `Get(ctx, id)`, `AddMember(ctx, projectID, callerUserID, username)` (проверяет роль `owner` у caller, ищет юзера по username → `USER_NOT_FOUND`, проверяет не-дубль → `ALREADY_MEMBER`), `RemoveMember(ctx, projectID, callerUserID, targetUserID)` (owner check; если target — последний owner → `CANNOT_LEAVE_SOLE_OWNER`)
- [ ] 5.3 Написать unit-тесты на `user_service`: валидный username создаётся, дубль → ошибка, невалидный username → ошибка
- [ ] 5.4 Написать unit-тесты на `project_service`: создание проекта добавляет owner, приглашение несуществующего → USER_NOT_FOUND, повторное приглашение → ALREADY_MEMBER, единственный owner не может выйти

## 6. Обновление существующих репозиториев и сервисов

<!-- spec: projects -->

- [x] 6.1 Обновить все методы `transaction_repo.go` — добавить `projectID` в фильтр WHERE и INSERT
- [x] 6.2 Обновить `tag_repo.go` — добавить `projectID` в фильтр
- [x] 6.3 Обновить `spending_limit_repo.go` — добавить `projectID` в фильтр
- [x] 6.4 Обновить `mandatory_payment_repo.go` — добавить `projectID` в фильтр
- [x] 6.5 Обновить `planned_expense_repo.go` и `planned_expense_category_repo.go` — добавить `projectID` в фильтр
- [x] 6.6 Обновить `balance_repo.go` (или `user_balance`) — `project_id` как ключ; метод `GetByProject(ctx, projectID)`
- [x] 6.7 Обновить сервисный слой всех существующих фич (transactions, tags, limits, mandatory-payments, planned-expenses, balance): добавить параметр `projectID` и передавать в репозитории

## 7. Handler и роутинг

<!-- spec: user-accounts -->

- [x] 7.1 Создать `workspace/finAns-backend/internal/handler/user_handler.go`: `List (GET /api/v1/users)`, `Create (POST /api/v1/users)` — публичные эндпоинты (без auth middleware)
- [x] 7.2 Создать `workspace/finAns-backend/internal/handler/project_handler.go`: `Create (POST /api/v1/projects)`, `List (GET /api/v1/projects)` — с UserContext; `Get (GET /api/v1/projects/{id})`, `AddMember (POST /api/v1/projects/{id}/members)`, `RemoveMember (DELETE /api/v1/projects/{id}/members/{userID})`, `ListMembers (GET /api/v1/projects/{id}/members)` — с UserContext + ProjectContext
- [x] 7.3 Обновить `workspace/finAns-backend/internal/handler/router.go`: применить `UserContextMiddleware` ко всем защищённым роутам; применить `ProjectContextMiddleware` ко всем роутам работы с данными; обновить сигнатуры хендлеров для извлечения `projectID` из контекста
- [ ] 7.4 Написать handler-тесты для `user_handler` и `project_handler` по образцу `planned_expense_handler_test.go`

## 8. Swagger

<!-- spec: projects -->

- [ ] 8.1 Добавить swaggo-аннотации к `user_handler` и `project_handler`, обновить аннотации существующих хендлеров (добавить `X-Project-ID` и `X-User-ID` в заголовки), перегенерировать `docs/` (`swag init`)
