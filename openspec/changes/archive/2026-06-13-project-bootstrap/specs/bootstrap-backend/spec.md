## ADDED Requirements

### Requirement: Go module и версия

Репозиторий finAns-backend SHALL использовать Go ≥1.22, module path `github.com/SimonLavlinskiy/finAns-backend`.

#### Scenario: Версия Go зафиксирована
- **WHEN** разработчик проверяет `go.mod` и CI
- **THEN** указана директива `go 1.22` (или новее) и единый module path

### Requirement: HTTP router chi

REST API SHALL использовать `go-chi/chi/v5` с middleware: RequestID, RealIP, Logger, Recoverer, Timeout.

#### Scenario: Маршрутизация версионирована
- **WHEN** сервер регистрирует маршруты
- **THEN** все API endpoints имеют префикс `/api/v1/`

### Requirement: sqlc code generation

Доступ к PostgreSQL SHALL выполняться через sqlc: SQL в `db/queries/`, схема в `db/schema/`, сгенерированный код в `internal/repository/sqlc/`.

#### Scenario: Генерация sqlc
- **WHEN** разработчик выполняет `make sqlc`
- **THEN** код регенерируется без ручного редактирования generated-файлов

### Requirement: Docker Compose dev-окружение

Dev-окружение SHALL поднимать PostgreSQL 16 и API одной командой `make up`.

#### Scenario: Postgres healthy
- **WHEN** выполняется `make up`
- **THEN** PostgreSQL доступен на порту из `.env`, health-check API отвечает 200

### Requirement: Стандартизированные ошибки API

Ошибки SHALL возвращаться в JSON: `{ "error": { "code", "message", "details?" } }` с корректным HTTP status.

#### Scenario: 404 на неизвестный маршрут
- **WHEN** клиент запрашивает несуществующий `/api/v1/...`
- **THEN** ответ 404 с JSON error body

### Requirement: Makefile targets

Makefile SHALL содержать: `up`, `down`, `migrate`, `migrate-down`, `sqlc`, `test`, `test-cover`, `lint`, `run`, `swagger`.

#### Scenario: Полный dev-цикл
- **WHEN** разработчик выполняет `make up && make migrate && make run`
- **THEN** API стартует с применённой схемой БД

### Requirement: mockery и testify

Сервисный слой SHALL тестироваться с `testify` и моками, генерируемыми `mockery` из интерфейсов в `internal/domain/`.

#### Scenario: Генерация моков
- **WHEN** выполняется `make mocks`
- **THEN** моки обновляются в `internal/mocks/` (или `mocks/`)

### Requirement: GitHub Actions backend

CI SHALL: golangci-lint → test с coverage report → build binary.

#### Scenario: Coverage gate advisory
- **WHEN** CI завершает test job
- **THEN** отчёт покрытия публикуется; порог 70% — advisory на bootstrap, required после первых сервисов
