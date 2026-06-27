## 1. Типы и API-клиент

<!-- spec: user-accounts -->

- [x] 1.1 Добавить в `workspace/finAns-frontend/src/lib/types.ts`: `User{id, username, display_name}`, `ProjectMember{user_id, username, display_name, role: "owner"|"member"}`, `Project{id, name, initial_balance_kopecks, started_at: string|null, created_at}`, `ProjectWithMembers extends Project { members: ProjectMember[] }`
- [x] 1.2 Добавить в `src/lib/api.ts`: `fetchUsers()`, `createUser(payload)`, `fetchProjects()`, `createProject(payload)`, `fetchProject(id)`, `fetchProjectMembers(id)`, `addProjectMember(projectId, username)`, `removeProjectMember(projectId, userId)`
- [x] 1.3 Обновить `src/lib/api-client.ts`: добавить к каждому запросу заголовки `X-User-ID` (из `localStorage.activeUserId`) и `X-Project-ID` (из `localStorage.activeProjectId`)

## 2. Контекст активного пользователя и проекта

<!-- spec: user-accounts -->

- [x] 2.1 Создать `src/lib/session.ts`: хелперы `getActiveUserId()`, `setActiveUserId(id)`, `getActiveProjectId()`, `setActiveProjectId(id)`, `clearSession()` — обёртки над `localStorage`
- [x] 2.2 Создать `src/context/SessionContext.tsx`: React context `SessionContext` с полями `user: User | null`, `projectId: number | null`, `setUser`, `setProjectId`; инициализация из `localStorage` при монтировании (реализовано в AuthProvider.tsx)
- [x] 2.3 Обернуть `<App>` в `<SessionProvider>` в `src/main.tsx` (AuthProvider уже обёрнут в providers.tsx)

## 3. Экран входа (выбор пользователя)

<!-- spec: user-accounts -->

- [x] 3.1 Создать `src/features/auth/pages/LoginPage.tsx`: список пользователей (карточки с `@username` и `display_name`), поле ввода `@username`, кнопка «Войти»; при успешном входе — `setActiveUserId`, переход на `/projects`
- [x] 3.2 Добавить роут `/login` в `src/app/router.tsx`; если `activeUserId` не установлен — редиректить на `/login` из `ProtectedRoute`
- [x] 3.3 Создать `ProtectedRoute` компонент: проверяет `activeUserId` + `activeProjectId`; без пользователя → `/login`; без проекта → `/projects`

## 4. Экран выбора / создания проекта

<!-- spec: projects -->

- [x] 4.1 Создать `src/features/projects/pages/ProjectsPage.tsx`: список проектов пользователя (`GET /api/v1/projects`); кнопка «Создать проект» → открывает форму; при выборе проекта — `setActiveProjectId`, переход на `/`
- [x] 4.2 Создать `src/features/projects/components/ProjectCreateSheet.tsx`: форма создания проекта — поля `name` (required), `initial_balance_kopecks` (optional), `started_at` (optional date); мутация `createProject` + инвалидация `["projects"]`
- [x] 4.3 Пустое состояние: если проектов нет — отображать «У вас нет проектов» + кнопка «Создать проект»
- [x] 4.4 Добавить роут `/projects` в `src/app/router.tsx`

## 5. Переключатель проекта в хедере

<!-- spec: projects -->

- [x] 5.1 Обновить `src/components/layout/AppLayout.tsx`: добавить переключатель проекта (Select или DropdownMenu) в хедер — отображается только если пользователь состоит в >1 проекте; при переключении — `setActiveProjectId`, `queryClient.clear()`, перезагрузка данных
- [x] 5.2 Отображать текущее имя проекта в хедере рядом с переключателем
- [x] 5.3 Отображать `@username` текущего пользователя и кнопку «Выйти» (сброс `localStorage`, переход на `/login`) в хедере

## 6. Административная форма создания пользователей

<!-- spec: user-accounts -->

- [x] 6.1 Создать `src/features/admin/pages/AdminUsersPage.tsx`: таблица пользователей (`GET /api/v1/users`) + форма «Создать пользователя» (`display_name`, `username`)
- [x] 6.2 Добавить роут `/admin/users` в `src/app/router.tsx`
- [x] 6.3 Добавить ссылку «Администрирование» в навигацию `AppLayout` (видна всегда в v1, т.к. нет ролевой защиты UI)

## 7. Настройки проекта — участники

<!-- spec: projects -->

- [x] 7.1 Создать `src/features/projects/pages/ProjectSettingsPage.tsx`: отображает участников (`GET /api/v1/projects/{id}/members`), форма добавления участника по `@username` (`POST /api/v1/projects/{id}/members`)
- [x] 7.2 Кнопка «Удалить» участника видна только `owner`; подтверждение через `confirm()`; мутация `removeProjectMember` + инвалидация
- [x] 7.3 Добавить роут `/projects/settings` и ссылку «Настройки проекта» в навигацию

## 8. Обновление существующих API-вызовов

<!-- spec: projects -->

- [x] 8.1 Убедиться, что все существующие вызовы в `src/lib/api.ts` проходят через обновлённый `api-client.ts`, который автоматически добавляет `X-Project-ID` и `X-User-ID` — дополнительных изменений в существующих функциях быть не должно
- [x] 8.2 При смене проекта вызывается `qc.clear()` в `setProjectId` — весь кэш сбрасывается, подмешивание невозможно

## 9. Frontend-тесты

<!-- spec: user-accounts -->

- [x] 9.1 Unit-тест `src/lib/session.ts`: `setActiveUserId` → `getActiveUserId` возвращает то же значение; `clearSession` → оба геттера возвращают `null`
- [x] 9.2 Unit-тест `ProjectsPage`: при пустом списке проектов рендерится пустое состояние с кнопкой «Создать проект»
