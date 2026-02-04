# Полная очистка Gradle кэша для scanImg

Write-Host "🧹 Начинаем полную очистку Gradle кэша..." -ForegroundColor Cyan

# Останавливаем процессы
Write-Host "⏹️ Останавливаем процессы node и gradle..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process gradle -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Удаляем кэш Gradle
Write-Host "🗑️ Удаляем Gradle кэш..." -ForegroundColor Yellow
$gradleCachePath = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCachePath) {
    Remove-Item -Path $gradleCachePath -Recurse -Force
    Write-Host "✅ Gradle кэш удалён" -ForegroundColor Green
} else {
    Write-Host "⚠️ Gradle кэш не найден" -ForegroundColor Gray
}

# Удаляем build папки
Write-Host "🗑️ Удаляем build папки..." -ForegroundColor Yellow
$buildPaths = @("android\build", "android\app\build", "android\.cxx")
foreach ($path in $buildPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Host "✅ $path удалёна" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ Очистка завершена! Теперь запустите:" -ForegroundColor Cyan
Write-Host "   npm run android" -ForegroundColor White
