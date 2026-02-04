/**
 * Конфигурация тем приложения
 */

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryDark: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  border: string;
  borderColor: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  // Semantic colors for buttons
  buttonText: string;
  disabledBackground: string;
  disabledText: string;
}

export const lightTheme: ThemeColors = {
  background: "#F5F5F5",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  primary: "#4A90E2",
  primaryDark: "#357ABD",
  error: "#FF6B6B",
  success: "#4CAF50",
  warning: "#FFA726",
  info: "#29B6F6",
  border: "#E0E0E0",
  borderColor: "#E0E0E0",
  tabBarBackground: "#FFFFFF",
  tabBarActive: "#4A90E2",
  tabBarInactive: "#666666",
  buttonText: "#FFFFFF",
  disabledBackground: "#E0E0E0",
  disabledText: "#999999",
};

export const darkTheme: ThemeColors = {
  background: "#000000", // Чистый черный
  surface: "#1A1A1A", // Темно-серый
  text: "#FFFFFF", // Белый текст
  textSecondary: "#999999", // Серый вторичный текст
  primary: "#4A90E2", // Синий как в светлой теме
  primaryDark: "#357ABD", // Темно-синий
  error: "#FF6B6B", // Красный (ярче для темной темы)
  success: "#4CAF50", // Зеленый
  warning: "#FFA726", // Оранжевый
  info: "#0288D1", // Темно-голубой
  border: "#2A2A2A", // Серый бордер
  borderColor: "#2A2A2A",
  tabBarBackground: "#0A0A0A", // Почти черный
  tabBarActive: "#CCCCCC", // Светло-серый активный
  tabBarInactive: "#666666", // Серый неактивный
  buttonText: "#FFFFFF",
  disabledBackground: "#3A3A3A",
  disabledText: "#666666",
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  return mode === "dark" ? darkTheme : lightTheme;
};

