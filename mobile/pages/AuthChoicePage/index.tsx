import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import type { RootStackParamList } from "../../app/router/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthChoice">;

/**
 * Страница выбора авторизации или входа
 */
export function AuthChoicePage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleRegister = () => {
    navigation.navigate("RegisterEmail");
  };

  const handleLogin = () => {
    navigation.navigate("LoginEmail");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t("auth.welcome")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.choose_method")}
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleRegister}
          testID="e2e-auth-register"
        >
          <Text style={styles.buttonText}>{t("auth.register")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: theme.borderColor }]}
          onPress={handleLogin}
          testID="e2e-auth-login"
        >
          <Text style={[styles.buttonTextSecondary, { color: theme.text }]}>{t("auth.login")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
  },
});

