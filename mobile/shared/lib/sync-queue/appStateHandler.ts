/**
 * AppState Handler
 * Обработка изменений состояния приложения для синхронизации
 */

import { AppState, AppStateStatus } from "react-native";
import type { SyncWorker } from "./syncWorker";

let syncWorker: SyncWorker | null = null;
let appStateSubscription: any = null;

/**
 * Инициализировать обработчик AppState
 */
export function initAppStateHandler(worker: SyncWorker): () => void {
  syncWorker = worker;

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      // Приложение вернулось на передний план - возобновить синхронизацию
      console.log("[AppStateHandler] App became active, resuming sync");
      syncWorker?.resume();
    } else if (nextAppState === "background") {
      // Приложение ушло в фон - приостановить синхронизацию
      console.log("[AppStateHandler] App went to background, pausing sync");
      syncWorker?.pause();
    }
  };

  // Подписываемся на изменения состояния
  appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

  // Возвращаем функцию очистки
  return () => {
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    syncWorker = null;
  };
}
