# Скрипт для остановки всех процессов Metro и перезапуска с очисткой кеша

Write-Host "=== Остановка процессов на порту 8081 ===" -ForegroundColor Cyan

# Остановить процессы на порту 8081
$processes = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "Останавливаю процесс: $pid" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "Процессы остановлены" -ForegroundColor Green
} else {
    Write-Host "Процессов на порту 8081 не найдено" -ForegroundColor Green
}

# Остановить все Node процессы
Write-Host "`n=== Остановка всех Node процессов ===" -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "Останавливаю Node процесс: $($proc.Id)" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "Node процессы остановлены" -ForegroundColor Green
} else {
    Write-Host "Node процессов не найдено" -ForegroundColor Green
}

# Очистка кеша Metro
Write-Host "`n=== Очистка кеша Metro ===" -ForegroundColor Cyan
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".metro" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Кеш очищен" -ForegroundColor Green

# Запуск Metro с очисткой кеша
Write-Host "`n=== Запуск Metro bundler ===" -ForegroundColor Cyan
Write-Host "Metro bundler запускается с --reset-cache..." -ForegroundColor Yellow
Write-Host "Нажмите Ctrl+C чтобы остановить" -ForegroundColor Gray
Write-Host ""

npm start -- --reset-cache

