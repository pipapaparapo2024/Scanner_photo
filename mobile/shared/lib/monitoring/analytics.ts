/**
 * Firebase Analytics
 * Отслеживание событий и поведения пользователей
 * 
 * Бесплатный план: до 500 уникальных событий
 */

let analyticsInitialized = false;

/**
 * Инициализация Analytics
 */
export async function initAnalytics() {
  if (analyticsInitialized) {
    return;
  }

  try {
    const analyticsModule = await import("@react-native-firebase/analytics");
    const analytics = analyticsModule.default || analyticsModule;
    
    if (!analytics) {
      console.warn("[Analytics] Module not available");
      return;
    }
    
    // Analytics включается автоматически
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
  if (!analyticsInitialized) return;
  
  try {
    const analyticsModule = await import("@react-native-firebase/analytics");
    const analytics = analyticsModule.default || analyticsModule;
    if (analytics && typeof analytics === 'function') {
      await analytics().logEvent(eventName, parameters);
    }
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
    const analyticsModule = await import("@react-native-firebase/analytics");
    const analytics = analyticsModule.default || analyticsModule;
    if (analytics && typeof analytics === 'function') {
      await analytics().setUserProperty(name, value);
    }
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
    const analyticsModule = await import("@react-native-firebase/analytics");
    const analytics = analyticsModule.default || analyticsModule;
    if (analytics && typeof analytics === 'function') {
      await analytics().setUserId(userId);
    }
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
    const analyticsModule = await import("@react-native-firebase/analytics");
    const analytics = analyticsModule.default || analyticsModule;
    if (analytics && typeof analytics === 'function') {
      await analytics().setUserId(null);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[Analytics] Failed to clear user ID:", error);
    }
  }
}

/**
 * Предопределенные события для приложения
 */
export const AnalyticsEvents = {
  // Сканирование
  SCAN_STARTED: "scan_started",
  SCAN_COMPLETED: "scan_completed",
  SCAN_FAILED: "scan_failed",
  SCAN_DELETED: "scan_deleted",
  
  // Авторизация
  USER_REGISTERED: "user_registered",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  
  // Монетизация
  PURCHASE_STARTED: "purchase_started",
  PURCHASE_COMPLETED: "purchase_completed",
  PURCHASE_FAILED: "purchase_failed",
  AD_REWARD_VIEWED: "ad_reward_viewed",
  
  // Навигация
  SCREEN_VIEWED: "screen_viewed",
  
  // Обратная связь
  FEEDBACK_SUBMITTED: "feedback_submitted",
} as const;
