### Requirement: Стек и сборка frontend

Репозиторий **finAns-frontend** (`workspace/finAns-frontend/`) SHALL использовать React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.

#### Scenario: Dev-сервер
- **WHEN** разработчик выполняет `npm run dev` в корне finAns-frontend
- **THEN** приложение доступно локально с hot reload

#### Scenario: Production build
- **WHEN** выполняется `npm run build`
- **THEN** статические артефакты собираются без ошибок TypeScript

### Requirement: Навигация и layout

Приложение SHALL использовать React Router v6 с общим layout: хедер (баланс), боковое или верхнее меню разделов.

#### Scenario: Маршруты MVP
- **WHEN** пользователь открывает приложение
- **THEN** доступны маршруты: транзакции, теги, обязательные платежи, планируемые расходы; аналитика — v2

### Requirement: Таблицы и формы

Сложные таблицы SHALL строиться на TanStack Table v8; запросы к API — TanStack Query; формы — React Hook Form + Zod.

#### Scenario: Синхронизация фильтров с URL
- **WHEN** пользователь меняет фильтры таблицы транзакций
- **THEN** query-параметры URL обновляются и восстанавливают состояние при навигации назад

### Requirement: UI-компоненты

Интерфейс SHALL использовать shadcn/ui для форм, диалогов, селектов, таблиц; графики v2 — Recharts.

#### Scenario: Боковая панель добавления транзакции
- **WHEN** пользователь нажимает «+ Добавить»
- **THEN** открывается Sheet или Dialog с формой транзакции на компонентах shadcn/ui

### Requirement: Адаптивность

Десктоп — основной таргет; SHALL обеспечивать базовую читаемость таблиц на мобильных экранах.

#### Scenario: Таблица на узком экране
- **WHEN** viewport <768px
- **THEN** таблица остаётся читаемой (горизонтальный скролл, упрощённые колонки или card-view)

### Requirement: CI pipeline frontend

CI SHALL выполнять: lint → typecheck → test (если есть) → build.

#### Scenario: Проверка типов в CI
- **WHEN** создаётся MR с ошибками TypeScript
- **THEN** pipeline build/typecheck завершается с ошибкой
