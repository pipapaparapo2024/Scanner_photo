# Скрипт для автоматической очистки и установки приложения
# Использование: .\scripts\clean-and-install.ps1

Write-Host "🧹 Очистка старого приложения..." -ForegroundColor Yellow

# Проверяем, подключен ли эмулятор
$devices = adb devices
if ($devices -notmatch "device$") {
    Write-Host "⚠️  Эмулятор не подключен. Запустите эмулятор и попробуйте снова." -ForegroundColor Red
    exit 1
}

# Удаляем старое приложение
Write-Host "📦 Удаление старого приложения..." -ForegroundColor Cyan
adb uninstall com.scanimg 2>&1 | Out-Null

# Очищаем кеш приложения (если оно еще установлено)
Write-Host "🗑️  Очистка кеша..." -ForegroundColor Cyan
adb shell pm clear com.scanimg 2>&1 | Out-Null

# Очищаем временные файлы
Write-Host "🧽 Очистка временных файлов..." -ForegroundColor Cyan
adb shell rm -rf /data/local/tmp/*.apk 2>&1 | Out-Null
adb shell rm -rf /data/local/tmp/* 2>&1 | Out-Null

# Проверяем свободное место
Write-Host "💾 Проверка свободного места..." -ForegroundColor Cyan
$storage = adb shell df -h /data | Select-String "/data"
Write-Host $storage -ForegroundColor Gray

Write-Host "✅ Очистка завершена. Запуск установки..." -ForegroundColor Green
Write-Host ""

# Запускаем установку
npm run android
