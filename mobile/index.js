import { AppRegistry } from "react-native";
import App from "./app/App";
import { initMonitoring } from "./shared/lib/monitoring";

// Инициализируем системы мониторинга как можно раньше
initMonitoring();

/**
 * Точка входа приложения
 * Регистрирует корневой компонент для React Native
 */
const APP_NAME = "scanimg-mobile";

AppRegistry.registerComponent(APP_NAME, () => App);
