import { getApp, getApps, initializeApp } from "@react-native-firebase/app";

/**
 * Конфигурация Firebase для клиентского приложения
 * 
 * Для работы нужно:
 * 1. Скачать google-services.json (Android) и GoogleService-Info.plist (iOS) из Firebase Console
 * 2. Поместить их в android/app/ и ios/ соответственно
 * 3. Firebase автоматически инициализируется при запуске приложения
 */

// Получаем или инициализируем Firebase приложение
let app;
try {
  if (getApps().length === 0) {
    // Firebase автоматически инициализируется из google-services.json / GoogleService-Info.plist
    // Если нужно явно инициализировать, можно использовать:
    // app = initializeApp({ ... })
    app = getApp();
  } else {
    app = getApp();
  }
} catch (error) {
  // Если приложение еще не инициализировано, Firebase автоматически инициализируется
  app = getApp();
}

export default app;

