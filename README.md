# JudgeApp — Система судейства соревнований

Полноценная веб-платформа для судейства: **Go (Gin + SQLite + JWT + bcrypt)** на бэкенде и **Vue 3 + TypeScript + Tailwind + Pinia** на фронтенде. Поддерживает режим личного судейства, сводный протокол администратора с динамическим расчётом средних баллов, экспорт в Excel и полный аудит изменений оценок.

> Приложение состоит из двух независимых частей, работающих параллельно:
>
> - `backend/` — REST API на Go (порт `:8080`)
> - `frontend/` — SPA на Vue 3 (порт `:5173` в dev-режиме)

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
17. [FAQ для разработчика](#faq-для-разработчика)

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
go run .
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
cd backend && go run .

# Терминал 2
cd frontend && npm run dev
```

---

## Учётные данные

Данные создаются функцией `Seed` в `backend/db.go` при пустой базе.

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

> Перед ивентом: либо поменяй `seedUsers` в `backend/db.go` и пересоздай БД (`rm backend/judge.db`), либо сделай миграцию вручную через `sqlite3 backend/judge.db`.

---

## Доступ с телефонов

### Вариант A — общая Wi-Fi сеть

```bash
# Backend на всех интерфейсах:
cd backend && ADDR=":8080" go run .

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

```
judgeApp/
├── backend/                            # Go REST API
│   ├── main.go                         # Роутинг, CORS, группы middleware
│   ├── db.go                           # InitDB + Seed (users, teams)
│   ├── auth.go                         # /auth/login, JWT, RequireAuth/RequireRole
│   ├── teams.go                        # GET /teams (+ myScore для судьи)
│   ├── scores.go                       # POST /scores (UPSERT + audit_logs)
│   ├── analytics.go                    # /analytics/protocol, /analytics/logs
│   ├── go.mod / go.sum
│   └── judge.db                        # SQLite (создаётся автоматически)
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

SQLite создаётся при старте бэкенда. Все DDL в `backend/db.go`.

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

Имя файла по умолчанию: `protocol-YYYY-MM-DD.xlsx`.

---

## Журнал аудита

Страница `/admin/logs` (`src/pages/admin-logs/ui/AdminLogsPage.vue`) показывает ленту формата:

```
14:20  ● Судья Иванов И. И.  изменил  Презентабельность  у команды  Team A   10 → 18   #5
08:45  ● Судья Петров П. П.  выставил Креативность       у команды  Team B   15   #4
```

- Точка зелёная для первой оценки (`old_value = null`) и синяя для изменения.
- Фильтры: по судье (dropdown) и по подстроке названия команды.
- Кнопка `Обновить` — перезапрашивает последние 1000 записей.

Это «чёрный ящик» системы: администратор видит, если кто-то из судей правит оценки в последний момент.

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

## FAQ для разработчика

### Как сбросить состояние и начать с чистой БД?
```bash
cd backend && rm -f judge.db judge.db-shm judge.db-wal && go run .
```

### Как добавить ещё одного судью / администратора?
Отредактируй `seedUsers` в `backend/db.go` и удали файл БД. Или живьём:
```bash
sqlite3 backend/judge.db
# вставь пользователя, pass нужно предварительно bcrypt-хешнуть
```

### Как пометить команду «не участвует»?
SQL-ом:
```sql
UPDATE teams SET status = 'absent' WHERE id = 42;
```
На фронте она автоматически получит жёлтую подсветку в списке и в протоколе, и в экспортируемом XLSX.

### Где менять количество критериев и максимальный балл?
`src/shared/config/scoring.ts` (фронт) и константа `maxPerCriterion` в `backend/scores.go` (бэк). При изменении количества критериев нужно ещё поправить DDL в `backend/db.go` и DTO.

### Почему у роутера `createWebHashHistory`?
Чтобы SPA работала как статический билд без настройки fallback-роутов на сервере.

### Где хранится токен на клиенте?
`localStorage['judge_token']` + `localStorage['judge_user']` (для быстрой отрисовки до запроса `/auth/me`). На `401` интерсептор чистит оба ключа и маршрутизатор отправляет на `/login`.

### Админ может сам ставить оценки?
Нет. `POST /scores` требует `role == 'judge'`. Это сделано намеренно: админ должен быть независимым наблюдателем со своим режимом.

### Как быстро убедиться, что документация не отстала от кода?
Минимальный чек:
1. `backend/db.go` — актуальны ли seed-пользователи и DDL
2. `backend/main.go` — актуален ли список роутов
3. `frontend/src/app/router/index.ts` — актуальны ли маршруты и `meta.roles`
4. `frontend/src/shared/api/*.api.ts` — актуальны ли типы ответов и пути

---

**Приятного судейства!**
