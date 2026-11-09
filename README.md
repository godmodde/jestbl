# Видно — школа русского жестового языка

Главная страница и учебная платформа РЖЯ: уроки «Смотрим → Разбираем → Пробуем», словарь, избранное, интервальное повторение.
ТЗ — [CLAUDE.md](CLAUDE.md), дизайн и структура — [docs/DESIGN.md](docs/DESIGN.md), журнал решений и текущее состояние — [docs/CHECKPOINT.md](docs/CHECKPOINT.md).

Стек: Next.js 16 (App Router), React 19, Tailwind 4, PostgreSQL (`postgres` + zod, SQL-миграции), pnpm.

## Запуск в рабочем окружении (Coder)

```bash
# 1. После перезапуска окружения — один раз (лимиты и библиотеки сбрасываются)
sudo sysctl -w fs.inotify.max_user_watches=1048576 fs.inotify.max_user_instances=1024
sudo env "PATH=$PATH" pnpm exec playwright install-deps chromium   # только для тестов и скриншотов

# 2. Зависимости и настройки
pnpm install
cp .env.example .env.local        # если файла ещё нет

# 3. База: Postgres 15 в Docker на порту 5433, схема и контент
pnpm db:up
pnpm db:migrate
pnpm db:seed                      # можно запускать повторно: обновляет контент, прогресс учеников не трогает

# 4. Сайт
pnpm dev                          # http://localhost:3003
```

Ссылки через прокси Coder (нужен вход в Coder в этом браузере):

- сайт — https://3003--main--novi--albert.devgreenboxweb.ru/
- трекер проекта — `python3 scripts/serve-mockup.py` (без кэша) → https://3002--main--novi--albert.devgreenboxweb.ru/tracker.html. Корень `3002` сразу открывает сайт (порт 3003); старый статичный макет первого экрана — `/mockup-v1.html`

Если после перезапуска окружения новые стили не применяются — удалите кэш: `rm -rf .next` и снова `pnpm dev`.

Серверы должны слушать `0.0.0.0`, иначе прокси до них не достучится. Памяти в окружении ~10 ГБ: одновременно держите не больше двух `next dev` (с проектом подсветки — тоже).

## Проверки

```bash
pnpm lint && pnpm typecheck
pnpm test         # Vitest: повторение, урок, экзамены, обведение букв, распознавание руки
pnpm test:e2e     # Playwright: сценарии из ТЗ (урок, словарь, экзамен, детская игра, буква) на компьютере и телефоне (нужен pnpm dev)
```

## Контент

Весь учебный контент — [content/content.mts](content/content.mts) и подключённые к нему [letters.mts](content/letters.mts) (алфавит), [kids.mts](content/kids.mts) (детские темы и игры), [spheres.mts](content/spheres.mts) (сферы для взрослых): категории, темы, уроки, жесты, похожие и связанные жесты. Правите файлы → `pnpm db:seed`. Картинки детских игр — Microsoft Fluent Emoji (MIT), [public/pictures/SOURCES.md](public/pictures/SOURCES.md).

Разделы: главная `/`, обучение `/learn`, алфавит `/alphabet`, взрослым `/adults`, детям `/kids`, словарь `/dictionary`, повторение `/review`, прогресс `/progress`. Тексты — черновик, на каждой карточке пометка «требует проверки носителем РЖЯ».

## Видео

Своих видео пока нет. `DEMO_VIDEOS=surdo` включает видео словаря surdo.media по прямым ссылкам — **только для локального показа**: разрешения правообладателя нет. Без переменной вместо видео стоят заглушки. ТЗ на собственную съёмку — [docs/video-brief.md](docs/video-brief.md). Когда видео появятся: положите их в хранилище (например, Yandex Object Storage), пропишите пути в `content/content.mts` и уберите `CaptionMask` в `components/video-player.tsx` (он размывает вшитую подпись в видео surdo.media).

Проверка дактиля камерой (`components/camera-check.tsx`) работает в браузере на MediaPipe, файлы — в `public/mediapipe/`: `vision_wasm_internal.*` и `vision_wasm_nosimd_internal.*` скопированы из `node_modules/@mediapipe/tasks-vision/wasm` (при обновлении пакета копируйте заново — версии должны совпадать), `hand_landmarker.task` — модель float16 из `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/`. Образцы букв `content/dactyl-templates.json` сняты с демо-видео surdo.media (`pnpm dactyl:templates`) и отдаются только при `DEMO_VIDEOS=surdo`.

## API для будущего приложения

`/api/v1` — те же данные, что видит сайт. Ученик — анонимное устройство: сайт передаёт его cookie `vidno_device`, приложение — заголовком `X-Device-Id` (UUID).

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/v1/lessons` | Темы, уроки, прогресс, сколько жестов повторить |
| GET | `/api/v1/lessons/{slug}` | Урок: жесты, план шагов, где остановились |
| PUT | `/api/v1/lessons/{slug}/progress` | `{ step, completed }` — сохранить шаг |
| GET | `/api/v1/signs?q=&category=&tab=` | Поиск по словарю; `tab`: all, learned, favorites, review |
| GET | `/api/v1/signs/{slug}` | Карточка жеста, похожие, уроки |
| PUT | `/api/v1/signs/{slug}/favorite` | `{ favorite: true \| false }` |
| POST | `/api/v1/signs/{slug}/review` | `{}` — в повторение; `{ grade: "again" \| "hard" \| "good" }` — оценка |
| GET | `/api/v1/review` | Жесты, которые пора повторить |

## Публикация (хостинг в РФ)

Нужны Node.js 24 и PostgreSQL 15+ (VPS или managed-сервис: Timeweb Cloud, Selectel, Yandex Cloud).

```bash
pnpm install --frozen-lockfile
pnpm db:migrate && pnpm db:seed
pnpm build
pnpm start        # порт 3003; за ним — nginx с HTTPS
```

Переменные окружения: `DATABASE_URL`, `SITE_URL` (адрес сайта), `YM_ID` (номер счётчика Метрики). **`DEMO_VIDEOS` в публичной сборке не задавать.**

Перед публикацией: свои видео или письменное разрешение правообладателя, проверка контента носителем РЖЯ, реквизиты в `/privacy` и `/cookies` (метки в квадратных скобках), домен. Полный список — в трекере проекта.
