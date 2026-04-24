# JudgeApp — Система судейства соревнований

Полноценная веб-платформа для судейства: **Go (Gin + SQLite + JWT + bcrypt)** на бэкенде и **Vue 3 + TypeScript + Tailwind + Pinia** на фронтенде. Поддерживает режим личного судейства, сводный протокол администратора с динамическим расчётом средних баллов, экспорт в Excel и полный аудит изменений оценок.

> Приложение состоит из двух независимых частей, работающих параллельно:
>
> - `backend/` — REST API на Go (порт `:8080`)
> - `frontend/` — SPA на Vue 3 (порт `:5173` в dev-режиме)

**Онбординг для ревью (первые файлы):**

| Роль | Точка входа | Дальше по смыслу |
|------|-------------|------------------|
| Backend | `backend/cmd/server/main.go` | `internal/app/routes.go` (маршруты), `db.go` (схема + seed), хендлеры по областям: `auth.go`, `teams.go`, `scores.go`, `analytics.go` |
| Frontend | `frontend/src/app/main.ts` | `app/router/index.ts` (роли), затем `pages/*/ui/*` и `shared/api/*.api.ts` |

Полная схема папок — в [структуре проекта](#структура-проекта) и [FSD](#feature-sliced-design).

---

## Содержание

1. [Возможности](#возможности)
2. [Стек технологий](#стек-технологий)
3. [Быстрый старт](#быстрый-старт)
4. [Учётные данные](#учётные-данные)
5. [Доступ с телефонов](#доступ-с-телефонов)
6. [Архитектура](#архитектура)
7. [Структура проекта](#структура-проекта)
8. [Схема базы данных](#схема-базы-данных)
9. [REST API](#rest-api)
10. [Frontend API-слой](#frontend-api-слой)
11. [Feature-Sliced Design](#feature-sliced-design)
12. [UX: горячие клавиши и автосохранение](#ux-горячие-клавиши-и-автосохранение)
13. [Экспорт сводного протокола в Excel](#экспорт-сводного-протокола-в-excel)
14. [Журнал аудита](#журнал-аудита)
15. [Сборка для продакшна](#сборка-для-продакшна)
16. [Переменные окружения](#переменные-окружения)
17. [Судьи и команды: как настроить списки](#судьи-и-команды-как-настроить-списки)
18. [FAQ для разработчика](#faq-для-разработчика)

---

## Возможности

### Режим «Личное судейство» (роль `judge`)
- Список команд с серверным статусом и индикацией собственных оценок
- 5 критериев по 0–20 баллов, итоговая сумма до 100:
  1. **Актуальность** (`c1`)
  2. **Презентабельность** (`c2`)
  3. **Инновационность** (`c3`)
  4. **Практическая значимость** (`c4`)
  5. **Креативность** (`c5`)
- **Авто-сохранение** через 1 с после последнего ввода и мгновенно при потере фокуса (`blur`)
- **Горячие клавиши**: `Tab` / `Enter` — следующее поле, `↑/↓` — ±1, `Shift+↑/↓` — переход между критериями
- **Быстрые кнопки** 5 / 10 / 15 / 20 рядом с каждым критерием
- Поиск и фильтры: «Все / Не оценено / Оценено»
- Навигация `← Предыдущая / Следующая →` прямо со страницы оценки
- Индикатор статуса сохранения: `Автосохранение через 1 с…` → `Сохраняем…` → `Оценка сохранена`

### Режим «Сводный протокол» (роль `admin`)
- Excel-подобная таблица со сложной шапкой: группа `Критерии` над 5 колонками
- **Динамический расчёт**: каждая ячейка = `AVG` баллов всех судей, плюс счётчик проголосовавших
- Команды со статусом `absent` подсвечиваются жёлтым фоном
- Ранжирование по среднему итогу (сверху — лидеры)
- Кнопка **«Экспорт в Excel»** — `.xlsx`, полностью готовый к печати, с подписями жюри

### Журнал аудита (роль `admin`)
- Лента всех изменений: `14:20 — [Судья Иванов И. И.] изменил [Презентация] у команды [Team A] с 10 на 18`
- Фильтрация по судье и по названию команды
- Различие между «выставил впервые» и «изменил»

### Безопасность
- Пароли хранятся как **bcrypt**-хеши в SQLite
- **HS256 JWT** с временем жизни 12 часов
- Серверная проверка роли (`admin` / `judge`) для всех защищённых эндпоинтов
- Валидация диапазонов на бэкенде (0–20)
- Клиент: автоматический logout при `401`, проверка `exp` токена на старте

---

## Стек технологий

### Backend (`backend/`)
| Категория | Технология |
|---|---|
| Язык | Go 1.25+ |
| HTTP | [gin-gonic/gin](https://github.com/gin-gonic/gin) |
| БД | SQLite (`mattn/go-sqlite3`), WAL-режим |
| Авторизация | `golang-jwt/jwt/v5` + `golang.org/x/crypto/bcrypt` |

### Frontend (`frontend/`)
| Категория | Технология | Версия |
|---|---|---|
| UI-фреймворк | Vue 3 (Composition API) | ^3.5 |
| Язык | TypeScript | ~6.0 |
| Сборщик | Vite | ^8.0 |
| CSS | Tailwind CSS | ^4.2 |
| Роутер | Vue Router | ^4.6 |
| Стейт | Pinia | ^3.0 |
| HTTP-клиент | axios | ^1.x |
| Excel-экспорт | ExcelJS + file-saver | — |
| i18n | vue-i18n | ^11.3 (RU / EN / KK) |
| Архитектура | Feature-Sliced Design | — |

---

## Быстрый старт

### 1. Установка

```bash
# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && go mod download && cd ..
```

### 2. Запуск бэкенда

```bash
cd backend
go run ./cmd/server
# → judge backend listening on :8080 (db=judge.db)
```

При первом запуске создаётся `backend/judge.db` и выполняется seed (1 админ, 5 судей, 82 команды).

### 3. Запуск фронтенда

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Фронтенд по умолчанию обращается к `http://localhost:8080`. Переопределить можно через `frontend/.env`:

```env
VITE_API_URL=http://192.168.1.42:8080
```

### 4. Всё сразу

В двух терминалах:

```bash
# Терминал 1
cd backend && go run ./cmd/server

# Терминал 2
cd frontend && npm run dev
```

---

## Учётные данные

Данные создаются функцией `Seed` в `backend/internal/app/db.go` при пустой базе.

### Администратор

| Логин | Пароль | Роль | После входа попадает на |
|---|---|---|---|
| `admin` | `adminpass` | `admin` | `/admin/protocol` |

### Судьи

| Логин | Пароль | ФИО | После входа |
|---|---|---|---|
| `judge1` | `judge1pass` | Судья Иванов И. И. | `/teams` |
| `judge2` | `judge2pass` | Судья Петров П. П. | `/teams` |
| `judge3` | `judge3pass` | Судья Сидоров С. С. | `/teams` |
| `judge4` | `judge4pass` | Судья Кузнецов К. К. | `/teams` |
| `judge5` | `judge5pass` | Судья Смирнов С. С. | `/teams` |

> Перед ивентом: либо поменяй `seedUsers` в `backend/internal/app/db.go` и пересоздай БД (`rm backend/judge.db`), либо сделай миграцию вручную через `sqlite3 backend/judge.db`.

---

## Доступ с телефонов

### Вариант A — общая Wi-Fi сеть

```bash
# Backend на всех интерфейсах:
cd backend && ADDR=":8080" go run ./cmd/server

# Frontend с --host и нужным API-url:
cd frontend && VITE_API_URL=http://192.168.1.42:8080 npm run dev -- --host
```

Vite выведет адрес типа `http://192.168.1.42:5173/` — это и вводят судьи.

### Вариант B — Cloudflare Tunnel

Если нужен публичный HTTPS или нет общей сети:

```bash
# Один раз
brew install cloudflare/cloudflare/cloudflared

# Раздаём бэкенд (например)
cloudflared tunnel --url http://localhost:8080
# получим https://api-xxxx.trycloudflare.com

# И фронтенд
cloudflared tunnel --url http://localhost:5173
```

Тогда `VITE_API_URL=https://api-xxxx.trycloudflare.com`.

---

## Архитектура

```
┌─────────────────┐ HTTP(S) + Bearer JWT ┌───────────────────┐
│  Vue 3 SPA      │ ───────────────────► │  Go (Gin) API     │
│  (localhost:5173)                      │  (localhost:8080) │
│                                        │                   │
│  axios + Pinia                         │  JWT middleware   │
│  Role-based router                     │  Role middleware  │
└─────────────────┘                      └────────┬──────────┘
                                                  │ database/sql
                                                  ▼
                                         ┌───────────────────┐
                                         │  SQLite (WAL)     │
                                         │  4 таблицы        │
                                         └───────────────────┘
```

### Потоки

1. **Логин**: `POST /auth/login` → bcrypt-сравнение → HS256 JWT (12 ч) → фронт кладёт в `localStorage.judge_token` и прикладывает к каждому запросу через axios interceptor.
2. **Судья**: `GET /teams` → сервер джойнит `teams` с `scores` текущего судьи и возвращает `myScore` в каждой команде. Отправка оценки: `POST /scores` в транзакции → `UPSERT` + по одной записи в `audit_logs` на каждый изменившийся критерий.
3. **Админ**: `GET /analytics/protocol` использует `AVG()` + `COUNT()` по каждой команде; `GET /analytics/judge-scores` показывает оценки каждого судьи отдельно; `GET /analytics/logs` — хронологию аудита с JOIN-ом на судью и команду.
4. **401**: axios-интерсептор чистит токен и маршрутизатор отправляет на `/login`.

---

## Структура проекта

**Ориентир для ревью:** бэкенд — классическая раскладка Go (`cmd/` = бинарники, `internal/` = код приложения, не для внешнего импорта). Фронтенд — [Feature-Sliced Design](https://feature-sliced.design/): `app` → `pages` → `features` / `entities` → `shared` (см. раздел [Feature-Sliced Design](#feature-sliced-design)).

```
judgeApp/
├── backend/                            # Go REST API
│   ├── cmd/
│   │   ├── server/                     # Точка входа HTTP
│   │   │   └── main.go                 # init DB, seed, запуск Gin
│   │   └── sync-teams/                 # Утилита: имена из JSON в SQLite
│   │       └── main.go
│   ├── internal/app/                   # прикладной слой: HTTP + БД
│   │   ├── db.go                       # InitDB, schema DDL, Seed
│   │   ├── routes.go                  # CORS, группы, маршруты
│   │   ├── middleware.go              # CORS
│   │   ├── auth.go                    # /auth, JWT, middleware ролей
│   │   ├── teams.go                   # GET /teams (+ myScore)
│   │   ├── scores.go                  # POST /scores, audit
│   │   └── analytics.go               # /analytics/* (протокол, логи, …)
│   ├── data/                          # сид имён команд (exhibition_projects.json, embed)
│   │   ├── embed.go
│   │   └── exhibition_projects.json
│   ├── go.mod / go.sum
│   └── judge.db                      # SQLite (создаётся при старте, в .gitignore)
│
├── frontend/                           # Vue 3 SPA
│   ├── src/
│   │   ├── app/                        # Слой APP
│   │   │   ├── App.vue
│   │   │   ├── main.ts                 # Pinia + Router + i18n + 401-handler
│   │   │   └── router/
│   │   │       └── index.ts            # Guard по ролям (admin / judge)
│   │   │
│   │   ├── pages/                      # Слой PAGES
│   │   │   ├── login/                  # Вход
│   │   │   ├── teams/                  # Список команд (судья)
│   │   │   ├── scoring/                # Форма оценки
│   │   │   ├── admin-protocol/         # Сводный протокол
│   │   │   └── admin-logs/             # Лента аудита
│   │   │
│   │   ├── features/                   # Слой FEATURES
│   │   │   ├── auth/                   # Login form + auth store
│   │   │   ├── score-team/             # ScoreForm + use-score-form (auto-save, keyboard)
│   │   │   ├── filter-teams/           # Поиск + вкладки фильтра
│   │   │   └── export-protocol/        # Экспорт XLSX через ExcelJS
│   │   │
│   │   ├── entities/                   # Слой ENTITIES
│   │   │   └── team/
│   │   │       ├── model/
│   │   │       │   ├── team.types.ts
│   │   │       │   └── teams.store.ts  # Pinia: load / saveScore / getMyScore
│   │   │       └── ui/
│   │   │           └── TeamCard.vue
│   │   │
│   │   └── shared/                     # Слой SHARED
│   │       ├── api/                    # axios + типизированные методы
│   │       │   ├── client.ts           # axios instance + JWT interceptor + 401
│   │       │   ├── auth.api.ts
│   │       │   ├── teams.api.ts
│   │       │   ├── scores.api.ts
│   │       │   ├── analytics.api.ts
│   │       │   └── index.ts
│   │       ├── config/scoring.ts       # MAX_SCORE_PER_CRITERIA = 20 и т.д.
│   │       ├── i18n/                   # vue-i18n (ru / en / kk)
│   │       ├── lib/storage/            # Обёртка над localStorage
│   │       ├── lib/jwt/                # Декодер для чтения exp (без проверки подписи)
│   │       ├── ui/                     # AppButton, AppInput, ProgressBar, ProfileMenu, …
│   │       ├── utils/score-colors.ts
│   │       └── assets/                 # logo.png, judge.jpeg
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts                  # Алиасы @app/@pages/@features/@entities/@shared
│   ├── tsconfig.app.json               # Соответствующие TS paths
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Схема базы данных

SQLite создаётся при старте бэкенда. Все DDL в `backend/internal/app/db.go`.

### `users`
| Поле | Тип | Комментарий |
|---|---|---|
| `id` | INTEGER PK | |
| `username` | TEXT UNIQUE | логин |
| `password_hash` | TEXT | bcrypt |
| `full_name` | TEXT | ФИО для протокола и логов |
| `role` | TEXT | `admin` или `judge` |

### `teams`
| Поле | Тип | Комментарий |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT | название команды |
| `description` | TEXT | опционально |
| `status` | TEXT | `active` / `absent` (жёлтая подсветка) |

### `scores`
| Поле | Тип | Комментарий |
|---|---|---|
| `id` | INTEGER PK | |
| `judge_id` | INTEGER FK → users | |
| `team_id` | INTEGER FK → teams | |
| `c1..c5` | INTEGER | 0..20 каждый |
| `updated_at` | TEXT (RFC3339) | |
| `UNIQUE(judge_id, team_id)` | | одна оценка на пару судья×команда |

### `audit_logs`
| Поле | Тип | Комментарий |
|---|---|---|
| `id` | INTEGER PK | |
| `timestamp` | TEXT (RFC3339) | |
| `user_id` | INTEGER FK → users | кто изменил |
| `team_id` | INTEGER FK → teams | какую команду |
| `field` | TEXT | `c1`..`c5` |
| `old_value` | INTEGER NULL | `NULL` если это первая оценка |
| `new_value` | INTEGER | новое значение |

> Одна запись — одно изменение одного критерия. Если судья меняет c1 и c3 за один запрос, пишется 2 строки в `audit_logs`. Если значение не изменилось — запись не создаётся.

---

## REST API

Все защищённые эндпоинты требуют заголовок `Authorization: Bearer <token>`.

### `POST /auth/login`
```json
{ "username": "judge1", "password": "judge1pass" }
```
Ответ:
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 2, "username": "judge1", "fullName": "Судья Иванов И. И.", "role": "judge" }
}
```

### `GET /auth/me`
Возвращает текущего пользователя из JWT.

### `GET /teams`
Для роли `judge` каждый объект содержит `myScore` (или отсутствует). Для `admin` — без `myScore`.
```json
{
  "teams": [
    {
      "id": 1, "name": "алабуга", "description": "", "status": "active",
      "myScore": { "c1": 18, "c2": 15, "c3": 20, "c4": 8, "c5": 12, "total": 73, "updatedAt": "2026-04-23T08:36:45Z" }
    }
  ]
}
```

### `POST /scores`  *(только `judge`)*
```json
{ "teamId": 1, "c1": 10, "c2": 15, "c3": 20, "c4": 5, "c5": 12 }
```
Валидация `0 ≤ ci ≤ 20`. В одной транзакции UPSERT в `scores` + запись изменений в `audit_logs`.

### `GET /analytics/protocol`  *(только `admin`)*
Сводный протокол со средними оценками по каждому критерию для всех команд:
```json
{
  "rows": [
    { "teamId": 1, "teamName": "алабуга", "status": "active",
      "avgC1": 19.0, "avgC2": 12.5, "avgC3": 19.0, "avgC4": 11.5, "avgC5": 11.0,
      "avgTotal": 73.0, "judgesVoted": 2 }
  ],
  "judges": [ { "id": 2, "username": "judge1", "fullName": "Судья Иванов И. И." } ],
  "totalJudges": 5
}
```
Где:
- `avgC1..avgC5` — среднее арифметическое оценок всех судей по каждому критерию (или `null` если оценок нет)
- `avgTotal` — средний итоговый балл (сумма avg*)
- `judgesVoted` — количество судей, которые оценили команду

### `GET /analytics/judge-scores`  *(только `admin`)*
Таблица оценок каждого судьи для всех команд — используется для детального анализа отдельных судей:
```json
{
  "judges": [
    {
      "judge": { "id": 2, "username": "judge1", "fullName": "Судья Иванов И. И." },
      "scores": [
        { "teamId": 1, "teamName": "алабуга", "status": "active", "c1": 18, "c2": 15, "c3": 20, "c4": 8, "c5": 12, "total": 73 }
      ]
    }
  ]
}
```

### `GET /analytics/logs?limit=500`  *(только `admin`)*
Лента изменений в обратном хронологическом порядке, с именами судьи и команды. По умолчанию возвращает 500 последних записей, максимум 5000.

- Опционально: `userId` — только записи выбранного судьи (**фильтр в SQL до `LIMIT`**).
- Опционально: `from`, `to` (RFC3339) — границы по `audit_logs.timestamp` (для внешних вызовов; в веб-UI не используется).
- В ответе: `logs` и `judges` (все с ролью `judge`) — для селектора.

### Коды ответов

| Код | Когда |
|---|---|
| `200` | OK |
| `400` | Невалидный payload или `ci` вне диапазона |
| `401` | Нет / просрочен / невалиден JWT |
| `403` | Роль не имеет доступа к эндпоинту |
| `404` | Команда не найдена |

---

## Frontend API-слой

Всё общение с сервером инкапсулировано в `src/shared/api/`:

```ts
// @shared/api/client.ts
export const http = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 })

http.interceptors.request.use(cfg => {
  const token = storageGet<string>(TOKEN_KEY)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

http.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    storageRemove(TOKEN_KEY)
    onUnauthorized?.()   // глобальный logout-хендлер, проставляется из main.ts
  }
  return Promise.reject(err)
})
```

Методы с типами:

```ts
import { loginRequest, fetchTeams, upsertScoreRequest, fetchProtocol, fetchLogs } from '@shared/api'
```

Все Pinia-сторы опираются на эти функции:

- `useAuthStore` — `loginRequest` + разбор `exp` из JWT (без валидации подписи, только UX)
- `useTeamsStore` — `fetchTeams` на `onMounted`, `upsertScoreRequest` из формы оценки

---

## Feature-Sliced Design

Используется классический FSD: однонаправленные зависимости сверху вниз.

```
app  →  pages  →  features  →  entities  →  shared
```

**Соглашение по папкам:** у `pages/`, `features/`, `entities/` есть корневой `index.ts` (реэкспорт публичного API слайса). Внутри — `ui/` (Vue-компоненты) и/или `model/` (логика, composables, Pinia), чтобы отделить отображение от данных.

### Алиасы

Настроены в `vite.config.ts` и `tsconfig.app.json`:

```
@app      → src/app
@pages    → src/pages
@features → src/features
@entities → src/entities
@shared   → src/shared
```

### Карта «что где»

| Что нужно | Файл |
|---|---|
| Маршруты + role-guard | `src/app/router/index.ts` |
| Глобальный 401-хендлер | `src/app/main.ts` |
| axios + интерсепторы | `src/shared/api/client.ts` |
| Методы API (типизированные) | `src/shared/api/*.api.ts` |
| Auth store (JWT) | `src/features/auth/model/auth.store.ts` |
| Форма логина | `src/features/auth/ui/LoginForm.vue` |
| Teams store (fetch + save) | `src/entities/team/model/teams.store.ts` |
| Страница списка команд | `src/pages/teams/ui/TeamsPage.vue` |
| Страница оценки | `src/pages/scoring/ui/ScoringPage.vue` |
| Форма оценки + auto-save + keyboard | `src/features/score-team/model/use-score-form.ts` |
| UI формы оценки | `src/features/score-team/ui/ScoreForm.vue` |
| Сводный протокол (admin) | `src/pages/admin-protocol/ui/AdminProtocolPage.vue` |
| Экспорт XLSX | `src/features/export-protocol/model/export-xlsx.ts` |
| Журнал аудита (admin) | `src/pages/admin-logs/ui/AdminLogsPage.vue` |
| Константы критериев | `src/shared/config/scoring.ts` |
| Локализация (RU/EN/KK) | `src/shared/i18n/locales/*.json` |
| Переиспользуемый UI | `src/shared/ui/` |

### Правила импортов

Запрещено:
- Импорт мимо `index.ts` слайса (`@features/auth/model/...` вместо `@features/auth`)
- `shared` ← из старших слоёв
- `features` ← из `pages`
- Взаимный импорт между фичами

---

## UX: горячие клавиши и автосохранение

Реализовано в `src/features/score-team/model/use-score-form.ts`.

### Клавиши (внутри поля ввода критерия)

| Клавиша | Действие |
|---|---|
| `Tab` | Переход к следующему полю (нативно браузером) |
| `Enter` | Переход к следующему критерию |
| `↑` / `↓` | Увеличить / уменьшить значение на 1 |
| `Shift` + `↑` / `↓` | Перейти к предыдущему / следующему критерию |
| `Shift` + `←` / `→` | То же (альтернатива) |

### Быстрые кнопки

Под каждым полем: `5 · 10 · 15 · 20`. Нажатие выставляет значение и триггерит auto-save. Активная кнопка подсвечивается мятным.

### Авто-сохранение

- **Debounce 1 секунда** после любого ввода (`input`, `+`/`−`, стрелки, quick-buttons).
- **Немедленный flush** при `blur` поля (даже если секунда не прошла).
- Статусы: `idle` → `pending` → `saving` → `saved` (или `error` с текстом с сервера).
- Повторное сохранение не отправляется, если нет изменений, после `saved`.

Кнопка **«Сохранить / Обновить оценку»** остаётся и доступна как явное действие.

---

## Экспорт сводного протокола в Excel

Модуль: `src/features/export-protocol/model/export-xlsx.ts` на базе [ExcelJS](https://github.com/exceljs/exceljs) + [file-saver](https://github.com/eligrey/FileSaver.js).

Формирует `.xlsx`, готовый к печати:

- Заголовок и подзаголовок (дата, количество судей) — объединённые ячейки
- **Двухуровневая шапка**: строка `Критерии` над 5 колонками `C1..C5`
- Жёлтый фон `#FFF4B8` для команд со статусом `absent`
- Рамки на всех ячейках, настроенная ширина колонок
- `Landscape`, `fit-to-width`, `printTitlesRow` — шапка повторяется на каждой странице
- **Блок подписей жюри** с линиями для автографа
- **Лист «Итог»** — команды в **том же порядке**, что и в веб-протоколе (как в API); на диапазон с шапкой и данными вешается **автофильтр** (в Microsoft Excel в строке заголовка появляются **▼** — можно отсортировать, например по колонке «ИТОГО»; в Apple Numbers сортировка через меню/столбец). В подзаголовке файла (из UI) — краткая подсказка.

Имя файла по умолчанию: `protocol-YYYY-MM-DD.xlsx`.

---

## Журнал аудита

Страница `/admin/logs` (`src/pages/admin-logs/ui/AdminLogsPage.vue`) — **лента** изменений с карточкой: **ФИО судьи** отдельной строкой, ниже — критерий, **двуязычное название проекта** (с переносами), баллы «было → стало».

- Точка **зелёная** — первая оценка критерия (`old_value = null`); **синяя** — правка.
- **Фильтр по судье** уходит на сервер (`GET /analytics/logs?userId=…`), список судей в селекте приходит с API — независимо от «хвоста» в лимите.
- **Поиск по проекту** — на клиенте, по подстроке в названии.
- `Обновить` / смена судьи — перезагрузка лога (до `limit=5000` записей). **Экспорт в Excel** — выгружаемый лист по текущим отфильтрованным строкам (см. `export-logs-xlsx`).

Это «чёрный ящик» системы: администратор видит, кто и когда менял оценки.

---

## Сборка для продакшна

### Frontend

```bash
cd frontend
npm run build
```

Делает `vue-tsc -b` (проверка типов) + `vite build`. Результат в `frontend/dist/`.

Типичный размер (gzip):

| Файл | Размер |
|---|---|
| `index.js` (Vue + Pinia + Router + axios) | ~96 KB |
| `AdminProtocolPage.js` (ExcelJS внутри) | ~261 KB |
| `ScoringPage.js` | ~4.4 KB |
| `TeamsPage.js` | ~2.4 KB |
| `AdminLogsPage.js` | ~2.1 KB |
| CSS | ~7.2 KB |

> ExcelJS большой — он попадает только в чанк админской страницы благодаря code-splitting, так что для судей на мобильных он не грузится.

### Backend

```bash
cd backend
CGO_ENABLED=1 go build -o judge-server .
./judge-server
```

> `CGO_ENABLED=1` нужен, т.к. `mattn/go-sqlite3` линкуется с системным SQLite.

---

## Переменные окружения

### Backend

| Переменная | По умолчанию | Описание |
|---|---|---|
| `ADDR` | `:8080` | Адрес и порт HTTP-сервера |
| `JUDGE_DB` | `judge.db` | Путь к файлу SQLite |
| `JWT_SECRET` | `dev-insecure-secret-change-me` | **Обязательно сменить в проде** |

### Frontend

| Переменная | По умолчанию | Описание |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | База для axios-клиента |

---

## Судьи и команды: как настроить списки

В веб-интерфейсе **нет** отдельного экрана «добавить судью» или «редактировать команды» — списки задаются **seed-данными** и/или **SQL** к файлу `judge.db` (переменная окружения `JUDGE_DB`).

### Судьи: увеличить число, сменить логины / пароли / ФИО

**Путь A — подготовка к ивенту, можно сбросить оценки**

1. Открой `backend/internal/app/db.go`, массив `seedUsers`. Добавь или измени записи: поля `username`, `password`, `fullName`, `role` (`"admin"` или `"judge"`).
2. Останови сервер и удали базу (и WAL), затем снова запусти:

```bash
cd backend && rm -f judge.db judge.db-shm judge.db-wal && go run ./cmd/server
```

Функция `Seed` создаёт пользователей **только если** таблица `users` пустая, поэтому «пересейвить» тот же файл БД, не удаляя его, **нельзя** — только вручную (путь B) или с чистой БД.

**Путь B — база уже с данными, пользователя нужно добавить без полного сброса**

1. Сгенерируй bcrypt-хеш пароля. В каталоге `backend/` (там подключён `golang.org/x/crypto/bcrypt`) можно временно создать файл, например `hashpass.go`:

```go
package main
import (
  "fmt"
  "golang.org/x/crypto/bcrypt"
)
func main() {
  b, _ := bcrypt.GenerateFromPassword([]byte("НОВЫЙ_ПАРОЛЬ"), bcrypt.DefaultCost)
  fmt.Println(string(b))
}
```

2. `cd backend && go run hashpass.go` — скопируй строку хеша.
3. Подставь в SQLite (подставь свой хеш и данные; `id` не конфликтуй с существующими):

```sql
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('judge6', '$2a$10$...хеш...', 'Судья Новиков Н. Н.', 'judge');
```

Выполни через `sqlite3 backend/judge.db` или любой клиент к SQLite.

### Команды: откуда берётся список при первом запуске

- Файл **`backend/data/exhibition_projects.json`** — JSON-массив **строк** (названия команд). Порядок в массиве при пустой таблице `teams` соответствует присваиваемым `id` (1, 2, 3, …).
- Список подставляется из **`//go:embed exhibition_projects.json`** (файл `backend/data/embed.go`) — при изменении JSON перезапусти бэкенд (`go run …` / пересборка), чтобы в бинарь попала новая версия.
- **Пересоздать команды с нуля** — снова правка JSON (или списка в коде) + **удаление** `judge.db` (как выше), пока `teams` пуста только при первом `Seed` по пустой БД. Если БД не пустая, новые строки в JSON **сами не подтянутся**: нужно вручную `INSERT` в `teams` или сброс БД (оценки и аудит пропадут).

### Команды: только переименовать (тот же состав и порядок `id`)

1. Отредактируй `backend/data/exhibition_projects.json`: **столько же** строк, сколько команд в БД, в том же порядке, что `id` по возрастанию.
2. Из каталога `backend` выполни:

```bash
go run ./cmd/sync-teams
# если БД не `backend/judge.db`, передай путь:
go run ./cmd/sync-teams /полный/путь/к/judge.db
```

Утилита **обновляет поле `name`** у существующих строк `teams` по соответствию: N-я строка JSON → команда с `id = N` (в порядке `ORDER BY id`). Если в JSON **меньше** или **больше** имён, чем команд, обновится `min(число_команд, число_строк_в_json)`; в лог пишется предупреждение.

### Команды: добавить одну запись / статус / удаление

- **Добавить команду** в работающей БД:

```sql
INSERT INTO teams (name) VALUES ('Новая команда');
```

(при необходимости укажи `description`, `status` — см. схему в `db.go`).

- **«Не участвует»** без удаления строки: `UPDATE teams SET status = 'absent' WHERE id = 42;` — на фронте и в протоколе жёлтая подсветка.
- **Удалить команду** из БД вручную **сложно**: на `teams` ссылаются `scores` и `audit_logs`. Нужно сначала удалить или обнулить зависимые записи, либо не удалять, а ставить `absent` / переименовывать. Отдельного сценария в приложении нет.

### Сводка

| Задача | Где смотреть / что делать |
|--------|---------------------------|
| Больше судьёй с нуля, новые логины | `seedUsers` + удалить `judge.db` + запуск |
| Судья в существующую БД | bcrypt-хеш + `INSERT INTO users` |
| Список команд с нуля (ивент) | `exhibition_projects.json` + чистая БД |
| Переименовать команды, состав тот же | JSON + `go run ./cmd/sync-teams` |
| Нова команда в середине турнира | `INSERT INTO teams` |
| Не приехала | `UPDATE teams SET status = 'absent' …` |
| Только оценки + журнал аудита (судьи и команды как были) | см. [FAQ](#как-удалить-только-оценки-и-журнал-аудита-судьи-и-команды-остаются) |

---

## FAQ для разработчика

### Как сбросить состояние и начать с чистой БД?
```bash
cd backend && rm -f judge.db judge.db-shm judge.db-wal && go run ./cmd/server
```

### Как удалить только оценки и журнал аудита (судьи и команды остаются)?

Нужно очистить таблицы `scores` и `audit_logs`. Пользователей (`users`) и команды (`teams`) это **не** трогает.

1. Останови бэкенд, чтобы не держать открытым файл БД.
2. Из каталога `backend` (или укажи полный путь к файлу, если задан `JUDGE_DB`):

```bash
sqlite3 judge.db "DELETE FROM audit_logs; DELETE FROM scores; VACUUM;"
```

`VACUUM` сжимает файл SQLite (по желанию). Затем снова запусти `go run ./cmd/server`.

> В проекте нет сущности «лайки» — только **оценки** в `scores` и записи **журнала** в `audit_logs`.

### Как добавить ещё одного судью / администратора?
См. раздел [Судьи и команды: как настроить списки](#судьи-и-команды-как-настроить-списки) — **путь A** (seed + чистая БД) или **путь B** (вставка в SQLite с bcrypt).

### Как пометить команду «не участвует»?
SQL-ом:
```sql
UPDATE teams SET status = 'absent' WHERE id = 42;
```
На фронте она автоматически получит жёлтую подсветку в списке и в протоколе, и в экспортируемом XLSX.

### Где менять количество критериев и максимальный балл?
`src/shared/config/scoring.ts` (фронт) и константа `maxPerCriterion` в `backend/internal/app/scores.go` (бэк). При изменении количества критериев нужно ещё поправить DDL в `backend/internal/app/db.go` и DTO.

### Почему у роутера `createWebHashHistory`?
Чтобы SPA работала как статический билд без настройки fallback-роутов на сервере.

### Где хранится токен на клиенте?
`localStorage['judge_token']` + `localStorage['judge_user']` (для быстрой отрисовки до запроса `/auth/me`). На `401` интерсептор чистит оба ключа и маршрутизатор отправляет на `/login`.

### Админ может сам ставить оценки?
Нет. `POST /scores` требует `role == 'judge'`. Это сделано намеренно: админ должен быть независимым наблюдателем со своим режимом.

### Как быстро убедиться, что документация не отстала от кода?
Минимальный чек:
1. `backend/internal/app/db.go` — актуальны ли seed-пользователи и DDL
2. `backend/internal/app/routes.go` — актуален ли список роутов
3. `frontend/src/app/router/index.ts` — актуальны ли маршруты и `meta.roles`
4. `frontend/src/shared/api/*.api.ts` — актуальны ли типы ответов и пути

---

**Приятного судейства!**
