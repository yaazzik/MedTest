# MedTest

Мобильная веб-практика тестов по медицине катастроф.

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://127.0.0.1:5173/`.

## Данные

- Источник истины (не отдаётся клиенту): `data/bank.json`
- Первый запрос приложения: `public/data/manifest.json` (~64 KB) — источники, счётчики, id вопросов
- Вопросы по источникам: `public/data/chunks/*.json` (грузятся только выбранные банки)

Пересобрать чанки из полного банка:

```bash
npm run split-bank
```

## Сборка

```bash
npm run build
npm run preview
```

`base` в Vite — `/MedTest/` (project Pages). Локальный preview: `http://127.0.0.1:4173/MedTest/`.

## GitHub Pages

Пуш в `main` запускает workflow **Deploy GitHub Pages** (build → `actions/deploy-pages`).

Живой URL: https://yaazzik.github.io/MedTest/

Хостинг apps.grok.bot при этом не трогается — это дополнительный канал.
