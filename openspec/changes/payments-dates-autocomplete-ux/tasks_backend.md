## 1. MandatoryPayments — период-скоуп статуса «Оплачено»

<!-- spec: mandatory-payments -->

- [x] 1.1 Добавить поле `IsPaidCurrentPeriod bool` в `workspace/finAns-backend/internal/dto/mandatory_payment.go` (`MandatoryPaymentResponse`)
- [x] 1.2 В `workspace/finAns-backend/internal/service/mandatory_payment_service.go` (`toResponse`) вычислить `IsPaidCurrentPeriod = p.LastPaidAt != nil && time.Now().Before(p.NextPaymentDate)`
- [x] 1.3 Обновить/добавить unit-тест в `workspace/finAns-backend/internal/service/mandatory_payment_service_test.go`: платёж с `last_paid_at` установлен, но `next_payment_date` уже в прошлом → `IsPaidCurrentPeriod == false`
- [x] 1.4 Обновить unit-тест: платёж с `last_paid_at` установлен, `next_payment_date` в будущем → `IsPaidCurrentPeriod == true`
- [x] 1.5 `UnmarkPaid` обновлён: гвард сменён с `last_paid_at == nil` на `!isPaidCurrentPeriod(...)` — без этого API продолжал бы разрешать отмену устаревшего периода даже после того, как фронтенд скрывает кнопку; добавлены unit-тесты на саму функцию `isPaidCurrentPeriod`, используемую и в `toResponse`, и в `UnmarkPaid`

## 2. Transactions — автодополнение наименования: word-boundary поиск

<!-- spec: transactions -->

- [x] 2.1 В `workspace/finAns-backend/internal/repository/transaction_repo.go` переписан `Suggestions`: вместо `title ILIKE '%q%'` — `EXISTS (SELECT 1 FROM unnest(regexp_split_to_array(title, '\s+')) word WHERE word ILIKE $2 ESCAPE '\')` (первая попытка через regex `~*` с POSIX-классом `[:alnum:]` оказалась ASCII-only и молча ломала матчинг кириллицы — обнаружено юнит-тестом, заменено на word-split + ILIKE-префикс через `likePrefixPattern`, экранирующий `\ % _`)
- [x] 2.2 Сигнатура `Suggestions` изменена на возврат `[]domain.TransactionSuggestion` (`Title, Amount, TagID, Category, Specificity, Count, LastUsed`) вместо `[]string`
- [x] 2.3 В `workspace/finAns-backend/internal/service/transaction_service.go` добавлена функция `pickBestPerTitle`: группирует по `Title`, выбирает комбинацию с максимальным `Count` (при равенстве — с более поздним `LastUsed`), сортирует итоговый список по алфавиту
- [x] 2.4 Добавлен `dto.TransactionSuggestionResponse{Title, Amount, TagID, Category, Specificity}` в `workspace/finAns-backend/internal/dto/api.go`; `internal/handler/transaction_handler.go` (`Suggestions`) не требовал изменений — уже прозрачно пробрасывает результат сервиса
- [x] 2.5 Пустой `q` (после `strings.TrimSpace`) возвращает пустой список без обращения к БД (проверка в сервисе)
- [x] 2.6 Добавлены unit-тесты: `transaction_repo_test.go` (`likePrefixPattern` — экранирование `\ % _`), `transaction_service_test.go` (`pickBestPerTitle` — дедупликация, выбор самой частой комбинации, tie-break по дате, алфавитная сортировка). Поиск по подстроке в начале слова через реальный Postgres (word-split + ILIKE) не покрыт юнит-тестом — требует интеграционного теста с БД; существующая интеграционная сборка (`-tags integration`) уже не компилируется независимо от этого изменения (устаревшие сигнатуры без `projectID`) — вне scope данного change
