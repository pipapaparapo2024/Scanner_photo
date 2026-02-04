# Скрипт для освобождения порта 8081 (Metro bundler)

Write-Host "🔍 Поиск процессов, использующих порт 8081..." -ForegroundColor Cyan

$processes = netstat -ano | findstr :8081

if ($processes) {
    Write-Host "Найдены процессы на порту 8081:" -ForegroundColor Yellow
    $processes | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Извлекаем PID
    $pids = $processes | ForEach-Object {
        if ($_ -match '\s+(\d+)$') {
            $matches[1]
        }
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Остановка процесса: $($proc.ProcessName) (PID: $pid)..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "✅ Процесс остановлен" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Не удалось остановить процесс $pid: $_" -ForegroundColor Yellow
            # Попробуем через taskkill
            try {
                taskkill /F /PID $pid 2>&1 | Out-Null
                Write-Host "✅ Процесс остановлен через taskkill" -ForegroundColor Green
            } catch {
                Write-Host "❌ Не удалось остановить процесс" -ForegroundColor Red
            }
        }
    }
    
    Start-Sleep -Seconds 2
    
    # Проверяем снова
    $remaining = netstat -ano | findstr :8081
    if ($remaining) {
        Write-Host "⚠️  Порт 8081 все еще занят" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Порт 8081 освобожден!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Теперь можно запустить Metro bundler:" -ForegroundColor Cyan
        Write-Host "  npm start" -ForegroundColor White
    }
} else {
    Write-Host "✅ Порт 8081 свободен" -ForegroundColor Green
}

