/**
 * Централизованный модуль мониторинга
 * Объединяет Sentry, Performance Monitoring и Analytics
 */

import { initSentry, captureException, setUser as setSentryUser, clearUser as clearSentryUser } from "./sentry";
import { initPerformanceMonitoring, tracePerformance } from "./performance";
import { initAnalytics, logEvent, setUserId, clearUserId, AnalyticsEvents } from "./analytics";

/**
 * Инициализировать все системы мониторинга
 */
export async function initMonitoring() {
  try {
    // Инициализируем все параллельно
    await Promise.all([
      initSentry(),
      initPerformanceMonitoring(),
      initAnalytics(),
    ]);
    console.log("[Monitoring] All systems initialized");
  } catch (error) {
    console.error("[Monitoring] Failed to initialize:", error);
  }
}

/**
 * Установить пользователя во всех системах мониторинга
 */
export async function setUser(userId: string, email?: string) {
  await Promise.all([
    setSentryUser(userId, email),
    setUserId(userId),
  ]);
}

/**
 * Очистить данные пользователя (при выходе)
 */
export async function clearUser() {
  await Promise.all([
    clearSentryUser(),
    clearUserId(),
  ]);
}

// Экспортируем все функции
export {
  captureException,
  tracePerformance,
  logEvent,
  AnalyticsEvents,
};
