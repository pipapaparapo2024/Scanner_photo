import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { signInWithEmailAndPassword } from "../../shared/lib/firebase/auth";
import { logEvent, AnalyticsEvents, captureException } from "../../shared/lib/monitoring";
import { showToast } from "../../shared/ui/Toast";
import type { RootStackParamList } from "../../app/router/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "LoginEmail">;

/**
 * Страница ввода email и пароля для входа
 */
export function LoginEmailPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast(t("auth.fill_all_fields"), "error");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Добавляем таймаут для предотвращения вечной загрузки
      const loginPromise = signInWithEmailAndPassword(email, password);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(t("auth.timeout_error", { defaultValue: "Превышено время ожидания. Попробуйте еще раз." }))), 15000);
      });

      await Promise.race([loginPromise, timeoutPromise]);
      
      // Отслеживаем успешный вход
      await logEvent(AnalyticsEvents.USER_LOGGED_IN, {
        method: "email",
      });
      
      // Firebase Auth автоматически сохраняет сессию
      // Успешный вход - переходим на экран аккаунта
      navigation.reset({
        index: 0,
        routes: [{
          name: "MainTabs",
          state: {
            routes: [{ name: "Account" }],
          },
        }],
      });
    } catch (error: any) {
      const errorMessage = error.message || t("auth.login_error_title");
      
      // Отслеживаем ошибку входа
      const err = error instanceof Error ? error : new Error(errorMessage);
      captureException(err, {
        tags: { feature: "auth", action: "login" },
      });
      
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t("auth.login_title")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.login_subtitle")}
        </Text>

        <View style={[styles.inputContainer, { borderColor: theme.borderColor }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t("auth.email_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputContainer, { borderColor: theme.borderColor }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t("auth.password_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t("auth.logging_in") : t("auth.login_button")}
          </Text>
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
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
