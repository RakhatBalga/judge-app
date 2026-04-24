# `src/` — фронтенд по Feature-Sliced Design

Зависимости только **сверху вниз** (см. [корневой README](../../README.md#feature-sliced-design)):

`app` → `pages` → `features` / `entities` → `shared`

- **`app/`** — shell: `main.ts`, `App.vue`, роутер, глобальные провайдеры.
- **`pages/`** — экраны по URL; тонкие, собирают features и entities.
- **`features/`** — сценарии (логин, оценка, фильтр, экспорт XLSX).
- **`entities/`** — бизнес-сущности (команда: типы, store, `TeamCard`).
- **`shared/`** — API-клиент, UI-kit, i18n, утилиты без доменного смысла.

Алиасы: `@app`, `@pages`, `@features`, `@entities`, `@shared` (см. `vite.config.ts`).

Подробные таблицы «что в каком файле» — в корневом README, раздел *Карта «что где»*.
