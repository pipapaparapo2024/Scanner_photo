# Mobile App - React Native OCR Scanner

Мобильное приложение для распознавания текста с изображений.

## Архитектура

Проект использует **Feature-Sliced Design (FSD)** архитектуру:

- `app/` - Инициализация приложения, провайдеры, роутинг
- `pages/` - Полноценные экраны приложения
- `widgets/` - Композитные переиспользуемые блоки
- `features/` - Бизнес-фичи (camera-scan, scan-history, monetization, auth)
- `entities/` - Бизнес-сущности (user, scan)
- `shared/` - Переиспользуемый код (UI компоненты, утилиты, конфиги)

## Технологии

- React Native + TypeScript
- Firebase Auth (клиентский SDK)
- Google ML Kit (on-device OCR)
- React Navigation
- RuStore Pay SDK (нативный модуль)
- Яндекс Мобильная Реклама SDK (нативный модуль)

