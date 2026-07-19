## 1. MarkPaid — фактическая дата и редактируемая сумма

<!-- spec: mandatory-payments -->

- [x] 1.1 Добавлен `dto.MarkPaidRequest{Amount *int64}` в `workspace/finAns-backend/internal/dto/mandatory_payment.go`
- [x] 1.2 `MandatoryPaymentService.MarkPaid(ctx, id, projectID int64, req dto.MarkPaidRequest)`: `Date: time.Now()` вместо `Date: p.NextPaymentDate`; сумма выбирается через новую `resolveMarkPaidAmount(p.Amount, req)` (`req.Amount` если передан и `>0`, иначе `p.Amount`); `advanceDate(p.NextPaymentDate, p.Recurrence)` не изменён — по-прежнему считается от `p.NextPaymentDate`
- [x] 1.3 `MandatoryPaymentHandler.MarkPaid` читает `dto.MarkPaidRequest` через `decodeJSON`; пустое тело (`io.EOF`) трактуется как «сумма не передана», не ошибка — только реальные JSON-ошибки возвращают 400
- [x] 1.4 Добавлены unit-тесты для `resolveMarkPaidAmount` (без override, положительный override, нулевой/отрицательный override игнорируется — покрывает правило «сумма из транзакции, если платёж не найден»). Дата транзакции = `time.Now()` и независимость `advanceDate` от даты подтверждения — не отдельно юнит-тестируемы без БД (тот же паттерн, что и остальной код в этом файле — `s.repo`/`s.txRepo` конкретные структуры, не интерфейсы), проверено вживую в разделе 2 (frontend live-check) и существующим интеграционным тестом `mandatory_payment_markpaid_integration_test.go` (уже был сломан до этого change из-за устаревшей сигнатуры без `projectID` — вне scope, не трогаем)
