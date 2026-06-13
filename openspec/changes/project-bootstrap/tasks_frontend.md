## 1. Инициализация Vite + React + TypeScript

<!-- spec: bootstrap-frontend -->

- [x] 1.1 `npm create vite@latest . -- --template react-ts` в `workspace/finAns-frontend/` (или scaffold вручную)
- [x] 1.2 Настроить Tailwind CSS v4/v3 + path aliases (`@/` → `src/`)
- [x] 1.3 Добавить `.gitignore`, `.env.example`, `README.md`, `AGENTS.md`, `.platform-link`

## 2. shadcn/ui и базовые компоненты

<!-- spec: bootstrap-frontend -->

- [x] 2.1 Инициализировать shadcn/ui (`npx shadcn@latest init`)
- [x] 2.2 Добавить компоненты: button, input, table, dialog, sheet, select, badge, card, dropdown-menu, separator
- [x] 2.3 Настроить `components.json` и theme (CSS variables, светлая тема)

## 3. Роутинг и layout

<!-- spec: bootstrap-frontend -->

- [x] 3.1 Установить react-router-dom v6; `src/app/router.tsx`
- [x] 3.2 `AppLayout`: Header (placeholder «Баланс: —»), Sidebar, `<Outlet />`; `src/components/layout/`
- [x] 3.3 Placeholder-страницы: `/transactions`, `/tags`, `/mandatory-payments`, `/planned-expenses`; `src/features/*/pages/`
- [x] 3.4 Default redirect `/` → `/transactions`

## 4. API client и TanStack Query

<!-- spec: bootstrap-frontend -->

- [x] 4.1 `src/lib/api-client.ts`: fetch wrapper, base URL из `import.meta.env.VITE_API_URL`
- [x] 4.2 TanStack Query provider в `src/app/providers.tsx`
- [x] 4.3 Dev-хук или компонент `HealthStatus` — запрос `GET /api/v1/health` на layout

## 5. Формы и таблицы (заготовки)

<!-- spec: bootstrap-frontend -->

- [x] 5.1 Установить react-hook-form, zod, @hookform/resolvers
- [x] 5.2 Установить @tanstack/react-table v8
- [x] 5.3 Пример пустой DataTable на placeholder-странице транзакций (mock data, без API)

## 6. Качество и CI

<!-- spec: bootstrap-frontend -->

- [x] 6.1 ESLint + typescript-eslint + Prettier; scripts `lint`, `format`
- [x] 6.2 `.github/workflows/ci.yml`: npm ci → lint → tsc --noEmit → build
- [x] 6.3 Первый коммит + push в `git@github.com:SimonLavlinskiy/finAns-frontend.git` branch `main`

## 7. Связь с backend dev

<!-- spec: bootstrap-frontend -->

- [x] 7.1 `.env.example`: `VITE_API_URL=http://localhost:8080`
- [x] 7.2 Vite proxy в `vite.config.ts` (опционально) для `/api` → backend
