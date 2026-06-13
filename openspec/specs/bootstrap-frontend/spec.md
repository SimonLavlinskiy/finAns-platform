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

### Requirement: Выбор стека — React + TypeScript

Frontend SHALL использовать React 18 + TypeScript + Vite (не альтернативы вроде Refine/Ant Design Pro на bootstrap): проект требует кастомных таблиц, древовидных тегов и графиков v2 — экосистема React даёт лучший баланс гибкости и скорости разработки.

#### Scenario: TypeScript strict mode
- **WHEN** разработчик проверяет `tsconfig.json`
- **THEN** включён `"strict": true` и `npm run build` проходит без ошибок типов

### Requirement: shadcn/ui инициализация

UI SHALL инициализироваться через shadcn/ui CLI с базовыми компонентами: Button, Input, Table, Dialog, Sheet, Select, Badge, Card, DropdownMenu.

#### Scenario: Компоненты в src/components/ui
- **WHEN** разработчик просматривает `src/components/ui/`
- **THEN** присутствуют перечисленные базовые компоненты shadcn

### Requirement: API client слой

HTTP-клиент SHALL использовать fetch + TanStack Query с базовым `apiClient` (base URL из `VITE_API_URL`, JSON headers, обработка ошибок).

#### Scenario: Health-check с фронта
- **WHEN** dev-сервер запущен и backend доступен
- **THEN** страница или dev-панель может получить `GET /api/v1/health` через apiClient

### Requirement: Layout scaffold MVP

Приложение SHALL иметь AppLayout: Header (placeholder баланса), Sidebar с навигацией (Транзакции, Теги, Платежи, Планируемые — disabled/placeholder), `<Outlet />` для страниц.

#### Scenario: Навигация между placeholder-страницами
- **WHEN** пользователь кликает пункт меню
- **THEN** React Router переключает маршрут без полной перезагрузки

### Requirement: ESLint + Prettier

Frontend SHALL включать ESLint (typescript-eslint) и Prettier с единым форматированием.

#### Scenario: Lint в CI
- **WHEN** CI запускает `npm run lint`
- **THEN** pipeline падает при нарушениях lint-правил

### Requirement: Env и platform-link

Репозиторий SHALL содержать `.env.example`, `.platform-link` → finAns-platform, `AGENTS.md` по шаблону platform.

#### Scenario: Onboarding нового разработчика
- **WHEN** разработчик клонирует finAns-frontend и копирует `.env.example` → `.env`
- **THEN** `npm run dev` стартует с корректным API URL
