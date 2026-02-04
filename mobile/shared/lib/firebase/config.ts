import { getApp, getApps } from "@react-native-firebase/app";

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
  // @react-native-firebase/app автоматически инициализирует 'default' приложение
  // если есть google-services.json
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Если приложений нет, это странно для RNFirebase (если есть конфиг файл)
    // Попробуем получить default app, это может выбросить ошибку, если инициализация не прошла
    try {
      app = getApp();
    } catch (e) {
      console.warn("[Firebase] No apps initialized. Check google-services.json placement.");
    }
  }
} catch (error) {
  console.error("[Firebase] Initialization error:", error);
}

export default app;
