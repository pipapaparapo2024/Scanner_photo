import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { createUserAfterVerification, getIdToken } from "../../shared/lib/firebase/auth";
import { updateUser } from "../../entities/user/api/userApi";
import { apiClient } from "../../shared/lib/api";
import { logEvent, AnalyticsEvents, captureException } from "../../shared/lib/monitoring";
import { showToast } from "../../shared/ui/Toast";
import type { RootStackParamList } from "../../app/router/types";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterPassword">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RegisterPassword">;

/**
 * Страница ввода пароля для завершения регистрации
 */
export function RegisterPasswordPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props["route"]>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { email } = route.params;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // Валидация
    if (!password.trim()) {
      showToast(t("auth.enter_password_error"), "error");
      return;
    }

    if (password.length < 6) {
      showToast(t("auth.password_min_length"), "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast(t("auth.password_mismatch_error"), "error");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createUserAfterVerification(email, password);
      
      // Явно устанавливаем токен для apiClient, так как effect в useUser может не успеть отработать
      try {
        const token = await getIdToken(true);
        if (token) {
          apiClient.setAuthToken(token);
        }
      } catch (tokenErr) {
        console.error("Failed to sync token after registration:", tokenErr);
      }

      // Сохраняем язык пользователя (русский по умолчанию при регистрации)
      try {
        await updateUser({ language: 'ru' });
      } catch (langErr) {
        console.error("Failed to set initial language:", langErr);
        // Не блокируем успешную регистрацию из-за ошибки сохранения языка
      }
      
      // Отслеживаем успешную регистрацию
      await logEvent(AnalyticsEvents.USER_REGISTERED, {
        method: "email",
      });
      
      showToast(t("auth.registration_success_message"), "success");
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error: any) {
      // Отслеживаем ошибку регистрации
      const err = error instanceof Error ? error : new Error(String(error));
      captureException(err, {
        tags: { feature: "auth", action: "register" },
      });
      setError(error.message || t("common.error"));
      showToast(error.message || t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t("auth.create_password_title")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.create_password_subtitle")}
        </Text>

        <View style={[styles.inputContainer, { borderColor: error ? theme.error : theme.borderColor }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t("auth.password_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={[styles.eyeButtonText, { color: theme.textSecondary }]}>
              {showPassword ? t("auth.hide") : t("auth.show")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { borderColor: error ? theme.error : theme.borderColor }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t("auth.confirm_password_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError("");
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Text style={[styles.eyeButtonText, { color: theme.textSecondary }]}>
              {showConfirmPassword ? t("auth.hide") : t("auth.show")}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        ) : null}

        <View style={styles.hintContainer}>
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
            {t("auth.password_min_length")}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t("auth.creating_account") : t("auth.complete_registration")}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    fontSize: 16,
    flex: 1,
  },
  eyeButton: {
    padding: 4,
  },
  eyeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  hintContainer: {
    marginBottom: 20,
  },
  hintText: {
    fontSize: 12,
    textAlign: "center",
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
