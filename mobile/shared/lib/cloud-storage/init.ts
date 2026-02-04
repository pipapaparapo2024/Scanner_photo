/**
 * Cloud Storage Initialization
 * Инициализация облачных сервисов при запуске приложения
 */

import { initGoogleSignIn } from "./googleDriveAuth";
import { initYandexOAuth } from "./yandexDiskAuth";

// TODO: Эти значения должны быть получены из конфигурации приложения
// Можно добавить в .env или в конфигурационный файл
const GOOGLE_WEB_CLIENT_ID = ""; // Должен быть получен из Google Cloud Console
const YANDEX_CLIENT_ID = ""; // Должен быть получен из https://oauth.yandex.com

/**
 * Инициализировать облачные сервисы
 * Вызывается один раз при запуске приложения
 */
export async function initCloudStorage(): Promise<void> {
  try {
    // Инициализируем Google Sign-In если есть Client ID
    if (GOOGLE_WEB_CLIENT_ID) {
      await initGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
      console.log("[CloudStorage] Google Sign-In initialized");
    } else {
      console.warn("[CloudStorage] Google Web Client ID not configured");
    }

    // Инициализируем Яндекс OAuth если есть Client ID
    if (YANDEX_CLIENT_ID) {
      initYandexOAuth(YANDEX_CLIENT_ID);
      console.log("[CloudStorage] Yandex OAuth initialized");
    } else {
      console.warn("[CloudStorage] Yandex Client ID not configured");
    }
  } catch (error) {
    console.error("[CloudStorage] Failed to initialize:", error);
    // Не блокируем запуск приложения при ошибке инициализации
  }
}
