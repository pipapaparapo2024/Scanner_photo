import { AppRegistry, LogBox } from "react-native";
import App from "./App";
import { initMonitoring } from "../shared/lib/monitoring";
import { initCloudStorage } from "../shared/lib/cloud-storage/init";

/**
 * Точка входа приложения
 * Регистрирует корневой компонент для React Native
 */
const APP_NAME = "scanimg-mobile";

// Игнорируем логи Sentry и ErrorLogger в UI
LogBox.ignoreLogs([
  "[Sentry]",
  "[ErrorLogger]",
  "Sentry Logger",
  "Error captured",
  "Require cycle:",
]);

// Инициализируем мониторинг и облачные сервисы перед запуском приложения
Promise.all([initMonitoring(), initCloudStorage()])
  .then(() => {
    console.log("[App] Services initialized, registering component");
    AppRegistry.registerComponent(APP_NAME, () => App);
  })
  .catch((error) => {
    console.error("[App] Failed to initialize services:", error);
    // Все равно регистрируем компонент, даже если сервисы не инициализированы
    AppRegistry.registerComponent(APP_NAME, () => App);
  });

