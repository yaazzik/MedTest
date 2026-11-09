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
