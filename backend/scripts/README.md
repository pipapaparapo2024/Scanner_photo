# Скрипты для работы с базой данных

## Добавление тестовых сканов

Скрипт `add-test-scans.ts` позволяет добавить тестовые сканы в базу данных для проверки пагинации.

### Использование

**Для PowerShell (Windows):**
```powershell
cd backend
npx ts-node scripts/add-test-scans.ts "userId" 50
```

**Для Bash (macOS/Linux):**
```bash
cd backend
npx ts-node scripts/add-test-scans.ts userId 50
```

### Параметры

- `userId` (обязательный) - ID пользователя из Firebase Auth (uid). В PowerShell нужно использовать кавычки.
- `count` (опциональный) - количество сканов для добавления (по умолчанию 50)

### Пример

**PowerShell:**
```powershell
# Добавить 50 тестовых сканов для пользователя
npx ts-node scripts/add-test-scans.ts "abc123def456"

# Добавить 100 тестовых сканов
npx ts-node scripts/add-test-scans.ts "abc123def456" 100
```

**Bash:**
```bash
# Добавить 50 тестовых сканов для пользователя
npx ts-node scripts/add-test-scans.ts abc123def456

# Добавить 100 тестовых сканов
npx ts-node scripts/add-test-scans.ts abc123def456 100
```

### Как получить userId

1. Откройте Firebase Console → Authentication
2. Найдите пользователя по email
3. Скопируйте UID (User ID)

### Примечание

Скрипт создает сканы с разными датами (последние 30 дней) для более реалистичного тестирования пагинации и группировки.
