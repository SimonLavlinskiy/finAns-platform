# Backend tasks: refactor-testcase

## 1. Аудит и фиксы — проводить в ходе apply

При выполнении `/opsx:apply` пройти каждый файл и исправить:

### 1.1 `pkg/httputil/`
- [ ] Проверить что все `Write*` функции корректно сериализуют JSON и не игнорируют ошибки encoder

### 1.2 `pkg/colorutil/`
- [ ] Проверить edge-cases в `Lighten` (пустая строка, некорректный hex)

### 1.3 `internal/repository/`
- [ ] Убедиться что `rows.Close()` всегда вызывается через `defer` сразу после проверки ошибки от `Query`
- [ ] Убедиться что `rows.Err()` проверяется в конце каждого цикла
- [ ] Проверить что нет голых `_ = tx.Rollback(ctx)` без defer-обёртки в транзакциях
- [ ] Найти и устранить дублирование scan-хелперов

### 1.4 `internal/service/`
- [ ] Убедиться что все сервисы возвращают типизированные ошибки (не `fmt.Errorf`)
- [ ] Проверить что `ValidateTagExists` не делает лишних запросов при batch-операциях
- [ ] Убедиться что `MarkPaid` в mandatory_payment_service атомарен (select + update в одной транзакции)

### 1.5 `internal/handler/`
- [ ] Выделить `parseID(r *http.Request) (int64, bool)` хелпер (дублируется в 5 хендлерах)
- [ ] Убедиться что все хендлеры возвращают правильные HTTP-статусы:
  - POST создание → 201
  - DELETE → 204
  - Валидация → 422
  - Not Found → 404
- [ ] Проверить что `decodeJSON` использует `DisallowUnknownFields` там где нужно

### 1.6 `internal/middleware/`
- [ ] Проверить что `RequireAuth` корректно обрабатывает истёкшие сессии

## 2. Тесты

### 2.1 Новые unit-тесты
- [ ] `pkg/httputil/` — TestWriteData, TestWriteError (корректные JSON, статусы)
- [ ] `internal/service/tag_service_test.go` — TestCountUsageSubtree, TestTagsWithParentBatch
- [ ] `internal/service/import_service_test.go` — уже есть, проверить полноту
- [ ] `internal/handler/transaction_handler_test.go` — TestCreate_OK, TestCreate_MissingTag
- [ ] `internal/handler/tag_handler_test.go` — TestCreate_OK, TestDelete_WithTransactions

### 2.2 Покрытие
- [ ] После всех фиксов запустить `go test ./... -cover` и убедиться что покрытие > 40%
