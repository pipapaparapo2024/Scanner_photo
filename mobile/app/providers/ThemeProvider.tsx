import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode, ThemeColors } from "../../shared/config/theme";
import { getTheme, lightTheme } from "../../shared/config/theme";

interface ThemeContextValue {
  theme: ThemeColors;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "@scanimg:theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Провайдер темы приложения
 * Управляет темой (light/dark) с сохранением в AsyncStorage
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(systemColorScheme === "dark" ? "dark" : "light");
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Загружаем сохраненную тему при старте
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Сохраняем тему при изменении с плавной анимацией (без резкого переключения)
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      // Плавная анимация перехода БЕЗ резкого мигания - меняем тему СРАЗУ, анимация только для плавности
      // Устанавливаем тему сначала
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // Плавная анимация только для визуального эффекта, без мигания
      Animated.timing(fadeAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === "light" ? "dark" : "light");
  };

  const theme = getTheme(themeMode);

  // Пока загружаем тему, используем светлую
  if (isLoading) {
    return null; // Можно вернуть загрузку, но обычно достаточно просто рендерить со светлой темой
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ThemeContext.Provider
        value={{
          theme,
          themeMode,
          toggleTheme,
          setThemeMode,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </Animated.View>
  );
}

/**
 * Хук для использования темы в компонентах
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Возвращаем светлую тему по умолчанию, если контекст не найден
    return {
      theme: lightTheme,
      themeMode: "light",
      toggleTheme: () => {},
      setThemeMode: () => {},
    };
  }
  return context;
}

