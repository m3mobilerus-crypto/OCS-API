# OCS API Proxy — m3-mobile.ru

Прокси-сервер для интеграции OCS B2B API с сайтом m3-mobile.ru.  
Показывает только нужные данные: каталог товаров, наличие на складе, транзит, характеристики и фотографии.

---

## Структура проекта

```
ocs-proxy/
├── src/
│   ├── index.js                  # Точка входа
│   ├── routes/
│   │   ├── catalog.js            # Маршруты каталога
│   │   └── content.js            # Маршруты контента (фото + характеристики)
│   └── services/
│       ├── ocsService.js         # Запросы к OCS API
│       ├── cacheService.js       # Кэширование
│       └── formatter.js          # Форматирование ответов
├── .env.example                  # Шаблон переменных окружения
├── railway.json                  # Конфиг Railway
└── package.json
```

---

## Деплой на Railway

### 1. Загрузить на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ocs-proxy.git
git push -u origin main
```

### 2. Подключить Railway

1. Зайти на [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Выбрать репозиторий `ocs-proxy`
4. Railway сам определит Node.js и задеплоит

### 3. Добавить переменные окружения в Railway

В разделе **Variables** добавить:

| Переменная | Значение |
|---|---|
| `OCS_API_TOKEN` | Токен от OCS (получить у api@ocs.ru) |
| `OCS_SHIPMENT_CITY` | `Москва` |
| `OCS_ENV` | `test` (для теста) или убрать для продакшена |
| `ALLOWED_ORIGIN` | `https://m3-mobile.ru` |
| `CACHE_TTL` | `3600` |

---

## API эндпоинты

### Каталог

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/categories` | Дерево категорий |
| GET | `/api/catalog/all` | Все товары |
| GET | `/api/catalog/:category` | Товары по категории (например `/api/catalog/V060002`) |
| POST | `/api/catalog/batch` | Товары по списку артикулов |
| GET | `/api/product/:itemId` | Один товар по артикулу |

### Контент

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/content/:itemId` | Характеристики + фото товара |
| POST | `/api/content/batch` | Характеристики + фото по списку |
| GET | `/api/content/changes?from=2024-01-01` | Изменения с даты |

### Служебные

| Метод | URL | Описание |
|---|---|---|
| GET | `/health` | Проверка статуса сервера |

---

## Примеры запросов с сайта

```javascript
// Получить все товары
const res = await fetch('https://ВАШ_ДОМЕН.railway.app/api/catalog/all');
const data = await res.json();

// Получить характеристики и фото товара
const res = await fetch('https://ВАШ_ДОМЕН.railway.app/api/content/1000461530');
const data = await res.json();

// Получить несколько товаров сразу
const res = await fetch('https://ВАШ_ДОМЕН.railway.app/api/catalog/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ itemIds: ['1000461530', '1000459619'] })
});
const data = await res.json();
```

---

## Пример ответа — один товар

```json
{
  "itemId": "1000461530",
  "partNumber": "UTC650E",
  "producer": "Cyberpower",
  "itemName": "ИБП CyberPower UTC650E",
  "isAvailableForOrder": true,
  "price": {
    "order": { "value": 3300, "currency": "RUR" },
    "endUser": { "value": 3513, "currency": "RUR" }
  },
  "stock": [
    { "location": "МСК", "quantity": 100, "isGreatThan": true, "canReserve": true }
  ],
  "transit": [
    { "location": "БТ", "quantity": 24, "canReserve": true, "deliveryDate": "2024-08-26" }
  ]
}
```

---

## Партнёр OCS

Код партнёра: **К0239960**  
Техподдержка: api@ocs.ru
