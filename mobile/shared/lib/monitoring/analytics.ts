/**
 * Firebase Analytics
 * Отслеживание событий и поведения пользователей
 * 
 * Бесплатный план: до 500 уникальных событий
 */

import { getAnalytics, logEvent as _logEvent, setUserProperty as _setUserProperty, setUserId as _setUserId } from "@react-native-firebase/analytics";

let analyticsInitialized = false;

/**
 * Инициализация Analytics
 */
export async function initAnalytics() {
  if (analyticsInitialized) {
    return;
  }

  try {
    // Analytics включается автоматически при использовании modular API
    // Но мы можем вызвать getAnalytics() для проверки
    const analytics = getAnalytics();
    
    if (!analytics) {
      console.warn("[Analytics] Module not available");
      return;
    }
    
    analyticsInitialized = true;
    console.log("[Analytics] Initialized");
  } catch (error) {
    console.warn("[Analytics] Failed to initialize (non-critical):", error);
    // Не блокируем запуск приложения, если Analytics не работает
  }
}

/**
 * Логировать событие
 */
export async function logEvent(
  eventName: string,
  parameters?: Record<string, any>
) {
  if (!analyticsInitialized) {
    // Попытка инициализации если еще не было
    try {
        getAnalytics();
        analyticsInitialized = true;
    } catch(e) { return; }
  }
  
  try {
    await _logEvent(getAnalytics(), eventName, parameters);
  } catch (error) {
    // Не логируем ошибки, чтобы не засорять консоль
    if (__DEV__) {
      console.warn(`[Analytics] Failed to log event ${eventName}:`, error);
    }
  }
}

/**
 * Установить свойство пользователя
 */
export async function setUserProperty(name: string, value: string) {
  if (!analyticsInitialized) return;
  
  try {
    await _setUserProperty(getAnalytics(), name, value);
  } catch (error) {
    if (__DEV__) {
      console.warn(`[Analytics] Failed to set user property ${name}:`, error);
    }
  }
}

/**
 * Установить ID пользователя
 */
export async function setUserId(userId: string) {
  if (!analyticsInitialized) return;
  
  try {
    await _setUserId(getAnalytics(), userId);
  } catch (error) {
    if (__DEV__) {
      console.warn("[Analytics] Failed to set user ID:", error);
    }
  }
}

/**
 * Очистить ID пользователя (при выходе)
 */
export async function clearUserId() {
    if (!analyticsInitialized) return;
    try {
        await _setUserId(getAnalytics(), null);
    } catch (error) {
        if (__DEV__) {
            console.warn("[Analytics] Failed to clear user ID:", error);
        }
    }
}
