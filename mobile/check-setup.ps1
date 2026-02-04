# Скрипт проверки готовности к запуску

Write-Host "🔍 Проверка готовности проекта к запуску..." -ForegroundColor Cyan
Write-Host ""

$errors = @()

# Проверка Node.js
Write-Host "1. Проверка Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -ge 18) {
        Write-Host " ✅ $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host " ❌ Версия $nodeVersion (требуется >= 18)" -ForegroundColor Red
        $errors += "Node.js версия должна быть >= 18"
    }
} catch {
    Write-Host " ❌ Node.js не установлен" -ForegroundColor Red
    $errors += "Установите Node.js версии >= 18"
}

# Проверка зависимостей
Write-Host "2. Проверка зависимостей..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " ✅ Установлены" -ForegroundColor Green
} else {
    Write-Host " ❌ Не установлены" -ForegroundColor Red
    Write-Host "   Запустите: npm install" -ForegroundColor Yellow
    $errors += "Зависимости не установлены"
}

# Проверка google-services.json
Write-Host "3. Проверка Firebase конфигурации..." -NoNewline
$googleServicesPath = "android\app\google-services.json"
if (Test-Path $googleServicesPath) {
    $content = Get-Content $googleServicesPath -Raw
    if ($content -match "YOUR_PROJECT" -or $content -match "YOUR_API_KEY") {
        Write-Host " ⚠️  Файл-заглушка найден" -ForegroundColor Yellow
        Write-Host "   Нужно заменить на реальный из Firebase Console" -ForegroundColor Yellow
    } else {
        Write-Host " ✅ Настроен" -ForegroundColor Green
    }
} else {
    Write-Host " ❌ Не найден" -ForegroundColor Red
    Write-Host "   Создайте проект в Firebase и добавьте google-services.json" -ForegroundColor Yellow
    $errors += "google-services.json не найден"
}

# Проверка Android SDK
Write-Host "4. Проверка Android SDK..." -NoNewline
$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) {
    $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
}

if (Test-Path $sdkPath) {
    Write-Host " ✅ Найден в $sdkPath" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Не найден автоматически" -ForegroundColor Yellow
    Write-Host "   Убедитесь, что Android Studio установлен" -ForegroundColor Yellow
}

# Проверка эмулятора/устройства
Write-Host "5. Проверка подключенных устройств..." -NoNewline
try {
    $devices = adb devices 2>&1
    if ($devices -match "device$") {
        Write-Host " ✅ Устройство подключено" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Устройства не найдены" -ForegroundColor Yellow
        Write-Host "   Запустите эмулятор в Android Studio или подключите устройство" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠️  ADB не найден в PATH" -ForegroundColor Yellow
}

Write-Host ""
if ($errors.Count -eq 0) {
    Write-Host "✅ Проект готов к запуску!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Следующие шаги:" -ForegroundColor Cyan
    Write-Host "1. Запустите Metro bundler: npm start" -ForegroundColor White
    Write-Host "2. В другом терминале: npm run android" -ForegroundColor White
} else {
    Write-Host "❌ Найдены проблемы:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

