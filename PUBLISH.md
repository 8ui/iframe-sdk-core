# Инструкции по публикации @8ui/iframe-sdk-core

## Подготовка к публикации

Пакет уже подготовлен для публикации:
- ✅ package.json обновлен (name: @8ui/iframe-sdk-core)
- ✅ LICENSE добавлен (MIT)
- ✅ README обновлен
- ✅ CONTRIBUTING.md создан
- ✅ GitHub Actions настроен (.github/workflows/ci.yml)

## Шаги для публикации

### 1. Создать GitHub репозиторий

1. Перейти на https://github.com/8ui
2. Создать новый репозиторий `iframe-sdk-core`
3. Скопировать URL репозитория

### 2. Инициализировать Git репозиторий (если еще не инициализирован)

```bash
cd @packages/iframe-sdk-core
git init
git add .
git commit -m "Initial commit: iframe-sdk-core v1.0.0"
```

### 3. Добавить remote и запушить

```bash
git remote add origin https://github.com/8ui/iframe-sdk-core.git
git branch -M main
git push -u origin main
```

### 4. Настроить npm токен

1. Создать npm токен на https://www.npmjs.com/settings/8ui/tokens
2. Добавить токен в GitHub Secrets:
   - Перейти в Settings → Secrets and variables → Actions
   - Добавить новый secret: `NPM_TOKEN` с значением npm токена

### 5. Опубликовать в npm

#### Вариант 1: Автоматическая публикация через GitHub Actions

После настройки NPM_TOKEN, публикация будет происходить автоматически при пуше в main/master ветку.

#### Вариант 2: Ручная публикация

```bash
# Убедиться, что вы авторизованы в npm
npm login

# Собрать пакет
npm run build

# Опубликовать
npm publish --access public
```

### 6. Проверить публикацию

1. Проверить на npm: https://www.npmjs.com/package/@8ui/iframe-sdk-core
2. Проверить на GitHub: https://github.com/8ui/iframe-sdk-core

## Обновление версии

Для обновления версии:

1. Обновить версию в `package.json`
2. Создать git tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. Запушить изменения в main (автоматическая публикация) или опубликовать вручную

## Примечания

- Пакет публикуется как `@8ui/iframe-sdk-core`
- Доступ: public
- Лицензия: MIT
- Версионирование: semver
