### Requirement: Стек и структура backend

Репозиторий **finAns-backend** (`workspace/finAns-backend/`) SHALL использовать Go, PostgreSQL, Clean Architecture (handler → service → repository), REST JSON API.

#### Scenario: Структура пакетов
- **WHEN** разработчик просматривает корень finAns-backend
- **THEN** присутствуют каталоги `cmd/app/`, `internal/{handler,service,repository,domain,dto,middleware,config}/`, `migrations/`, `pkg/`

#### Scenario: Точка входа приложения
- **WHEN** выполняется `go run ./cmd/app` с валидным `.env`
- **THEN** HTTP-сервер стартует и отвечает на health-check

### Requirement: База данных и миграции

Схема БД SHALL управляться через `golang-migrate`; начальные миграции создают таблицы из модели данных ТЗ.

#### Scenario: Применение миграций
- **WHEN** разработчик запускает команду миграции (Makefile или CLI)
- **THEN** в PostgreSQL создаются таблицы tags, transactions, spending_limits, mandatory_payments, mandatory_payment_statuses, planned_expenses, user_balance

### Requirement: Доступ к данным

Слой repository SHALL использовать `sqlc` или `pgx` без тяжёлых ORM.

#### Scenario: Типобезопасные запросы
- **WHEN** сервис запрашивает список транзакций с фильтрами
- **THEN** запрос выполняется через сгенерированный sqlc-код или pgx с параметризованными запросами

### Requirement: Конфигурация и логирование

Конфигурация SHALL загружаться из `.env` через `viper`; логирование — `zap` или `slog`.

#### Scenario: Обязательные переменные окружения
- **WHEN** отсутствует `DATABASE_URL` при старте
- **THEN** приложение завершается с понятной ошибкой в логе

### Requirement: Качество кода и тесты

Backend SHALL включать `golangci-lint`, unit-тесты сервисного слоя (`testify`, моки `mockery`), интеграционные тесты с `testcontainers-go`.

#### Scenario: Покрытие сервисного слоя
- **WHEN** CI запускает тесты с отчётом покрытия
- **THEN** покрытие сервисного слоя ≥70%

#### Scenario: Swagger-документация
- **WHEN** сервер запущен в dev
- **THEN** Swagger UI доступен по документированному пути

### Requirement: CI pipeline backend

GitHub Actions (или GitLab CI) SHALL выполнять: golangci-lint → test → build.

#### Scenario: Блокировка при падении lint
- **WHEN** golangci-lint находит ошибки в MR
- **THEN** pipeline помечается failed

### Requirement: Хранение файлов

API SHALL сохранять вложения транзакций в `uploads/` или S3-совместимое хранилище; путь и метаданные — в БД.

#### Scenario: Загрузка и выдача файла
- **WHEN** клиент загружает файл через API транзакции
- **THEN** файл сохраняется в хранилище, метаданные записываются в транзакцию; GET возвращает файл или signed URL
