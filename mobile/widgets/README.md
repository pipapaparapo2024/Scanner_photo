# widgets/ - Композитные блоки

Переиспользуемые блоки, состоящие из features и entities.

## Структура

- `ScanHistoryList/` - Список истории сканов (использует `features/scan-history`)
- `CreditBalance/` - Виджет баланса кредитов (использует `entities/user`)
- `CameraView/` - Обёртка камеры с кнопками (использует `features/camera-scan`)

## Правила

- Композирует несколько features/entities
- Импортирует из `shared`, `entities`, `features`
- Переиспользуется на разных страницах

