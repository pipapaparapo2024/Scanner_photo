# Скрипт для запуска Android приложения

Write-Host "🚀 Запуск Android приложения..." -ForegroundColor Cyan
Write-Host ""

# Проверка подключенных устройств
Write-Host "Проверка устройств..." -NoNewline
$devices = adb devices 2>&1
if ($devices -match "device$") {
    Write-Host " ✅ Устройство найдено" -ForegroundColor Green
} else {
    Write-Host " ❌ Устройства не найдены" -ForegroundColor Red
    Write-Host ""
    Write-Host "Пожалуйста:" -ForegroundColor Yellow
    Write-Host "1. Запустите Android эмулятор в Android Studio" -ForegroundColor White
    Write-Host "   ИЛИ подключите физическое устройство с включенной отладкой по USB" -ForegroundColor White
    Write-Host ""
    Write-Host "Затем запустите этот скрипт снова." -ForegroundColor Yellow
    exit 1
}

# Проверка Metro bundler
Write-Host "Проверка Metro bundler..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ Запущен" -ForegroundColor Green
    }
} catch {
    Write-Host " ⚠️  Не запущен" -ForegroundColor Yellow
    Write-Host "   Запускаю Metro bundler..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized
    Write-Host "   Подождите 10 секунд..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Запуск приложения
Write-Host ""
Write-Host "Запуск приложения на Android..." -ForegroundColor Cyan
Write-Host ""

npm run android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Приложение успешно запущено!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Ошибка при запуске. Проверьте логи выше." -ForegroundColor Red
}

