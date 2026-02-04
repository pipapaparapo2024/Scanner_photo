import React from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

/**
 * Страница загрузки приложения
 * Показывается во время инициализации Firebase и проверки авторизации
 */
export function SplashPage() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Image 
          source={require("../../assets/app_icon.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator 
          size="large" 
          color={theme.primary} 
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 40,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
