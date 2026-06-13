# workspace/

Локальные клоны командных репозиториев. **Не коммитятся** (см. `.gitignore`).

```bash
make init     # клонировать finAns-backend и finAns-frontend
make verify   # проверить ветки
```

После клонирования:
- `workspace/finAns-backend/`
- `workspace/finAns-frontend/`

Каждый сервисный репозиторий должен содержать `.platform-link` → finAns-platform.
