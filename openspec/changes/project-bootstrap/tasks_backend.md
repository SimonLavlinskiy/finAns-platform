## 1. Инициализация Go-модуля и структура

<!-- spec: bootstrap-backend -->

- [x] 1.1 Инициализировать `go.mod` (`github.com/SimonLavlinskiy/finAns-backend`, go 1.22); `workspace/finAns-backend/`
- [x] 1.2 Создать каталоги: `cmd/app/`, `internal/{config,domain,dto,handler,service,repository,middleware}/`, `db/{migrations,queries,schema}/`, `pkg/httputil/`
- [x] 1.3 Добавить `.gitignore`, `.env.example`, `README.md`, `AGENTS.md`, `.platform-link`

## 2. Docker Compose и Makefile

<!-- spec: bootstrap-backend -->

- [x] 2.1 `docker-compose.yml`: PostgreSQL 16-alpine + api service (build from Dockerfile); `workspace/finAns-backend/`
- [x] 2.2 `Dockerfile` multi-stage: build → distroless/scratch runtime
- [x] 2.3 `.env.example`: `DATABASE_URL`, `HTTP_PORT`, `LOG_LEVEL`, `CORS_ORIGINS`
- [x] 2.4 Makefile targets: `up`, `down`, `run`, `migrate`, `migrate-down`, `sqlc`, `mocks`, `test`, `test-cover`, `lint`, `swagger`

## 3. Конфигурация и логирование

<!-- spec: bootstrap-backend -->

- [x] 3.1 `internal/config/`: загрузка через viper (.env + env vars); валидация обязательных полей
- [x] 3.2 Настроить `slog` JSON/text по `LOG_LEVEL`; middleware request logging в chi

## 4. База данных — миграции схемы ТЗ

<!-- spec: bootstrap-backend -->

- [x] 4.1 Миграция `000001_init_schema.up.sql`: tags, transactions, spending_limits, mandatory_payments, mandatory_payment_statuses, planned_expenses, user_balance
- [x] 4.2 Down-миграция `000001_init_schema.down.sql`
- [x] 4.3 Интеграция golang-migrate в `cmd/migrate/main.go` или Makefile

## 5. sqlc

<!-- spec: bootstrap-backend -->

- [x] 5.1 `sqlc.yaml` + schema из миграций; `db/queries/health.sql` (ping DB)
- [x] 5.2 Сгенерировать код: `internal/repository/sqlc/`; добавить `make sqlc`

## 6. HTTP API bootstrap

<!-- spec: bootstrap-backend -->

- [x] 6.1 Chi router: middleware RequestID, RealIP, Logger, Recoverer, Timeout, CORS
- [x] 6.2 `GET /api/v1/health` → `{ "status": "ok", "db": "up|down" }`; `internal/handler/health.go`
- [x] 6.3 JSON error handler: единый формат `{ "error": { "code", "message" } }`
- [x] 6.4 `cmd/app/main.go`: wiring config → db pool (pgx) → router → server graceful shutdown

## 7. Качество кода

<!-- spec: bootstrap-backend -->

- [x] 7.1 `.golangci.yml` (govet, errcheck, staticcheck, gofmt, revive — разумный набор)
- [x] 7.2 `mockery` config + пример интерфейса `HealthChecker` в domain; `make mocks`
- [x] 7.3 Unit-тест health handler; integration test DB ping через testcontainers-go
- [x] 7.4 Swagger/swaggo: аннотации на health; `make swagger` → `docs/swagger.json`

## 8. CI и публикация

<!-- spec: bootstrap-backend -->

- [x] 8.1 `.github/workflows/ci.yml`: golangci-lint → go test -cover → go build
- [x] 8.2 Первый коммит + push в `git@github.com:SimonLavlinskiy/finAns-backend.git` branch `main`
- [x] 8.3 Заготовка `uploads/.gitkeep` и config `UPLOAD_DIR` (без реализации upload API)
