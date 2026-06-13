## ADDED Requirements

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
