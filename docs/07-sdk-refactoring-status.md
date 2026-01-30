# SDK Refactoring: Статус и Проблемы

> **Дата:** 2026-01-30  
> **План:** [07-sdk-refactoring.md](./07-sdk-refactoring.md)  
> **Статус:** ⚠️ Заблокировано

---

## Что было сделано

### Фаза 1: SDK Types ✅
- `config.ts` — удалён `MessagingConfig`, добавлен `onRouteChanged` в `EmbedConfig`
- `messages.ts` — удалены legacy типы, добавлены `NAVIGATE`, `ROUTE_CHANGED`, `CLOSE`
- `events.ts` — удалён `MESSAGING_APP_READY`, добавлен `ROUTE_CHANGED`
- `api.ts` — обновлён `MessagingAPI` интерфейс, добавлен `currentRoute`

### Фаза 2: SDK Core ✅
- `MessagingSDK.ts` — полностью переписан:
  - Удалены: `authToken`, `setAuthToken`, `getAuthToken`, `clearAuthToken`, `initializeAuthToken`
  - Удалены: `handleAppReady`, `openChat`, `sendTextMessage`, `configure`
  - Переименован: `openEmbed()` → `open()`
  - Добавлены: `currentRoute`, обработка `ROUTE_CHANGED`
  - Обновлён: `navigate()` использует `NAVIGATE` вместо `NAVIGATE_TO`

### Фаза 3: SDK Index ✅
- `index.ts` — обновлён API wrapper, добавлен `openEmbed` как deprecated alias

### Фаза 4: Widget (частично) ⚠️
- `tokenRefresh.ts` — изменён source на `'messaging'`
- `NavigationSyncProvider.tsx` — добавлен `ROUTE_CHANGED`, обновлена обработка `NAVIGATE`
- `useMessagingCommunication.ts` — добавлен `sendRouteChanged`, удалены deprecated методы
- `types/index.ts` — обновлены message types

### Фаза 5: Constants ✅
- `constants/index.ts` — удалён `AUTH_TOKEN_STORAGE_KEY`

---

## Обнаруженные проблемы

### Проблема 1: Сборка SDK не работает (ПРЕДСУЩЕСТВУЮЩАЯ)

**Симптом:**
```bash
pnpm --filter messaging-sdk run build
# Error: Module '"@8ui/iframe-sdk-core"' has no exported member 'BaseSDK'
```

**Важно:** Эта проблема существовала ДО рефакторинга. Оригинальный код также не компилируется:
```bash
git stash  # откатить изменения
pnpm --filter messaging-sdk run build  # всё равно ошибка
```

**Возможные причины:**
1. pnpm workspace симлинки не работают корректно
2. `@8ui/iframe-sdk-core@1.0.2` имеет проблемы с экспортами типов
3. TypeScript module resolution не находит типы

**Файлы для анализа:**
- `/node_modules/@8ui/iframe-sdk-core/dist/index.d.ts` — экспорты есть
- `/node_modules/@8ui/iframe-sdk-core/dist/core/BaseSDK.d.ts` — класс определён
- `/apps/messaging-sdk/tsconfig.json` — `moduleResolution: "node"`

---

### Проблема 2: Виджет зависит от удалённых типов

**Затронутые файлы:**

| Файл | Использует | Решение |
|------|------------|---------|
| `AppEmbed.tsx` | `MessagingConfig`, `AUTH_TOKEN_TRANSFER`, `onConfigReceived` | Нужен рефакторинг или legacy support |
| `configSlice.ts` | `MessagingConfig` | Создать локальный тип или рефакторинг |
| `SetupContext.tsx` | `sendMessengerConnected`, `sendMessengerDisconnected` | Удалены из хука, нужна альтернатива |

**Частичное решение (уже применено):**
В `apps/messaging-widget/src/types/index.ts` добавлен deprecated `MessagingConfig` для обратной совместимости.

---

## Текущее состояние файлов

### SDK (изменённые файлы, не закоммичены)
```
apps/messaging-sdk/
├── src/
│   ├── constants/index.ts     # ✅ AUTH_TOKEN_STORAGE_KEY удалён
│   ├── core/MessagingSDK.ts   # ✅ Полностью переписан
│   ├── index.ts               # ✅ Новый API wrapper
│   └── types/
│       ├── api.ts             # ✅ Обновлён MessagingAPI
│       ├── config.ts          # ✅ Удалён MessagingConfig
│       ├── events.ts          # ✅ Добавлен ROUTE_CHANGED
│       ├── index.ts           # ✅ Обновлены экспорты
│       └── messages.ts        # ✅ Унифицированы типы сообщений
```

### Widget (изменённые файлы, не закоммичены)
```
apps/messaging-widget/
├── src/
│   ├── features/embed/tokenRefresh.ts           # ✅ source: 'messaging'
│   ├── hooks/useMessagingCommunication.ts       # ⚠️ Удалены методы, которые используются
│   ├── router/NavigationSyncProvider.tsx        # ✅ ROUTE_CHANGED
│   └── types/index.ts                           # ⚠️ Добавлен legacy MessagingConfig
```

---

## Варианты продолжения

### Вариант A: Сначала починить сборку SDK
1. Разобраться с `@8ui/iframe-sdk-core` module resolution
2. Возможно, обновить версию или пересобрать пакет
3. После этого продолжить рефакторинг

### Вариант B: Поэтапная миграция
1. SDK делаем чистым (только embed)
2. Виджет сохраняет локальные legacy типы для совместимости
3. Постепенно обновляем виджет в отдельных PR

### Вариант C: Откатить и пересмотреть план
1. `git checkout .` для отката изменений
2. Обновить план с учётом зависимостей виджета
3. Начать заново с более детальным планом

---

## Команды для проверки

```bash
# Проверить статус изменений
cd /Users/andrejsokolov/Desktop/projects/resto-messaging
git status

# Откатить все изменения
git checkout .

# Проверить сборку SDK
pnpm --filter messaging-sdk run build

# Проверить типы виджета
pnpm --filter messaging-widget exec tsc --noEmit

# Посмотреть экспорты iframe-sdk-core
cat node_modules/@8ui/iframe-sdk-core/dist/index.d.ts
```

---

## Контакты и ссылки

- **Спецификация:** `docs/specs/migration/08-sdk-refactoring.md`
- **План:** `docs/plans/07-sdk-refactoring.md`
- **iframe-sdk-core repo:** https://github.com/8ui/iframe-sdk-core
